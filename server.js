// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));
app.use(express.json());

// estado em memória
const viagens = {};

io.on('connection', (socket) => {
  console.log('[socket] conectado', socket.id);

  // envia snapshot inicial
  socket.emit('sistema.iniciado', { now: Date.now(), viagens: snapshotViagens() });

  socket.on('viagem.criada', (data) => {
    const { id, titulo, hora, poltronas } = data;
    if (viagens[id]) {
      socket.emit('error.operacao', { msg: 'Viagem já existe', id });
      return;
    }
    const pol = {};
    poltronas.forEach(p => pol[p] = { status: 'available', reservedBy: null, reservedByName: null, timeoutAt: null });
    viagens[id] = { id, titulo, hora, poltronas: pol, aberto: true };
    io.emit('viagem.criada', { viagem: viagens[id] });
    console.log('[evento] viagem.criada', id);
  });

  socket.on('poltrona.reservada', ({ viagemId, poltrona, nome }) => {
    const v = viagens[viagemId];
    if (!v) { socket.emit('error.operacao', { msg: 'Viagem não encontrada' }); return; }
    if (!v.aberto) { socket.emit('error.operacao', { msg: 'Vendas encerradas' }); return; }
    const p = v.poltronas[poltrona];
    if (!p) { socket.emit('error.operacao', { msg: 'Poltrona inválida' }); return; }
    if (p.status !== 'available') { socket.emit('error.operacao', { msg: 'Poltrona não disponível' }); return; }

    p.status = 'reserved';
    p.reservedBy = socket.id;
    p.reservedByName = nome || 'Anônimo';
    const RESERVA_MS = 2 * 60 * 1000; // 2 minutos
    p.timeoutAt = Date.now() + RESERVA_MS;
    p._timeout = setTimeout(() => {
      if (p.status === 'reserved' && p.reservedBy === socket.id) {
        p.status = 'available';
        p.reservedBy = null;
        p.reservedByName = null;
        p.timeoutAt = null;
        delete p._timeout;
        io.emit('reserva.expirada', { viagemId, poltrona });
        console.log('[evento] reserva.expirada', viagemId, poltrona);
      }
    }, RESERVA_MS);

    io.emit('poltrona.reservada', {
      viagemId, poltrona, reservedBy: socket.id, reservedByName: p.reservedByName, timeoutAt: p.timeoutAt
    });
    console.log('[evento] poltrona.reservada', viagemId, poltrona, 'por', socket.id);
  });

  socket.on('reserva.confirmar', ({ viagemId, poltrona }) => {
    const v = viagens[viagemId];
    if (!v) { socket.emit('error.operacao', { msg: 'Viagem não encontrada' }); return; }
    const p = v.poltronas[poltrona];
    if (!p) { socket.emit('error.operacao', { msg: 'Poltrona inválida' }); return; }
    if (p.status !== 'reserved' || p.reservedBy !== socket.id) {
      socket.emit('error.operacao', { msg: 'Você não possui essa reserva' }); return;
    }
    p.status = 'sold';
    p.soldBy = p.reservedByName || socket.id;
    p.reservedBy = null;
    p.reservedByName = null;
    p.timeoutAt = null;
    if (p._timeout) { clearTimeout(p._timeout); delete p._timeout; }
    io.emit('reserva.confirmada', { viagemId, poltrona, soldBy: p.soldBy });
    console.log('[evento] reserva.confirmada', viagemId, poltrona);
  });

  socket.on('viagem.encerrada', ({ viagemId }) => {
    const v = viagens[viagemId];
    if (!v) { socket.emit('error.operacao', { msg: 'Viagem não encontrada' }); return; }
    v.aberto = false;
    io.emit('viagem.encerrada', { viagemId });
    console.log('[evento] viagem.encerrada', viagemId);
  });

  socket.on('disconnect', () => {
    console.log('[socket] desconectado', socket.id);
  });
});

function snapshotViagens() {
  const s = {};
  for (const id in viagens) {
    const v = viagens[id];
    s[id] = {
      id: v.id, titulo: v.titulo, hora: v.hora, aberto: v.aberto,
      poltronas: Object.fromEntries(Object.entries(v.poltronas).map(([k,p]) => [
        k, { status: p.status, reservedByName: p.reservedByName || null, timeoutAt: p.timeoutAt || null, soldBy: p.soldBy || null }
      ]))
    };
  }
  return s;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Servidor rodando na porta', PORT));

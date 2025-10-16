const socket = io();

window.appState = { viagens: {} };

socket.on('sistema.iniciado', (data) => {
  window.appState.viagens = data.viagens || {};
  document.dispatchEvent(new CustomEvent('app.viagens.updated'));
});

socket.on('viagem.criada', ({ viagem }) => {
  window.appState.viagens[viagem.id] = viagem;
  document.dispatchEvent(new CustomEvent('app.viagens.updated'));
});

socket.on('poltrona.reservada', (payload) => {
  const { viagemId, poltrona, reservedByName, timeoutAt } = payload;
  if (!window.appState.viagens[viagemId]) return;
  window.appState.viagens[viagemId].poltronas[poltrona].status = 'reserved';
  window.appState.viagens[viagemId].poltronas[poltrona].reservedByName = reservedByName || null;
  window.appState.viagens[viagemId].poltronas[poltrona].timeoutAt = timeoutAt || null;
  document.dispatchEvent(new CustomEvent('app.viagens.updated'));
});

socket.on('reserva.expirada', ({ viagemId, poltrona }) => {
  if (!window.appState.viagens[viagemId]) return;
  window.appState.viagens[viagemId].poltronas[poltrona].status = 'available';
  window.appState.viagens[viagemId].poltronas[poltrona].reservedByName = null;
  window.appState.viagens[viagemId].poltronas[poltrona].timeoutAt = null;
  document.dispatchEvent(new CustomEvent('app.viagens.updated'));
});

socket.on('reserva.confirmada', ({ viagemId, poltrona, soldBy }) => {
  if (!window.appState.viagens[viagemId]) return;
  window.appState.viagens[viagemId].poltronas[poltrona].status = 'sold';
  window.appState.viagens[viagemId].poltronas[poltrona].soldBy = soldBy;
  document.dispatchEvent(new CustomEvent('app.viagens.updated'));
});

socket.on('viagem.encerrada', ({ viagemId }) => {
  if (window.appState.viagens[viagemId]) {
    window.appState.viagens[viagemId].aberto = false;
    document.dispatchEvent(new CustomEvent('app.viagens.updated'));
  }
});

socket.on('error.operacao', (err) => {
  alert('Erro: ' + (err.msg || 'Operação inválida'));
});

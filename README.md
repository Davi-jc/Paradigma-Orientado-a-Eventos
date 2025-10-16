# Paradigma-Orientado-a-Eventos
# Sistema de Passagens - Eventos Realtime (Node.js + Socket.IO)
Alunos: Davi Jefferson Chiquetti e Marcus André Geacomo Demarchi

- @Davi-jc
- @MarcuseDemarchi

## Estrutura do projeto
```
sistema-eventos/
├─ server.js
├─ package.json
└─ public/
   ├─ index.html        # View passageiro
   ├─ admin.html        # Painel admin
   ├─ style.css         # Estilo (responsivo, limpo)
   └─ script.js         # Comunicação via Socket.IO + helpers
```

## Como executar
1. Instale Node.js (versão 16+ recomendada).
2. No diretório do projeto:
   ```bash
   npm install
   npm start
   ```
3. Abra no navegador:
   - Admin: http://localhost:3000/admin.html
   - Passageiro: http://localhost:3000/index.html

## Eventos implementados
- `sistema.iniciado` — servidor envia snapshot atual ao conectar.
- `viagem.criada` — admin cria viagem (server -> all).
- `poltrona.reservada` — cliente tenta reservar; servidor notifica todos; reserva expira em 2 minutos.
- `reserva.confirmada` — servidor transforma reserva em venda (sold).
- `reserva.expirada` — reserva expirou; poltrona volta a available.
- `viagem.encerrada` — admin encerra vendas.

## Notas técnicas
- Estado em memória (simples para demonstração). Em produção, persistir em banco e usar transações.
- Timeout de reserva é controlado no servidor para evitar race conditions.
- Arquitetura orientada a eventos: emitir, escutar e reagir (emit/on) tanto no cliente quanto no servidor.

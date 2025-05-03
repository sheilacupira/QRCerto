const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', require('./authController.js'));

// Rota raiz
app.get('/', (_req, res) => res.send('Servidor do QRCerto está rodando!'));

// Rota 404
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado em http://localhost:${PORT}`);
});

module.exports = app; // <- Exporta o app (para testes ou deploy externo)

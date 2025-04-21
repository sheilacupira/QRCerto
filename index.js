// index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Rotas da API ──────────────────────────────────────
app.get('/', (_req, res) => res.send('Servidor do QRCerto está no ar! 🚀'));

app.use('/auth',              require('./authController'));
app.use('/api/turmas',        require('./turmaController'));
app.use('/api/notas',         require('./notasController'));
app.use('/api/importar-xlsx', require('./importarXlsxController'));
app.use('/api/qrcode',        require('./qrCodeController'));
app.use('/api/gabarito',      require('./gabaritoController'));
app.use('/api/correcao',      require('./correcaoController'));

// <<< AQUI >>> rota de escolas **ANTES** do 404
app.use('/api/escolas',       require('./escolasController'));

// ─── Arquivos estáticos ────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── 404 genérico ───────────────────────────────────────
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// ─── Iniciar servidor ───────────────────────────────────
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅  API rodando em http://0.0.0.0:${PORT}`)
);

// não ter NENHUM app.use **depois** deste ponto
module.exports = app;

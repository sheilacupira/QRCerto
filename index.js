require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Rota principal ────────────────────────────
app.get('/', (_req, res) => res.send('Servidor do QRCerto está no ar! 🚀'));

// ─── Rotas da API ──────────────────────────────
console.log('✅ Iniciando rotas principais...');
app.use('/auth', require('./authController.js'));
app.use('/api/turmas',        require('./turmaController.js'));
app.use('/api/notas',         require('./notasController.js'));
app.use('/api/importar-xlsx', require('./importarXlsxController.js'));
app.use('/api/qrcode',        require('./qrCodeController.js'));
app.use('/api/gabarito',      require('./gabaritoController.js'));
app.use('/api/correcao',      require('./correcaoController.js'));
app.use('/api/escolas',       require('./escolasController.js'));

// ─── Arquivos estáticos ────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── 404 genérico ──────────────────────────────
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// ─── Iniciar servidor ──────────────────────────
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ API rodando em http://0.0.0.0:${PORT}`)
);

module.exports = app;

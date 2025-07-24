require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); // <-- adicionado aqui!

const authRoutes     = require('./authController');
const turmaRoutes    = require('./turmaController');
const gabaritoRoutes = require('./gabaritoController');
const correcaoRoutes = require('./correcaoController');
const notasRoutes    = require('./notasController');
const escolasRoutes  = require('./escolasController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://qrcerto.onrender.com'],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());

// Servir QR codes estáticos (pasta uploads na raiz)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Montar rotas da API
app.use('/api/auth',     authRoutes);
app.use('/api/turmas',   turmaRoutes);
app.use('/api/gabarito', gabaritoRoutes);
app.use('/api/correcao', correcaoRoutes);
app.use('/api/notas',    notasRoutes);
app.use('/api/escolas',  escolasRoutes);

app.use((_, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = app;

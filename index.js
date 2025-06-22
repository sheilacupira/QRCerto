// index.js (na raiz do projeto)
require('dotenv').config();
const express = require('express');
const path = require('path');


// Importa controllers que estão na raiz\const authRoutes     = require('./authController');
const authRoutes     = require('./authController');
const turmaRoutes    = require('./turmaController');
const gabaritoRoutes = require('./gabaritoController');
const correcaoRoutes = require('./correcaoController');
const notasRoutes    = require('./notasController');
const escolasRoutes  = require('./escolasController');

const app = express();
const PORT = process.env.PORT || 3000;

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
// Inicia o servidor

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = app; // <- Exporta o app (para testes ou deploy externo)

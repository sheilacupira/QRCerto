const express = require('express');
const path = require('path');
require('dotenv').config();

// Importar rotas
const authRoutes     = require('./src/routes/authController');
const turmaRoutes    = require('./src/routes/turmaController');
const gabaritoRoutes = require('./src/routes/gabaritoController');
const correcaoRoutes = require('./src/routes/correcaoController');
const notasRoutes    = require('./src/routes/notasController');

const app = express();

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Servir arquivos estáticos (QR codes gerados)
app.use('/uploads', express.static(path.join(__dirname, 'src', 'routes', 'uploads')));

// Rotas da API com prefixo /api
app.use('/api/auth',     authRoutes);
app.use('/api/turmas',   turmaRoutes);
app.use('/api/gabarito', gabaritoRoutes);
app.use('/api/correcao', correcaoRoutes);
app.use('/api/notas',    notasRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});


module.exports = app; // <- Exporta o app (para testes ou deploy externo)

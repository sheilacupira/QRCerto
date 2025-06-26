// authController.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authMiddleware = require('./authMiddleware');
require('dotenv').config();

const router = express.Router();

const usuariosPath = path.join(__dirname, 'usuarios.json');
const tokensPath = path.join(__dirname, 'resetTokens.json');
const SECRET = process.env.JWT_SECRET || 'chave-padrao';

// === Helpers ===
function lerUsuarios() {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
}
function salvarUsuarios(usuarios) {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');
}
function lerTokens() {
  if (!fs.existsSync(tokensPath)) return {};
  return JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
}
function salvarTokens(tokens) {
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2), 'utf8');
}

// === Nodemailer ===
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Erro ao verificar SMTP:', err);
  } else {
    console.log('✅ SMTP pronto para envio de mensagens');
  }
});

// === ROTA: Login ===
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, funcao: usuario.funcao },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao
    }
  });
});

// === ROTA: Registro ===
router.post('/registro', async (req, res) => {
  const { nome, email, senha, funcao } = req.body;
  if (!nome || !email || !senha || !funcao) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' });
  }

  const usuarios = lerUsuarios();
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ mensagem: 'E-mail já cadastrado!' });
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    funcao,
    senha: await bcrypt.hash(senha, 10),
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
});

// === ROTA: Esqueci a Senha ===
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ mensagem: 'E-mail é obrigatório.' });

  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) return res.status(404).json({ mensagem: 'E-mail não cadastrado.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tokens = lerTokens();
  tokens[code] = email;
  salvarTokens(tokens);

  try {
    await transporter.sendMail({
      from: `"QR Certo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Código de recuperação de senha',
      text: `Olá ${usuario.nome},\n\nSeu código de recuperação de senha é: ${code}\n\nSe você não solicitou, ignore esta mensagem.`,
    });
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return res.status(500).json({ mensagem: 'Erro ao enviar o e-mail.' });
  }

  res.json({ mensagem: 'Código enviado por e-mail.' });
});

// === ROTA: Redefinir Senha ===
router.post('/resetar-senha', async (req, res) => {
  const { token: code, novaSenha } = req.body;
  if (!code || !novaSenha) {
    return res.status(400).json({ mensagem: 'Código e nova senha são obrigatórios.' });
  }

  const tokens = lerTokens();
  const email = tokens[code];
  if (!email) return res.status(400).json({ mensagem: 'Código inválido ou expirado.' });

  const usuarios = lerUsuarios();
  const idx = usuarios.findIndex(u => u.email === email);
  if (idx === -1) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

  usuarios[idx].senha = await bcrypt.hash(novaSenha, 10);
  salvarUsuarios(usuarios);

  delete tokens[code];
  salvarTokens(tokens);

  res.json({ mensagem: 'Senha redefinida com sucesso!' });
});

// === ROTA: Dados do Usuário Logado ===
router.get('/me', authMiddleware, (req, res) => {
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.id === req.usuario.id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  res.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    funcao: usuario.funcao
  });
});

// === Exporta o router ===
module.exports = router;

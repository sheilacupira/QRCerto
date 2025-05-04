const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const usuariosPath = path.join(__dirname, 'usuarios.json');
const SECRET = process.env.JWT_SECRET || 'chave-padrao';
const TOKEN_EXPIRATION = '1d';       // Expiração do JWT de acesso
const RECOVERY_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora para token de recuperação

// Funções auxiliares para ler e salvar usuários
const lerUsuarios = () => {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
};

const salvarUsuarios = (usuarios) => {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');
};

// Middleware para validar JWT de acesso
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não fornecido!' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // { id, nome, funcao }
    next();
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado!' });
  }
};

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios!' });
  }
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });
  }
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });
  }
  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, funcao: usuario.funcao }, 
    SECRET, 
    { expiresIn: TOKEN_EXPIRATION }
  );
  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      funcao: usuario.funcao,
      email: usuario.email
    }
  });
});

// ========== REGISTRO ==========
router.post('/registro', async (req, res) => {
  const { nome, email, senha, funcao } = req.body;
  if (!nome || !email || !senha || !funcao) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' });
  }
  const usuarios = lerUsuarios();
  if (usuarios.some(u => u.email === email)) {
    return res.status(409).json({ mensagem: 'E-mail já cadastrado!' });
  }
  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    funcao,
    senha: await bcrypt.hash(senha, 10),
    // Campos para recuperação de senha
    resetToken: null,
    resetExpires: null
  };
  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
});

// ========== ESQUECI SENHA ==========
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ mensagem: 'E-mail é obrigatório!' });
  }
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.status(404).json({ mensagem: 'E-mail não cadastrado!' });
  }
  // Gera token de recuperação curto
  const recoveryToken = jwt.sign({ id: usuario.id }, SECRET, { expiresIn: '1h' });
  usuario.resetToken = recoveryToken;
  usuario.resetExpires = Date.now() + RECOVERY_EXPIRATION_MS;
  salvarUsuarios(usuarios);
  // TODO: Enviar e-mail real contendo recoveryToken para o usuário
  return res.json({ mensagem: 'Token de recuperação gerado e salvo.', token: recoveryToken });
});

// ========== RESETAR SENHA ==========
router.post('/resetar-senha', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) {
    return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios!' });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    const usuarios = lerUsuarios();
    const usuario = usuarios.find(u => u.id === payload.id && u.resetToken === token);
    if (!usuario || !usuario.resetExpires || usuario.resetExpires < Date.now()) {
      return res.status(400).json({ mensagem: 'Token inválido ou expirado!' });
    }
    // Atualiza senha e limpa token de recuperação
    usuario.senha = await bcrypt.hash(novaSenha, 10);
    usuario.resetToken = null;
    usuario.resetExpires = null;
    salvarUsuarios(usuarios);
    return res.json({ mensagem: 'Senha atualizada com sucesso!' });
  } catch (err) {
    return res.status(400).json({ mensagem: 'Token inválido ou expirado!' });
  }
});

// ========== VALIDAÇÃO DE TOKEN ==========
router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, usuario: req.user });
});

// ========== ROTA DE TESTE ==========
router.get('/testar-usuarios', (_req, res) => {
  const usuarios = lerUsuarios().map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    funcao: u.funcao
  }));
  res.json(usuarios);
});

module.exports = router;

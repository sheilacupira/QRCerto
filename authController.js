const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const usuariosPath = path.join(__dirname, 'usuarios.json');
const SECRET = process.env.JWT_SECRET || 'chave-padrao';

const lerUsuarios = () => {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
};

const salvarUsuarios = (usuarios) => {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');
};

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  console.log('---- LOGIN DEBUG ----');
  console.log('REQ.BODY →', req.body);

  const { email, senha } = req.body;
  const usuarios = lerUsuarios();
  console.log('USUÁRIOS →', usuarios);

  const usuario = usuarios.find(u => u.email === email);
  console.log('ENCONTRADO →', usuario);

  if (!usuario) {
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos 1!' });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  console.log('HASH ARMAZENADO →', usuario.senha);
  console.log('COMPARE(senha, hash) →', senhaCorreta);

  if (!senhaCorreta) {
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos 2!' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, funcao: usuario.funcao },
    SECRET,
    { expiresIn: '1d' }
  );

  console.log('TOKEN GERADO →', token);
  res.json({
    token,
    usuario: {
      nome: usuario.nome,
      funcao: usuario.funcao,
      email: usuario.email,
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
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ mensagem: 'E-mail já cadastrado!' });
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    funcao,
    senha: await bcrypt.hash(senha, 10)
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
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

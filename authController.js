// authController.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();
const usuariosPath = path.join(__dirname, 'usuarios.json');
const SECRET = 'chave-secreta-do-token';

// ========== UTILITÁRIOS ==========
const lerUsuarios = () => {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
};
const salvarUsuarios = (usuarios) => {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');
};

// ========== LOGIN ==========

console.log("📥 Requisição recebida no login:");


router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);

  console.log('chegou');

  if (!usuario) return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });

  // garante que sempre exista um array `escolas`
  const escolas = Array.isArray(usuario.escolas)
    ? usuario.escolas
    : usuario.escola
      ? [usuario.escola]
      : [];

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, funcao: usuario.funcao, escolas },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    usuario: {
      nome: usuario.nome,
      funcao: usuario.funcao,
      email: usuario.email,
      escolas
    }
  });
});

// ========== REGISTRO ==========
router.post('/registro', async (req, res) => {
  const { nome, cpf, escola, funcao, email, senha } = req.body;
  if (!nome || !cpf || !escola || !funcao || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos!' });
  }

  const usuarios = lerUsuarios();
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ mensagem: 'E-mail já cadastrado!' });
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    cpf,
    funcao,
    email,
    senha: await bcrypt.hash(senha, 10),
    escola,               // mantém legadado para compatibilidade
    escolas: [escola]     // novo campo como array
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
});

// ========== LISTAR ESCOLAS ==========
router.get('/escolas', (req, res) => {
  const usuarios = lerUsuarios();
  const todas = new Set();
  usuarios.forEach(u => {
    if (Array.isArray(u.escolas)) {
      u.escolas.forEach(e => todas.add(e));
    } else if (u.escola) {
      todas.add(u.escola);
    }
  });
  res.json(Array.from(todas));
});

// ========== ATUALIZAR ESCOLAS VINCULADAS AO USUÁRIO ==========
router.put('/escolas', (req, res) => {
  const { email, escolas } = req.body;
  if (!email || !Array.isArray(escolas)) {
    return res.status(400).json({ mensagem: 'Email e lista de escolas são obrigatórios!' });
  }

  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.status(404).json({ mensagem: 'Usuário não encontrado!' });
  }

  usuario.escolas = escolas;
  // opcionalmente sincroniza também o campo legadado:
  usuario.escola = escolas[0] || '';

  salvarUsuarios(usuarios);
  res.json({ mensagem: 'Escolas atualizadas com sucesso!', escolas: usuario.escolas });
});

// ========== ESQUECI SENHA e RESET ==========
router.post('/esqueci-senha', async (req, res) => {
  // ... seu código existente ...
});

router.post('/resetar-senha', async (req, res) => {
  // ... seu código existente ...
});

module.exports = router;

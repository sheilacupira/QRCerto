const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

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
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log('🔍 Tentando login com:', email, senha);

  const usuarios = lerUsuarios();
  console.log('📁 Usuários carregados:', usuarios.length);

  const usuario = usuarios.find(u => u.email === email);
  console.log('👤 Usuário encontrado:', usuario);

  if (!usuario) {
    console.log('❌ Nenhum usuário encontrado com esse e-mail');
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });
  }

  try {
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    console.log('🔐 Resultado da comparação de senha:', senhaCorreta);

    if (!senhaCorreta) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos!' });
    }

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

    console.log('✅ Login bem-sucedido');

    res.json({
      token,
      usuario: {
        nome: usuario.nome,
        funcao: usuario.funcao,
        email: usuario.email,
        escolas
      }
    });
  } catch (erro) {
    console.error('💥 Erro durante a comparação de senha:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao tentar logar.' });
  }
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
    escola,
    escolas: [escola]
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

// ========== ATUALIZAR ESCOLAS ==========
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
  usuario.escola = escolas[0] || '';

  salvarUsuarios(usuarios);
  res.json({ mensagem: 'Escolas atualizadas com sucesso!', escolas: usuario.escolas });
});

// ========== ESQUECI SENHA ==========
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: 'O e-mail é obrigatório!' });
  }

  const usuarios = lerUsuarios();
  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
  }

  const token = jwt.sign({ email }, SECRET, { expiresIn: '15m' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_REMETENTE,
      pass: process.env.EMAIL_SENHA,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_REMETENTE,
    to: email,
    subject: '🔐 Código de Redefinição de Senha - QRCerto',
    text: `
Olá!

Recebemos uma solicitação para redefinir sua senha no aplicativo QRCerto.

Aqui está seu código de verificação (válido por 15 minutos):

🔑 CÓDIGO: ${token}

Se você não solicitou essa redefinição, pode ignorar este e-mail.

Atenciosamente,
Equipe QRCerto
`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ mensagem: 'Código enviado para seu e-mail com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ mensagem: 'Erro ao enviar o e-mail.' });
  }
});

// ========== RESETAR SENHA ==========
router.post('/resetar-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios!' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const email = decoded.email;

    const usuarios = lerUsuarios();
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado!' });
    }

    usuario.senha = await bcrypt.hash(novaSenha, 10);
    salvarUsuarios(usuarios);

    res.json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao verificar token:', err);
    res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
  }
});

module.exports = router;

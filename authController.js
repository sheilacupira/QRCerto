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
    subject: 'Redefinição de Senha - QRCerto',
    text: `Olá! Aqui está seu código de redefinição de senha:\n\n${token}\n\nEste código é válido por 15 minutos.`,
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

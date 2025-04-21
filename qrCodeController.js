// qrCodeController.js
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Pasta para salvar QR Codes gerados
const pastaQR = path.join(__dirname, 'qrcodes');
if (!fs.existsSync(pastaQR)) fs.mkdirSync(pastaQR);

// Rota para gerar QR Code
router.post('/', async (req, res) => {
  try {
    const { turmaId, disciplina, questoes, gabarito } = req.body;

    if (!turmaId || !disciplina || !questoes || !gabarito || !Array.isArray(gabarito)) {
      return res.status(400).json({ mensagem: 'Dados incompletos para gerar QR Code.' });
    }

    const dados = {
      turmaId,
      disciplina,
      questoes,
      gabarito
    };

    const nomeArquivo = `qrcode_${turmaId}_${Date.now()}.png`;
    const caminhoCompleto = path.join(pastaQR, nomeArquivo);

    // Gera e salva a imagem
    await QRCode.toFile(caminhoCompleto, JSON.stringify(dados));

    // Retorna o caminho da imagem ou o base64
    res.status(201).json({
      mensagem: 'QR Code gerado com sucesso.',
      imagem: `/qrcodes/${nomeArquivo}`
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao gerar QR Code.' });
  }
});

module.exports = router;
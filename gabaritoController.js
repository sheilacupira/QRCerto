const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const router = express.Router();

const caminhoGabaritos = './gabaritos.json';

// Função para ler os gabaritos do arquivo
function lerGabaritos() {
  if (!fs.existsSync(caminhoGabaritos)) return [];
  const data = fs.readFileSync(caminhoGabaritos);
  return JSON.parse(data);
}

// Função para salvar os gabaritos no arquivo
function salvarGabaritos(gabaritos) {
  fs.writeFileSync(caminhoGabaritos, JSON.stringify(gabaritos, null, 2));
}

// ✅ POST - Criar novo gabarito e gerar QR Code
router.post('/', async (req, res) => {
  try {
    const { turmaId, disciplina, questoes, gabarito } = req.body;

    if (!turmaId || !disciplina || !questoes || !gabarito || gabarito.length === 0) {
      return res.status(400).json({ mensagem: 'Dados incompletos.' });
    }

    const gabaritos = lerGabaritos();
    const id = Date.now();

    const novo = { id, turmaId, disciplina, questoes, gabarito };
    gabaritos.push(novo);
    salvarGabaritos(gabaritos);

    const qrData = JSON.stringify(novo);
    const caminhoImagem = path.join(__dirname, 'uploads', `qr_gabarito_${id}.png`);
    await QRCode.toFile(caminhoImagem, qrData);

    const caminhoRelativo = `/uploads/qr_gabarito_${id}.png`;

    res.status(201).json({
      mensagem: 'QR Code gerado!',
      caminho: caminhoRelativo,
      id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao gerar QR Code.' });
  }
});

// ✅ GET - Listar todos os gabaritos
router.get('/', (req, res) => {
  const gabaritos = lerGabaritos();
  res.json(gabaritos);
});

// ✅ PUT - Editar gabarito
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { turmaId, disciplina, questoes, gabarito } = req.body;

  const gabaritos = lerGabaritos();
  const index = gabaritos.findIndex(g => g.id == id);

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Gabarito não encontrado.' });
  }

  gabaritos[index] = { ...gabaritos[index], turmaId, disciplina, questoes, gabarito };
  salvarGabaritos(gabaritos);

  res.json({ mensagem: 'Gabarito atualizado com sucesso.' });
});

// ✅ DELETE - Excluir gabarito
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  let gabaritos = lerGabaritos();
  const gabarito = gabaritos.find(g => g.id == id);

  if (!gabarito) {
    return res.status(404).json({ mensagem: 'Gabarito não encontrado.' });
  }

  gabaritos = gabaritos.filter(g => g.id != id);
  salvarGabaritos(gabaritos);

  const imagemPath = path.join(__dirname, 'uploads', `qr_gabarito_${id}.png`);
  if (fs.existsSync(imagemPath)) {
    fs.unlinkSync(imagemPath);
  }

  res.json({ mensagem: 'Gabarito excluído com sucesso.' });
});

module.exports = router;

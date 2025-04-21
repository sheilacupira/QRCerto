// escolasController.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const DB = path.join(__dirname, 'escolas.json');

function ler() {
  if (!fs.existsSync(DB)) return [];
  return JSON.parse(fs.readFileSync(DB, 'utf-8'));
}
function gravar(arr) {
  fs.writeFileSync(DB, JSON.stringify(arr, null, 2));
}

// GET /api/escolas
router.get('/', (_req, res) => {
  res.json(ler());
});

// POST /api/escolas
router.post('/', (req, res) => {
  const { nome, municipio } = req.body;
  if (!nome || !municipio) {
    return res.status(400).json({ mensagem: 'Dados incompletos.' });
  }
  const arr = ler();
  const nova = { id: Date.now(), nome, municipio };
  arr.push(nova);
  gravar(arr);
  res.status(201).json(nova);
});

// DELETE /api/escolas/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  let arr = ler();
  if (!arr.find(e => e.id === id)) {
    return res.status(404).json({ mensagem: 'Não encontrado.' });
  }
  arr = arr.filter(e => e.id !== id);
  gravar(arr);
  res.status(204).end();
});

module.exports = router;

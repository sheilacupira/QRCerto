// turmaController.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const caminhoTurmas = path.join(__dirname, 'turmas.json');

function lerTurmas() {
  if (!fs.existsSync(caminhoTurmas)) return [];
  return JSON.parse(fs.readFileSync(caminhoTurmas, 'utf8'));
}

function salvarTurmas(turmas) {
  fs.writeFileSync(caminhoTurmas, JSON.stringify(turmas, null, 2), 'utf8');
}

// GET /api/turmas - Lista todas as turmas
router.get('/', (req, res) => {
  try {
    const turmas = lerTurmas();
    res.json(turmas);
  } catch (err) {
    console.error('Erro ao ler turmas:', err);
    res.status(500).json({ mensagem: 'Erro ao ler as turmas.' });
  }
});

// POST /api/turmas - Cadastra nova turma
router.post('/', (req, res) => {
  const { escola, serie, municipio, disciplina, professorEmail, alunos } = req.body;
  if (!escola || !serie || !municipio || !disciplina || !professorEmail || !Array.isArray(alunos) || alunos.length === 0) {
    return res.status(400).json({ mensagem: 'Dados incompletos.' });
  }
  try {
    const turmas = lerTurmas();
    const novaTurma = { id: Date.now(), escola, serie, municipio, disciplina, professorEmail, alunos };
    turmas.push(novaTurma);
    salvarTurmas(turmas);
    res.status(201).json({ mensagem: 'Turma salva com sucesso!', turma: novaTurma });
  } catch (err) {
    console.error('Erro ao salvar turma:', err);
    res.status(500).json({ mensagem: 'Erro ao salvar turma.' });
  }
});

// PUT /api/turmas/:id - Atualiza turma existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { escola, serie, municipio, disciplina, professorEmail, alunos } = req.body;
  if (!escola || !serie || !municipio || !disciplina || !professorEmail || !Array.isArray(alunos) ) {
    return res.status(400).json({ mensagem: 'Dados incompletos.' });
  }
  try {
    const turmas = lerTurmas();
    const idx = turmas.findIndex(t => t.id === parseInt(id, 10));
    if (idx === -1) return res.status(404).json({ mensagem: 'Turma não encontrada.' });
    turmas[idx] = { id: parseInt(id, 10), escola, serie, municipio, disciplina, professorEmail, alunos };
    salvarTurmas(turmas);
    res.json({ mensagem: 'Turma atualizada com sucesso!', turma: turmas[idx] });
  } catch (err) {
    console.error('Erro ao atualizar turma:', err);
    res.status(500).json({ mensagem: 'Erro ao atualizar turma.' });
  }
});

// DELETE /api/turmas/:id - Remove turma
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const turmas = lerTurmas();
    const newTurmas = turmas.filter(t => t.id !== parseInt(id, 10));
    if (newTurmas.length === turmas.length) {
      return res.status(404).json({ mensagem: 'Turma não encontrada.' });
    }
    salvarTurmas(newTurmas);
    res.json({ mensagem: 'Turma excluída com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir turma:', err);
    res.status(500).json({ mensagem: 'Erro ao excluir turma.' });
  }
});

// GET /api/turmas/:id/alunos - Lista alunos de uma turma
router.get('/:id/alunos', (req, res) => {
  const { id } = req.params;
  try {
    const turmas = lerTurmas();
    const turma = turmas.find(t => t.id === parseInt(id, 10));
    if (!turma) return res.status(404).json({ mensagem: 'Turma não encontrada.' });
    const alunosList = turma.alunos.map((nome, idx) => ({ id: idx + 1, nome }));
    res.json(alunosList);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
    res.status(500).json({ mensagem: 'Erro ao listar alunos.' });
  }
});

module.exports = router;

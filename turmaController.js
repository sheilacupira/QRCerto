const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const caminhoTurmas = path.join(__dirname, 'turmas.json');

// Função auxiliar para ler as turmas
function lerTurmas() {
  if (!fs.existsSync(caminhoTurmas)) return [];
  const data = fs.readFileSync(caminhoTurmas);
  return JSON.parse(data);
}

// Função auxiliar para salvar turmas
function salvarTurmas(turmas) {
  fs.writeFileSync(caminhoTurmas, JSON.stringify(turmas, null, 2));
}

// ✅ GET /api/turmas - Listar todas as turmas
router.get('/', (req, res) => {
  try {
    const turmas = lerTurmas();
    res.json(turmas);
  } catch (err) {
    console.error('Erro ao ler as turmas:', err);
    res.status(500).json({ mensagem: 'Erro ao ler as turmas.' });
  }
});

// ✅ POST /api/turmas - Cadastrar nova turma
router.post('/', (req, res) => {
  try {
    

    const { escola, serie, municipio, disciplina, professorEmail, alunos } = req.body;
    console.log('🔍 Dados recebidos para cadastro:', req.body);
    
    if (!escola || !serie || !municipio || !disciplina || !professorEmail || !alunos || alunos.length === 0) {
      return res.status(400).json({ mensagem: 'Dados incompletos' });
    }

    const turmas = lerTurmas();

    const novaTurma = {
      id: Date.now(),
      escola,
      serie,
      municipio,
      disciplina,
      professorEmail,
      alunos,
    };

    turmas.push(novaTurma);
    salvarTurmas(turmas);

    res.status(201).json({ mensagem: 'Turma salva com sucesso!', turma: novaTurma });
  } catch (error) {
    console.error('Erro no POST /api/turmas:', error);
    res.status(500).json({ mensagem: 'Erro ao salvar turma.' });
  }
});

// 🔄 PUT /api/turmas/:id - Atualizar turma
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { escola, serie, municipio, disciplina, professorEmail, alunos } = req.body;

  const turmas = lerTurmas();
  const index = turmas.findIndex(t => t.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Turma não encontrada' });
  }

  turmas[index] = {
    id: parseInt(id),
    escola,
    serie,
    municipio,
    disciplina,
    professorEmail,
    alunos,
  };

  salvarTurmas(turmas);
  res.json({ mensagem: 'Turma atualizada com sucesso', turma: turmas[index] });
});

// ❌ DELETE /api/turmas/:id - Excluir turma
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  let turmas = lerTurmas();

  const index = turmas.findIndex(t => t.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ mensagem: 'Turma não encontrada' });
  }

  turmas.splice(index, 1);
  salvarTurmas(turmas);
  res.json({ mensagem: 'Turma excluída com sucesso' });
});
router.get('/:id/alunos', (req, res) => {
  const { id } = req.params;

  const turmas = lerTurmas();
  const turma = turmas.find(t => t.id == id);

  if (!turma) {
    return res.status(404).json({ mensagem: 'Turma não encontrada' });
  }

  const alunos = turma.alunos.map((nome, index) => ({
    id: index + 1, // ID fictício
    nome,
  }));

  res.json(alunos);
});
module.exports = router;

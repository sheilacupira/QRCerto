// src/routes/notasController.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const caminhoNotas  = path.join(__dirname, 'notas.json');
const caminhoTurmas = path.join(__dirname, 'turmas.json');

// Utilitário para ler qualquer JSON
function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return [];
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

// ========= GET /api/notas/alunos-com-notas =========
// Aceita query params ?turmaId=123&aluno=NomeAluno
router.get('/alunos-com-notas', (req, res) => {
  try {
    const { turmaId, aluno } = req.query;
    let notas = lerJSON(caminhoNotas);
    const turmas = lerJSON(caminhoTurmas);

    // filtrar se vier turmaId ou aluno
    if (turmaId) notas = notas.filter(n => n.turmaId.toString() === turmaId);
    if (aluno)   notas = notas.filter(n => n.aluno === aluno);

    const alunosAgrupados = notas
      .filter(n => Array.isArray(n.notas))
      .map(n => {
        const turma = turmas.find(t => t.id === n.turmaId);
        const provas = n.notas.map((_, i) => `P${i+1}`); // gera ['P1','P2',...]
        return {
          aluno: n.aluno,
          turmaId: n.turmaId,
          serie:  turma?.serie  || 'Desconhecida',
          escola: turma?.escola || 'Desconhecida',
          notas:  n.notas,
          provas, 
        };
      });

    res.json(alunosAgrupados);
  } catch (err) {
    console.error('Erro ao buscar alunos com notas:', err);
    res.status(500).json({ mensagem: 'Erro interno ao buscar dados.' });
  }
});

// ======== GET /api/notas/medias-por-turma/:turmaId ========
router.get('/medias-por-turma/:turmaId', (req, res) => {
  try {
    const { turmaId } = req.params;
    const notas = lerJSON(caminhoNotas).filter(n => n.turmaId.toString() === turmaId);
    if (!notas.length) {
      return res.status(404).json({ mensagem: 'Nenhuma nota para esta turma.' });
    }
    const total = notas[0].notas.length;
    const soma  = Array(total).fill(0);
    notas.forEach(n => n.notas.forEach((v,i) => soma[i] += v));
    const medias = soma.map(s => parseFloat((s / notas.length).toFixed(2)));
    res.json({ turmaId, medias });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: 'Erro interno ao buscar médias.' });
  }
});

// ======== GET /api/notas/escolas ========
// Retorna lista de escolas únicas, para filtro na tela de Relatórios
router.get('/escolas', (req, res) => {
  try {
    const notas  = lerJSON(caminhoNotas).filter(n => Array.isArray(n.notas));
    const turmas = lerJSON(caminhoTurmas);
    const escolas = Array.from(new Set(
      notas.map(n => {
        const t = turmas.find(tu => tu.id === n.turmaId);
        return t?.escola;
      }).filter(Boolean)
    ));
    res.json(escolas);
  } catch (err) {
    console.error('Erro ao buscar escolas:', err);
    res.status(500).json({ mensagem: 'Erro interno ao buscar escolas.' });
  }
});

module.exports = router;

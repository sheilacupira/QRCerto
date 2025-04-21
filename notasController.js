const express = require('express');
const fs = require('fs');
const router = express.Router();

const caminhoNotas = './notas.json';
const caminhoTurmas = './turmas.json';

router.get('/',(req,res)=>{
  
});

function lerNotas() {
  if (!fs.existsSync(caminhoNotas)) return [];
  const data = fs.readFileSync(caminhoNotas);
  return JSON.parse(data);
}

function lerTurmas() {
  if (!fs.existsSync(caminhoTurmas)) return [];
  const data = fs.readFileSync(caminhoTurmas);
  return JSON.parse(data);
}

// ✅ GET: Retornar todos os alunos com suas notas, turma, escola e série
router.get('/alunos-com-notas', (req, res) => {
  try {
    const notas = lerNotas();
    const turmas = lerTurmas();

    // Agrupar dados por aluno com informações da turma
    const alunosAgrupados = notas
      .filter(n => n.notas && Array.isArray(n.notas))
      .map(n => {
        const turma = turmas.find(t => t.id === n.turmaId);
        return {
          aluno: n.aluno,
          notas: n.notas,
          turmaId: n.turmaId,
          serie: turma?.serie || 'Desconhecida',
          escola: turma?.escola || 'Desconhecida',
        };
      });

    res.json(alunosAgrupados);
  } catch (err) {
    console.error('Erro ao buscar alunos com notas:', err);
    res.status(500).json({ mensagem: 'Erro interno ao buscar dados.' });
  }
});

// ✅ GET: Acompanhamento por turma (média de cada prova)
router.get('/medias-por-turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  const notas = lerNotas().filter(n => n.turmaId.toString() === turmaId);

  if (!notas.length) {
    return res.status(404).json({ mensagem: 'Nenhuma nota encontrada para esta turma.' });
  }

  const totalProvas = notas[0].notas.length;
  const somaPorProva = Array(totalProvas).fill(0);
  const quantidadeAlunos = notas.length;

  for (const aluno of notas) {
    aluno.notas.forEach((nota, index) => {
      somaPorProva[index] += nota;
    });
  }

  const medias = somaPorProva.map(soma => parseFloat((soma / quantidadeAlunos).toFixed(2)));

  res.json({ turmaId, medias });
});
  // GET /api/notas/escolas – devolve escolas únicas
router.get('/escolas', (_, res) => {
  const notas  = lerNotas();
  const turmas = lerTurmas();
  const escolas = new Set();

  turmas.forEach(t => escolas.add(t.escola));
  // (ou)  notas.forEach(n => escolas.add(n.escola));

  res.json([...escolas]);
});
// GET /api/notas/escolas - retorna lista de escolas (para filtro)
router.get('/escolas', (req, res) => {
  try {
    const notas = lerNotas().filter(n => Array.isArray(n.notas));
    const turmas = lerTurmas();
    // mapeia cada nota à sua turma e extrai o nome da escola
    const escolas = notas
      .map(n => {
        const t = turmas.find(tu => tu.id === n.turmaId);
        return t ? t.escola : null;
      })
      .filter(Boolean);
    // retira duplicatas
    const unicas = Array.from(new Set(escolas));
    res.json(unicas);
  } catch (err) {
    console.error('Erro ao buscar escolas:', err);
    res.status(500).json({ mensagem: 'Erro interno ao buscar escolas.' });
  }
});


module.exports = router;

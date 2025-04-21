const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const caminhoNotas = './notas.json';
const caminhoGabaritos = './gabaritos.json';

// Utilitário para ler JSON
function lerArquivoJSON(caminho) {
  if (!fs.existsSync(caminho)) return [];
  const data = fs.readFileSync(caminho);
  return JSON.parse(data);
}

// Utilitário para salvar notas
function salvarNotas(notas) {
  fs.writeFileSync(caminhoNotas, JSON.stringify(notas, null, 2));
}

// Teste rápido de conexão
router.get('/ping', (req, res) => {
  res.send('pong');
});

// 📌 POST /api/correcao - Corrigir prova e salvar nota
router.post('/', (req, res) => {
  const { aluno, turmaId, gabaritoId, notaMaxima, respostasAluno } = req.body;

  if (
    !aluno || aluno.trim() === '' ||
    !turmaId || !gabaritoId || !notaMaxima ||
    !Array.isArray(respostasAluno)
  ) {
    return res.status(400).json({ mensagem: 'Dados incompletos' });
  }

  const gabaritos = lerArquivoJSON(caminhoGabaritos);
  const gabarito = gabaritos.find(g => g.id == gabaritoId);

  if (!gabarito) {
    return res.status(404).json({ mensagem: 'Gabarito não encontrado' });
  }

  const resultados = respostasAluno.map((resposta, i) => {
    const correta = gabarito.gabarito[i];
    const alternativas = Array.isArray(resposta) ? resposta : [resposta];

    const acertou = alternativas.length === 1 && alternativas[0] === correta;

    return {
      questao: i + 1,
      correta,
      resposta: alternativas.join(','),
      acertou
    };
  });

  const acertos = resultados.filter(r => r.acertou).length;
  const notaFinal = parseFloat(((acertos / gabarito.questoes) * notaMaxima).toFixed(2));

  const novaNota = {
    aluno,
    turmaId,
    gabaritoId,
    notaMaxima,
    notaFinal,
    acertos,
    erros: gabarito.questoes - acertos,
    resultados
  };

  const notas = lerArquivoJSON(caminhoNotas);
  notas.push(novaNota);
  salvarNotas(notas);

  res.json(novaNota);
});

module.exports = router;

// correcaoController.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Define caminhos absolutos para os arquivos JSON
const caminhoNotas     = path.join(__dirname, 'notas.json');
const caminhoGabaritos = path.join(__dirname, 'gabaritos.json');

// Utilitário para ler JSON de um arquivo
function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return [];
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

// Utilitário para salvar JSON em um arquivo
function salvarJSON(caminho, data) {
  fs.writeFileSync(caminho, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/correcao/ping - rota de teste
router.get('/ping', (_req, res) => {
  res.send('pong');
});

// POST /api/correcao - Corrigir prova e salvar nota
router.post('/', (req, res) => {
  const { aluno, turmaId, gabaritoId, notaMaxima, respostasAluno } = req.body;

  // Validação básica dos campos
  if (
    !aluno || typeof aluno !== 'string' || aluno.trim() === '' ||
    !turmaId || !gabaritoId || !notaMaxima ||
    !Array.isArray(respostasAluno)
  ) {
    return res.status(400).json({ mensagem: 'Dados incompletos ou inválidos.' });
  }

  // Carrega gabaritos e encontra o solicitado
  const gabaritos = lerJSON(caminhoGabaritos);
  const gabarito = gabaritos.find(g => g.id == gabaritoId);
  if (!gabarito) {
    return res.status(404).json({ mensagem: 'Gabarito não encontrado.' });
  }

  // Compara respostas e monta resultados
  const resultados = respostasAluno.map((resp, idx) => {
    const correta = gabarito.gabarito[idx];
    const acertou = resp === correta;
    return {
      questao: idx + 1,
      correta,
      resposta: resp,
      acertou
    };
  });

  // Calcula acertos e nota final
  const acertos = resultados.filter(r => r.acertou).length;
  const notaFinal = parseFloat(((acertos / gabarito.questoes) * notaMaxima).toFixed(2));

  // Prepara objeto de nota
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

  // Salva em notas.json
  const notas = lerJSON(caminhoNotas);
  notas.push(novaNota);
  salvarJSON(caminhoNotas, notas);

  // Retorna a nota calculada
  res.json(novaNota);
});

module.exports = router;

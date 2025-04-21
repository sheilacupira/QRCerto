const jwt = require('jsonwebtoken');

// 🔐 Use uma variável de ambiente para a chave secreta em produção
const segredoJWT = process.env.JWT_SECRET || 'chave-super-secreta-qrcerto';

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, segredoJWT);

    // Armazena os dados decodificados no req
    req.usuario = decoded;

    next(); // continua para a rota protegida
  } catch (err) {
    return res.status(403).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

module.exports = verificarToken;

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('arquivo'), (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const dados = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.unlinkSync(filePath); // apaga arquivo temporário

    res.status(200).json({ dados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar o arquivo' });
  }
});

module.exports = router;

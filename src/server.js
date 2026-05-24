require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/questions', require('./routes/questions'));
app.use('/api/report',    require('./routes/report'));

const PAGES = path.join(__dirname, '../public/pages');

app.get('/',         (req, res) => res.sendFile(path.join(PAGES, 'index.html')));
app.get('/simulado', (req, res) => res.sendFile(path.join(PAGES, 'simulado.html')));
app.get('/resultado',(req, res) => res.sendFile(path.join(PAGES, 'resultado.html')));
app.get('/sobre',    (req, res) => res.sendFile(path.join(PAGES, 'sobre.html')));

app.listen(PORT, () => {
  console.log(`Simulado Provas rodando em http://localhost:${PORT}`);
});

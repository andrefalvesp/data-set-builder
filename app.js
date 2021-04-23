var express = require('express');
var http = require('http');
var path = require("path");
var helmet = require('helmet');
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());

var server = http.createServer(app);

const connectionString = 'postgresql://postgres:123456@localhost:5432/data-set-builder'

var porta = process.env.PORT || 8081;
server.listen(porta, function () {
  console.log("Server listening on port:" + porta);
})

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, './public/form.html'));
});

app.get('/user', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM user1');
    const results = { 'results': (result) ? result.rows : null };
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

app.post('/user', async (req, res) => {
  try {
    const client = await pool.connect();
    const { idUser, name, email, date } = req.body;
    const result = await client
      .query('INSERT INTO user1(idUser,name, email, date) VALUES($1,$2,$3,$4)',
        [idUser, name, email, date]
      );
    res.send(JSON.stringify(result));  
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})
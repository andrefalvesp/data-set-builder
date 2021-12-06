/////////////////////////////NODEJS-SERVER-SIDE//////////////////////////////////

//////////////////////////////IMPORTS////////////////////////////////////////////

const express = require('express');
const http = require('http');
const path = require("path");
const helmet = require('helmet');
const bodyParser = require('body-parser')
const app = express()
const server = http.createServer(app);
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());

///////////////////////////////PORTA/////////////////////////////////////////////

const porta = process.env.PORT || "8082";
server.listen(porta, function () {
    console.log("Server listening on port:" + porta);
})

///////////////////////////////DATABASE//////////////////////////////////////////

const connectionString = 'postgresql://anpaschoal:123456@localhost:5432/process-mining-sql'

const {Pool} = require('pg');

const pool = (() => {
    if (process.env.NODE_ENV !== 'production') {
        return new Pool({
            connectionString: connectionString,
            ssl: false
        });
    } else {
        return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    } })();

////////////////////////////////HOME//////////////////////////////////////////

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './public/1-login.html'));
});

////////////////////////////////USER/////////////////////////////////////////////

app.get('/user', async (req, res) => {
    const client = await pool.connect();
    try {
        const {email, iduser} = req.query;
        const result = await client
            .query('SELECT * from user1 where email = $1 and iduser = $2',
                [email, iduser]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.get('/user/review', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser} = req.query;
        const query = `
            SELECT u.iduser      as iduser,
                   u.email       as email,
                   sum(v.answer) as sumanswer,
                   sum(s.score)  as sumscore, 
                   t.score       as score
            FROM user1 as u
                     natural join view1 as v
                     inner join team as t
                                on u.idteam = t.idteam
                     inner join score as s
                                on v.answer = s.numanswer
            where iduser = $1
            group by u.iduser, u.email, t.score`;

        const result = await client
            .query(query, [iduser]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.post('/user', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, name, email, useragreetlce, idteam} = req.body;
        const result = await client
            .query('INSERT INTO user1(iduser,name, email, dateinsert, useragreetlce, idteam) VALUES($1,$2,$3,CURRENT_TIMESTAMP,$4,$5)',
                [iduser, name, email, useragreetlce, idteam]
            );
        res.send(JSON.stringify(result))
    } catch (err) {
        res.status(400).end(JSON.stringify(err.message+"."+err.detail))
    } finally {
        client.release();
    }})

app.get('/user/all', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM user1');
        const results = {'results': (result) ? result.rows : null};
        res.send(results);
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

////////////////////////////////////////GROUP///////////////////////////////////////////////////////////////

app.get('/group', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser} = req.query;

        const queryCandidatoEmUso = `
            SELECT g.idgroup
            FROM group1 as g
                inner join view1 as vi
                on g.idgroup = vi.idgroup
                        where answer < 2 --TODO isso precisa se tornar um param conforme team
                          and iduser = $1`

        const queryNovo = `
            SELECT g.idgroup
            FROM group1 as g
            where g.idgroup not in
                  (select idgroup from sql where iduser = $1)
            ORDER BY random()
            LIMIT 1;`

        const queryEvent = `            
            SELECT idevent,
                   idcase,
                   idgroup,
                   idlog,
                   startdatetime,
                   enddatetime,
                   activity,
                   resource,
                   costevent
            FROM event
            where idgroup = $1`

        const queryInsert = `
            INSERT INTO view1(date,  iduser, idgroup, answer)
            VALUES ((SELECT CURRENT_TIMESTAMP ), $1, $2, 0);`;

        const result1 = await client
            .query(queryCandidatoEmUso,
                [iduser]);

        let idgroup;

        if (result1.rowCount >= 1) {
             idgroup = result1.rows[0].idgroup;
        }
        else {
            const result2 = await client
                .query(queryNovo,[iduser]);

            idgroup = result2.rows[0].idgroup;

            await client
                .query(queryInsert,
                    [iduser, idgroup]);
        }

        res.send(JSON.stringify(
            await client
                .query(queryEvent,
                    [idgroup])
        ));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.get('/group/count', async (req, res) => {
    const client = await pool.connect();
    try {

        const {idgroup} = req.query;

        const queryCount = `
            SELECT answer as nquestions
            FROM view1
            where idgroup = $1
            LIMIT 1`

        const result1 = await client
            .query(queryCount,
                [parseInt(idgroup)]);

        if(result1.rowCount >= 1)
            res.send(JSON.stringify(
            result1.rows[0].nquestions+1
        ));
        else
            res.send(JSON.stringify(
                "1"
            ));
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.get('/group/one', async (req, res) => {
    const client = await pool.connect();
    try {
        const {idarticle} = req.query;

        const query1 = `
            SELECT idarticle,
                   title,
                   abstract
            FROM article
            where idarticle = $1
            LIMIT 1;`

        const result = await client
            .query(query1,
                [idarticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})


////////////////////////////////////////SQL///////////////////////////////////////////////////////////////
app.post('/sql', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser
            ,idgroup
            ,selectionen
            ,selectionpt
            ,operation
            ,sql} = req.body;
        const query1 = `
            INSERT INTO sql(iduser
                                      ,idgroup
                                      ,selectionen
                                      ,selectionpt
                                      ,operation
                                      ,sql
                                      ,date)
            VALUES ($1, $2, $3, $4, $5, $6, (SELECT current_timestamp)); `;

        const result = await client
            .query(query1,
                [iduser
                    ,idgroup
                    ,selectionen
                    ,selectionpt
                    ,operation
                    ,sql]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

///////////LOG/////

app.get('/log', async (req, res) => {
    const client = await pool.connect();
    try {

        const {idlog} = req.query;

        const titleLog = `
            SELECT title 
            FROM logs
            where idlog = $1
            LIMIT 1`

        const result1 = await client
            .query(titleLog,
                [parseInt(idlog)]);

            res.send(JSON.stringify(
                result1.rows[0]))

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})
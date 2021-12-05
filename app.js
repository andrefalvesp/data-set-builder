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
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || connectionString,
    ssl: process.env.DATABASE_URL ? true:false
});

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
                   sum(s.score)  as sumscore
            FROM user1 as u
                     natural join view1 as v
                     inner join score as s
                                on v.answer = s.numanswer
            where iduser = $1
            group by u.iduser, u.email`;

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
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
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


////////////////////////////////////////QA///////////////////////////////////////////////////////////////
app.post('/question-answer', async (req, res) => {
    const client = await pool.connect();
    try {
        const {questionen, answeren, questionpt, answerpt, iduser, idarticle} = req.body;
        const query1 = `
            INSERT INTO questionanswer(questionen, answeren, questionpt, answerpt,
                                       date, iduser, idarticle)
            VALUES ($1, $2, $3, $4,
                    (SELECT CURRENT_DATE), $5, $6); `;

        const result = await client
            .query(query1,
                [questionen, answeren, questionpt, answerpt,
                    iduser, idarticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

app.put('/question-answer', async (req, res) => {
    const client = await pool.connect();
    try {
        const {questionen, answeren, questionpt, answerpt, iduser, idarticle, idqa} = req.body;
        const query1 = `
            INSERT INTO public.questionanswer(questionen,
                                              answeren,
                                              questionpt,
                                              answerpt,
                                              idqa,
                                              date,
                                              iduser,
                                              idarticle)
            VALUES ($1, $2, $3, $4,
                    $7, (SELECT CURRENT_DATE), $5, $6)
            ON CONFLICT (idqa) DO UPDATE SET (
                                              questionen,
                                              answeren,
                                              questionpt,
                                              answerpt
                                                 )=
                                                 (EXCLUDED.questionen,
                                                  EXCLUDED.answeren,
                                                  EXCLUDED.questionpt,
                                                  EXCLUDED.answerpt)
            WHERE questionanswer.iduser = $5
              and questionanswer.idarticle = $6
              and questionanswer.idqa = $7;`

        const result = await client
            .query(query1,
                [questionen, answeren, questionpt, answerpt,
                    iduser, idarticle, idqa]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

app.get('/question-answer', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, idqa, idarticle} = req.query;
        const query = `
            SELECT *
            FROM questionanswer
            WHERE iduser = $1
              and idqa = $2
              and idarticle = $3
            order by idqa;`;

        const result = await client
            .query(query,
                [iduser, idqa, idarticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

app.delete('/question-answer', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, idqa, idarticle} = req.body;
        const query = `
            DELETE
            FROM questionanswer
            WHERE iduser = $1
              and idqa = $2
              and idarticle = $3`;

        const result = await client
            .query(query,
                [iduser, idqa, idarticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

app.get('/question-answer/article', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, idarticle} = req.query;
        const query = `
            SELECT *
            FROM questionanswer
            WHERE iduser = $1
              and idarticle = $2
            order by idqa;`;

        const result = await client
            .query(query,
                [iduser, idarticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})

app.get('/question-answer/article/all', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser} = req.query;
        const query = `
            SELECT distinct q.idarticle,
                            replace(a.title, '<br>', ' ') as title
                            
            FROM questionanswer as q
                     inner join article as a
                                on a.idarticle = q.idarticle
            WHERE iduser = $1`;

        const result = await client
            .query(query,
                [iduser]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }})


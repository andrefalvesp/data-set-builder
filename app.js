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

    ssl: !!process.env.DATABASE_URL

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
                   sum(v.view)   as sumview,
                   sum(v.skip)   as sumskip,
                   sum(v.reject) as sumreject,
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
        const {iduser, name, email, dateInsert, userAgreeTCLE, idTeam} = req.body;
        const result = await client
            .query('INSERT INTO user1(iduser,name, email, dateinsert, useragreetlce, idteam) VALUES($1,$2,$3,$4,$5,$6)',
                [iduser, name, email, dateInsert, userAgreeTCLE, idTeam]
            );
        res.send(JSON.stringify(result));
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

////////////////////////////////ABSTRACT/////////////////////////////////////////////
app.get('/abstract', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser} = req.query;
        const query1 = `
            SELECT ar.idarticle,
                   title,
                   abstract,
                   answer + 1 as nquestions
            FROM article as ar
                     inner join view1 as vi
                                on ar.idarticle = vi.idarticle
            where view = 1
              and reject = 0
              and skip = 0
              and answer < 2
              and iduser = $1
            LIMIT 1;`

        const query2 = `
            SELECT ar.idarticle,
                   title,
                   abstract,
                   1 as nquestions
            FROM article as ar
            where ar.idarticle not in
                  (select idarticle from questionanswer where iduser = $1)

            ORDER BY random()
            LIMIT 1;`

        const query3 = `
            INSERT INTO view1(date, view, skip, reject, iduser, idarticle, answer)
            VALUES ((SELECT CURRENT_DATE), 1, 0, 0, $1, $2, 0);`;

        const result1 = await client
            .query(query1,
                [iduser]);

        if (result1.rowCount >= 1)
            res.send(JSON.stringify(result1));
        else {
            const result2 = await client
                .query(query2,[iduser]);

            const idArticle = result2.rows[0].idarticle;

            await client
                .query(query3,
                    [iduser, idArticle]);

            res.send(JSON.stringify(result2));
        }
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.get('/abstract/one', async (req, res) => {
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

app.post('/abstract/reject', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, idArticle} = req.body;
        const query = `
            UPDATE view1
            SET reject= reject + 1
            WHERE iduser = $1
              and idarticle = $2;`;

        const result = await client
            .query(query,
                [iduser, idArticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

app.post('/abstract/skip', async (req, res) => {
    const client = await pool.connect();
    try {
        const {iduser, idArticle} = req.body;
        const query = `
            UPDATE view1
            SET skip= skip + 1
            WHERE iduser = $1
              and idarticle = $2;`;

        const result = await client
            .query(query,
                [iduser, idArticle]);

        res.send(JSON.stringify(result));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

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

////////////////////////////////////////INCIDENT///////////////////////////////////////////////////////////////
app.get('/incident/group', async (req, res) => {
    const client = await pool.connect();
    try {

        const query1 = `
            SELECT
                idgroup
            FROM incident as i
            GROUP BY idgroup
            ORDER BY random()
                LIMIT 1;`

        const query2 = `
            SELECT 
                   idevent,
                   idcase,
                   startdatetime,
                   enddatetime,
                   activity,
                   resource,
                   costevent
            FROM incident as i
            where idgroup = $1`

        const result1 = await client
            .query(query1);

        const result2 = await client
            .query(query2,[result1.rows[0].idgroup]);

        res.send(JSON.stringify(result2));

    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    } finally {
        client.release();
    }
})

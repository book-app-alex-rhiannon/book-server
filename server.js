'use strict';

const cors = require('cors');
const fs = require('fs');
const pg = require('pg');
const express = require('express');
const app = express();

const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

app.get('*', (req, res) => res.redirect(CLIENT_URL));

app.get('api/v1/books', (request, response) => {
  client.query(`SELECT * FROM books;`)
    .then(result => response.send(result.rows))
    .catch(console.error);
});

app.post('api/v1/books', express.urlencoded(), (request, response) => {
  client.query(`INSERT INTO books(author, title, isbn, image_url, description) VALUES($1, $2, $3, $4, $5);`,
    [request.body.author,
    request.body.title,
    request.body.isbn,
    request.body.image_url,
    request.body.description]
  )
    .catch(console.error);
  // add status http err
});

// app.post('/api/v1/books', (request, response) => {
// client.query(
//   'INSERT INTO authors(author) VALUES($1) ON CONFLICT DO NOTHING',
//   [request.body.author],

//   function (err) {
//     if (err) console.error(err);
//     queryTwo();
//   }
// )

// function queryTwo() {
//   client.query(
//     `SELECT author_id FROM authors WHERE author=$1`,
//     [request.body.author],

//     function (err, result) {
//       if (err) console.error(err);
//       queryThree(result.rows[0].author_id)
//     }
//   )
// }
// function queryThree(author_id) {
//   client.query(
//     `INSERT INTO books(title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5);`,
//     [
//       request.body.title,
//       request.body.author,
//       request.body.isbn,
//       request.body.image_url,
//       request.body.description
//     ],
//     function (err) {
//       if (err) console.error(err);
//       response.send('insertion complete');
//     }
//   );
// }
// });

app.put('api/v1/books/:id', express.urlencoded(), (request, response) => {
  client.query(`
    UPDATE books
    SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5
    WHERE book_id=$6;
      `,
    [
      request.body.title,
      request.body.author,
      request.body.isbn,
      request.body.image_url,
      request.body.description,
      request.params.id
    ]
  )
    // dont forget http status vvv  
    .then(() => response.send('update complete'))
    .catch(console.error);
});



app.delete('api/v1/books/:id', (request, response) => {
  client.query(
    `DELETE FROM books WHERE book_id=$1;`,
    [request.params.id]
  )
    .then(() => response.send('deletion complete'))
    .catch(console.error);
});

app.delete('api/v1/books', (request, response) => {
  client.query('DELETE FROM books')
    .then(() => response.send('deletion complete'))
    .catch(console.error);
});

loadDB();



///////////// ** DB Loaders\\\\\\\\\\\\\
//|||||||||||||||||||||||||||||||||||||\\

function loadBooks() {
  client.query('SELECT COUNT(*) FROM books').then(result => {
    if (!parseInt(result.rows[0].count)) {
      fs.readFile('books.json', 'utf8', (err, fd) => {
        JSON.parse(fd).forEach(ele => {
          client.query(`
          INSERT INTO books(title, author, isbn, image_url, description) VALUES($1, $2, $3, $4, $5);`,
            [ele.title, ele.author, ele.isbn, ele.image_url, ele.description]
          )
            .catch(console.error);
        })
      })
    }
  })
}

function loadDB() {

  client.query(`
  CREATE TABLE IF NOT EXISTS
  books (
    book_id SERIAL PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    description TEXT NOT NULL
  );`
  )
    .then(loadBooks)
    .catch(console.error);
}

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));



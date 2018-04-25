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

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
////////// ** DB Loaders\\\\\\\\\\\\\
//|||||||||||||||||||||||||||||||||||||\\
funsiton loadAuthors() {
  fs.readFile('books.json', 'utf8', (err, fd) => {
    JSON.parse(fd).forEach(ele => {
      client.query(
        'INSERT INTO authors (author) VALUES($1) ON CONFLICT DO NOTHING',
        [ele.author]
      )
        .catch(console.error);
    })
  })
}

function loadBooks() {
  client.query('SELECT COUNT(*) FROM books').then(result => {
    if (!parseInt(result.rows[0].count)) {
      fs.readFile('books.json', 'utf8', (err, fd) => {
        JSON.parse(fd).forEach(ele => {
          client.query(`
          INSERT INTO books(author_id, title, author, isbn, image_url, description) SELECT author_id, $1, $2, $3, $4 FROM authors WHERE author=$2;`,
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
  authors(
    author_id SERIAL PRIMARY KEY,
    author VARCHAR(255) UNIQUE NOT NULL
  );`
  ).then(loadAuthors)
    .catch(console.error);

  client.query(`
  CREATE TABLE IF NOT EXISTS
  books (
    book_id SERIAL PRIMARY KEY,
    author_id INEGER NOT NULL REFERENCES authors(author_id),
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
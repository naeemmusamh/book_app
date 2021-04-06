'use strict';

//require and configure dotenv.
require('dotenv').config();

//create an express app
const express = require('express');

//Creates an cors app
const cors = require('cors');

//Create an pg app
const pg = require('pg');

//Create an method-override
const methodOverride = require('method-override');


//create an superagent app
const superagent = require('superagent');
const { request, response } = require('express');

//the app setup
const app = express();
const PORT = process.env.PORT || 5051;

//the app middleware
app.use(express.urlencoded({ extended: true }));

//set the view engine
app.set('view engine', 'ejs');

//conceive for the href of the link style CSS
app.use(express.static('./public'));

//the app setup to Database
const client = new pg.Client(process.env.DATABASE_URL);

//override with the Method header in the request
app.use(methodOverride('_method'));

// client.on('error', error => {
//     console.log(error);
// });

//render the home page and all the books from the Database
app.get('/', (request, response) => {
    let selectQuery = `SELECT * FROM tasks;`;
    client.query(selectQuery).then(results => {
        response.render('pages/index', { results: results.rows });
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});


//to add the book detail to the Database and send back to the user
app.post('/books', (request, response) => {
    let items = request.body;
    let selectQuery = 'INSERT INTO tasks (title, author, image_url, isbn, description) VALUES ($1, $2, $3, $4, $5) RETURNING id;';
    let safeValue = [items.title, items.author, items.image_url, items.isbn, items.description];
    client.query(selectQuery, safeValue).then((element) => {
        let result = element.rows[0].id;
        response.redirect(`/books/${result}`);
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});

//render the detail's page
app.get('/books/:id', (request, response) => {
    let id = request.params.id;
    let selectQuery = `SELECT * FROM tasks WHERE id=$1;`;
    let safeValue = [id];
    client.query(selectQuery, safeValue).then(results => {
        // console.log(results);
        response.render('pages/books/details', { books: results.rows[0] });
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});

//render the search form
app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new');
});

//contracture function
function Book(info) {
    this.title = info.title ? info.title : 'no title';
    this.author = info.authors ? info.authors[0] : 'no author';
    this.image_url = info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.isbn = info.industryIdentifiers ? info.industryIdentifiers[0].identifier : 'no isbn';
    this.description = info.description ? info.description : 'no description';
}

//create a new search to the google books API
app.post('/searches', (request, response) => {
    let url = 'https://www.googleapis.com/books/v1/volumes';
    // console.log(request.body.search);
    const searchBy = request.body.searchBy;
    const searchValue = request.body.search;
    const queryObject = {};
    if (searchBy === 'title') {
        queryObject['q'] = `+intitle:'${searchValue}'`;
    } else if (searchBy === 'author') {
        queryObject['q'] = `+inauthor:'${searchValue}'`;
    }
    // console.log(searchValue);
    // console.log(queryObject);
    superagent.get(url).query(queryObject).then(apiResponse => {
        return apiResponse.body.items.map(bookResult => {
            return new Book(bookResult.volumeInfo);
        });
    }).then(results => {
        // console.log(results);
        response.render('pages/searches/show', { searchResults: results });
    }).catch((error) => {
        console.log('error', error);
        response.status(500).render('pages/error');
    });
});

//render the update page
app.post('/update/:id', (request, response) => {
    let id = request.params.id;
    let selectQuery = 'SELECT * FROM tasks WHERE id=$1;';
    let safeValue = [id];
    client.query(selectQuery, safeValue).then(results => {
        response.render('pages/books/update', { books: results.rows[0] });
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});

//to update the book by ID
app.put('/books/update/:id', (request, response) => {
    let id = request.params.id;
    let { title, author, image_url, isbn, description } = request.body;
    let safeValue = [title, author, image_url, isbn, description, id];
    let updateValue = 'UPDATE tasks SET title=$1, author=$2, image_url=$3, isbn=$4, description=$5 WHERE id=$6;';
    client.query(updateValue, safeValue).then(() => {
        response.redirect(`/books/${id}`);
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});


//to delete the book by ID
app.delete('/books/delete/:id', (request, response) => {
    let id = request.params.id;
    let safeValue = [id];
    let deleteValue = 'DELETE FROM tasks WHERE id=$1;';
    client.query(deleteValue, safeValue).then(() => {
        response.redirect('/');
    }).catch((error) => {
        response.render('pages/error', { error: error });
    });
});

//to catch all the pages
app.get('*', (request, response) => {
    response.status(400).send('there is error in your render');
});

//server is listening for connections on a PORT
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Listening to Port ${PORT}`);
    });
});
'use strict';

//require and configure dotenv.
require('dotenv').config();

//create an express app
const express = require('express');

//Creates an cors app.
const cors = require('cors');

//create an superagent app
const superagent = require('superagent');

//the app setup
const app = express();
const PORT = process.env.PORT || 5551;

//the app middleware
app.use(express.urlencoded({ extended: true }));

//set the view engine
app.set('view engine', 'ejs');

//conceive for the href of the link style CSS
app.use(express.static('./public'));
// app.use("/style", express.static(__dirname + "./public/styles"));

//render the home page
app.get('/', (request, response) => {
    response.render('pages/index');
});

//render the search form
app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new.ejs');
});

//contracture function
function Book(info) {
    this.title = info.title ? info.title : 'no title';
    this.author = info.authors ? info.authors[0] : 'no author';
    this.description = info.description ? info.description : 'no description';
    this.thumbnail = info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}

//create a new search to the google books API
app.post('/searches', (request, response) => {
    let url = 'https://www.googleapis.com/books/v1/volumes';
    console.log(request.body.search);
    const searchBy = request.body.searchBy;
    const searchValue = request.body.search;
    const queryObject = {};
    if (searchBy === 'title') {
        queryObject['q'] = `+intitle:'${searchValue}'`;
    } else if (searchBy === 'author') {
        queryObject['q'] = `+inauthor:'${searchValue}'`;
    }
    console.log(searchValue);
    console.log(queryObject);
    superagent.get(url).query(queryObject).then(apiResponse => {
        return apiResponse.body.items.map(bookResult => {
            return new Book(bookResult.volumeInfo);
        });
    }).then(results => {
        console.log(results);
        response.render('pages/searches/show', { searchResults: results });
    }).catch((error) => {
        console.log('error', error);
        response.status(500).render('pages/error');
    });
});

app.get('*', (request, response) => {
    response.status(400).send('there is error in your render');
});

//server is listening for connections on a PORT
app.listen(PORT, () => {
    console.log(`Listening to Port ${PORT}`);
});
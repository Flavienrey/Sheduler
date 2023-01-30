// Modules
require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const path = require('path');


const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const session = require("express-session");
require('express-dynamic-helpers-patch')(app);
app.dynamicHelpers({
    session: function (req, res) {
        return req.session;
    }
});

// View engine setup
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }))

app.use(helmet());
app.use(compression());

app.use(session({
    secret: 'top secret',
    resave: true,
    saveUninitialized: true
}));


//Routes
const routesForIndexes = require(path.join(__dirname,"routes/routes.js"));

app.use(routesForIndexes);


// Server start
app.listen(process.env.PORT, () => {
    debug(`Listening on port ${process.env.PORT}`);
});

// Export the Express API
module.exports = app;

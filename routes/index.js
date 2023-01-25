const express = require('express');
const argon2 = require('argon2');
const dotenv = require("dotenv");
const app = express.Router();

dotenv.config();

const User = require("../model/User");

app.get('/', function(req, res) {
    if(req?.session?.user){
        res.redirect("/home");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/signup', async function (req, res) {

    res.render("signup");
});

app.post('/signup', async function (req, res) {

    console.log(req.body);

    const passwordHashed = await argon2.hash(req.body.password);

    console.log(passwordHashed);

    const userRecord = await User.create(req.body.login,"", passwordHashed);

    console.log("User : ", userRecord);
    res.render("signup");
});

app.get('/login', function(req, res) {
    console.log("User logged in");
    res.render("login", {title: "Connexion"});
});

app.post('/login', function(req, res) {
    console.log("Checking if user exists in database");
    // TODO : find user in database
    req.session.user = { firstname : req.firstname, lastname : req.lastname};
    res.redirect("/home");
});

app.get('/home', function(req, res) {
    console.log("Displaying landing page");
    res.render("layout", {title: "Landing Page", user : req.session.user});
});

app.post('/logout', function(req, res) {
    console.log("User logged out");
    req.session.destroy();
    res.redirect("/login");
});

module.exports = app;
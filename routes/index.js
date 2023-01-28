const express = require('express');
const argon2 = require('argon2');
const dotenv = require("dotenv");
const app = express.Router();

dotenv.config();

const User = require("../model/User");
const path = require("path");

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

    const passwordHashed = await argon2.hash(req.body.password);

    console.log(passwordHashed);

    const userRecord = await User.createNewUser(req.body.username, passwordHashed);

    console.log("User : ", userRecord);
    res.render("signup");
});

app.get('/login', function(req, res) {
    console.log("User logged in");
    res.render("login", {title: "Connexion"});
});

app.post('/login', async function (req, res) {

    const {username, password} = req.body;

    const userInBDD = await User.getUser(username);

    if (userInBDD && await argon2.verify(userInBDD['password'], password)) {
        req.session.user = {username: userInBDD['_id'], admin: userInBDD['admin']};
        res.redirect("/home");
    }

    else {
        res.redirect("/login");
    }
});

app.get('/home', function(req, res) {
    res.render("home");
});

app.post('/logout', function(req, res) {
    console.log("User logged out");
    req.session.destroy();
    res.redirect("/login");
});

module.exports = app;
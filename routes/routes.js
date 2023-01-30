const argon2 = require('argon2');
const dotenv = require("dotenv");
dotenv.config();

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const User = require("../model/User");
const Resource = require("../model/Resource");
const Reservation = require("../model/Reservation");
router.get('/', auth, function (req, res) {
    res.render("home");
});

router.get('/home', auth, function (req, res) {
    res.render("home");
});

router.get('/add-a-resource', auth, function (req, res) {
    res.render("addAResource");
});

router.post('/add-a-resource', auth, async function (req, res) {

    const resourceRecord = await Resource.createNewResource(req.body.resourceName, req.body.resourceArchitecture, req.body.numberOfCores, req.body.ramQuantity);

    if (resourceRecord) {
        res.render("addAResource", {operation: "Successfully added your resource!"});
    } else {
        res.render("addAResource", {operation: "Error, resource not added, please try again!"});
    }
});

router.get('/manage-resources', auth, function (req, res) {
    res.render("manageResources");
});

router.get('/book-a-resource', auth, async function (req, res) {

    const resources = await Resource.getAllResources();
    res.render("bookAResource", {resources: resources});
});

router.post('/book-a-resource', auth, async function (req, res) {

    const resources = await Resource.getAllResources();

    if(req.body.startingDate>=req.body.endingDate){
        res.render("bookAResource", {operation:"Impossible, please put a starting date before the ending one!", resources: resources});
        return;
    }

    if(req.body.tickedResources == null){
        res.render("bookAResource", {operation:"Please choose at least one resource to book!", resources: resources});
        return;
    }

    const reservationsRecord = await Reservation.createNewReservation(req.body.tickedResources, req.body.startingDate, req.body.endingDate, req.session.user.username);

    if (!reservationsRecord.problematicResource) {
        res.render("bookAResource", {operation: "Reservation successful!", resources: resources});
    } else {
        res.render("bookAResource", {operation: reservationsRecord.operation+" for resource : "+reservationsRecord.problematicResource, resources: resources});
    }
});

router.get('/manage-reservations', auth, function (req, res) {
    res.render("manageReservations");
});

router.get('/users', auth, function (req, res) {
    res.render("users");
});

router.post('/users', auth, async function (req, res) {
    const userReservations = await Reservation.getAllReservationsForUser(req.body.name);

    res.render("users", {user:req.body.name,reservations: userReservations});
});

router.get('/login', function (req, res) {
    res.render("login");
});

router.post('/login', async function (req, res) {

    const {username, password} = req.body;

    const userInBDD = await User.getUser(username);

    if (userInBDD && await argon2.verify(userInBDD['password'], password)) {
        req.session.user = {username: userInBDD['_id'], admin: userInBDD['admin']};
        res.redirect("/home");
    } else {
        req.session.destroy();
        res.render("login", {
            operation: "Error, user/password combination not in database!",
            action: "Please login with correct credentials"
        });
    }
});

router.get('/signup', async function (req, res) {
    res.render("signup");
});

router.post('/signup', async function (req, res) {

    const passwordHashed = await argon2.hash(req.body.password);

    const userRecord = await User.createNewUser(req.body.username, passwordHashed);

    if (userRecord) {
        req.session.signup = true;
        res.redirect("login");
    } else {
        res.render("signup", {
            operation: "Error, user already in database!",
            action: "Please register with another pseudonym"
        });
    }

});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});
router.post('/logout', function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;
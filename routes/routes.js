const argon2 = require('argon2');
const dotenv = require("dotenv");
dotenv.config();

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const User = require("../model/User");
const Resource = require("../model/Resource");
const Reservation = require("../model/Reservation");
require("path");
require("moment");
function getMinDate(reservations){
    let minDate = reservations[0].startingDate;

    for (let i in reservations) {
        if (reservations[i].startingDate < minDate) {
            minDate = reservations[i].startingDate
        }
    }

    return minDate;
}

function getMaxDate(reservations){
    let maxDate = reservations[0].endingDate;

    for (let i in reservations) {
        if (reservations[i].endingDate > maxDate) {
            maxDate = reservations[i].endingDate
        }
    }

    return maxDate;
}

function convertToDateOnly(date){
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}
function determineEvents(reservations){

    let events = [];

    let currentDate = new Date(getMinDate(reservations));
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);

    let finalDate = new Date(getMaxDate(reservations));
    finalDate.setHours(23);
    finalDate.setMinutes(59);
    finalDate.setSeconds(59);

    while (currentDate <= finalDate) {

        //Date of the current time, we have to find all events that apply to this date
        let dateToDisplay = convertToDateOnly(currentDate);
        let dayEvents = [];

        for (let i in reservations) {
            let start = new Date(reservations[i].startingDate);
            let end = new Date(reservations[i].endingDate);

            if (start.getFullYear() === currentDate.getFullYear() && start.getMonth() === currentDate.getMonth()) {

                let startTime = null;
                let endTime = null;

                //If first day of booking
                if (start.getDate() === currentDate.getDate()) {

                    startTime = reservations[i].startingDate.slice(11, 16);

                    //If more days to come
                    if (currentDate.getDate() < end.getDate()) {
                        endTime = "23:59";
                    }
                }

                //If last day of booking
                if (end.getDate() === currentDate.getDate()) {
                    endTime = reservations[i].endingDate.slice(11, 16);

                    //If previous days, put it at the beginning
                    if (start.getDate() < currentDate.getDate()) {
                        startTime = "00:00";
                    }
                }

                //If in the interval of both dates
                else if (start.getDate() < currentDate.getDate() && currentDate.getDate() < end.getDate()) {
                    startTime = "00:00";
                    endTime = "23:59";
                }

                if (startTime != null && endTime != null) {
                    dayEvents.push({
                        resourceName: reservations[i].resourceName, user: reservations[i].user, start: startTime, end: endTime
                    });
                }
            }
        }

        //Pushing the day with its reservations
        events.push({date: dateToDisplay, reservations: dayEvents});

        //Increment the date to go to the next one and find its reservations
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
}

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

router.get('/book-a-resource', auth, async function (req, res) {

    const resources = await Resource.getAllResources();
    res.render("bookAResource", {resources: resources});
});

router.post('/book-a-resource', auth, async function (req, res) {

    const resources = await Resource.getAllResources();

    if (req.body.startingDate >= req.body.endingDate) {
        res.render("bookAResource", {
            operation: "Impossible, please put a starting date before the ending one!", resources: resources
        });
        return;
    }

    if (req.body.tickedResources == null) {
        res.render("bookAResource", {operation: "Please choose at least one resource to book!", resources: resources});
        return;
    }

    const reservationsRecord = await Reservation.createNewReservation(req.body.tickedResources, req.body.startingDate, req.body.endingDate, req.session.user.username);

    if (!reservationsRecord.problematicResource) {
        res.render("bookAResource", {operation: "Reservation successful!", resources: resources});
    } else {
        res.render("bookAResource", {
            operation: reservationsRecord.operation + " for resource : " + reservationsRecord.problematicResource,
            resources: resources
        });
    }
});

router.get('/view-reservations', auth, async function (req, res) {

    const reservations = await Reservation.getAll();

   const events = determineEvents(reservations);

    res.render('viewReservations', {
        user: req.session.user.username, admin: req.session.user.admin, events
    });
});

router.post('/view-reservations', auth, async function (req, res) {

    if (req.body.name) {
        let reservations = await Reservation.getAllReservationsForUser(req.body.name);

        const events = determineEvents(reservations);

        res.render('viewReservations', {
            user: req.session.user.username, admin: req.session.user.admin, events
        });
    }
    else{
        res.redirect('view-reservations');
    }
});

router.get('/users', auth, async function (req, res) {
    const listUsers = await User.getAll();

    res.render("users", {
        user: req.session.user.username,
        admin: req.session.user.admin,
        listUsers
    });
});

router.post('/users', auth, async function (req, res) {
    if(req.body.name) {
        const singleUser = await User.getUser(req.body.name);
        const listUsers = new Array(singleUser);

        res.render("users", {
            user: req.session.user.username,
            admin: req.session.user.admin,
            listUsers
        });
    }
    else{
        res.redirect('/users');
    }
});

router.get('/login', function (req, res) {
    res.render("login");
});

router.post('/login', async function (req, res) {

    if(req.body && req.body.username) {
        const {username, password} = req.body;

        const userInBDD = await User.getUser(username);

        if (userInBDD && await argon2.verify(userInBDD['password'], password)) {
            req.session.user = {username: userInBDD['_id'], admin: userInBDD['admin']};
            res.redirect("home");
        } else {
            req.session.destroy();
            res.render("login.pug", {
                operation: "Error, user/password combination not in database!",
                action: "Please login with correct credentials"
            });
        }
    }
    else{
        res.render("login");
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
            operation: "Error, user already in database!", action: "Please register with another pseudonym"
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
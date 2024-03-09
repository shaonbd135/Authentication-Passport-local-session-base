const express = require('express');
const cors = require('cors');
const ejs = require('ejs');
const app = express();
require("./config/database");
const bcrypt = require('bcrypt');
const saltRounds = 10;
require("dotenv").config();
require('./config/passport');

const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const User = require('./models/user.model');

app.set("view engine", 'ejs');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//......................................................//
//Passport for authentication session(passport,express-session,connect-mongo )

//express-session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    //connect mongo 
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions"
    }),
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

//.......................................................//

//base url

app.get('/', (req, res) => {
    res.render('index')
})


// Checked Logged in or not
const checkLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    next();
}

//register - get

app.get('/register', checkLoggedIn, (req, res) => {
    res.render('register.ejs')
})

//register - post
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            username
        })
        if (user) return res.status(400).send("user already exists");

        bcrypt.hash(password, saltRounds, async (err, hash) => {
            const newUser = new User({
                username: username,
                password: hash
            });
            await newUser.save();
            res.status(201).redirect("/login");
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
})



//login -get

app.get('/login', checkLoggedIn, (req, res) => {
    res.render('login.ejs')
})

//login-post

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/profile' })
);

//checked authenticated or not

const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}

//profile protected

app.get('/profile', checkAuthenticated, (req, res) => {
    // if (req.isAuthenticated()) {
    //     res.render('profile.ejs')
    // }
    // else {
    //     res.redirect('/login');
    // }

    res.render('profile.ejs')

})

//logout

app.get('/logout', (req, res) => {
    try {
        req.logOut((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/login');
        })

    }
    catch (error) {
        res.status(500).send(error.message);

    }
})

module.exports = app;









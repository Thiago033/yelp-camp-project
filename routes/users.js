const express    = require('express');
const passport   = require('passport');
const User       = require('../models/user');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.get('/register', async (req, res) => {
    res.render('users/register');
});

router.post('/register', catchAsync(async (req, res, next) => {

    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });    
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if(err) return next();
            req.flash('success', 'Welcome to Yealp Camp!');
            res.redirect('/');
        });

    } catch (error) {
        req.flash('error', error);
        res.redirect('/register');
    }
}));

router.get('/login', async (req, res) => {
    res.render('users/login');
});

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'welcome back!');

    //FIX IT!
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
    //
});

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) return next(err); 
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
});

module.exports = router;
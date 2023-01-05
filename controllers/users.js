const User   = require('../models/user');

module.exports.renderRegister = async (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {

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
}

module.exports.renderLogin = async (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'welcome back!');

    //FIX IT!
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
    //
}

module.exports.logout = function(req, res, next) {
    req.logout(function(err) {
        if (err) return next(err); 
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
}
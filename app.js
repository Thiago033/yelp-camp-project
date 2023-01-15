if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const ejsMate        = require('ejs-mate');
const express        = require('express');
const flash          = require('connect-flash');
const helmet         = require("helmet");
const methodOverride = require('method-override');
const mongoose       = require('mongoose');
const mongoSanitize  = require('express-mongo-sanitize');
const path           = require('path');
const session        = require('express-session');
const passport       = require('passport') 
const LocalStrategy  = require('passport-local');

const ExpressError   = require('./utils/ExpressError');

const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes     = require('./routes/reviews');
const usersRoutes       = require('./routes/users');

const User = require('./models/user');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    //useCreateIndex: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error"));
db.once("open", () => {
    console.log("Database Connected!");
});

const app = express();

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({
    replaceWith: '_'
}));
const sessionConfig = {
    name: 'session',
    secret: 'password',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7 
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://stackpath.bootstrapcdn.com/",
    'https://api.tiles.mapbox.com/',
    'https://api.mapbox.com/',
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css/",
    "https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.js/"
];

const styleSrcUrls = [
    "'self'",
    "https://cdn.jsdelivr.net/",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];

const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: connectSrcUrls,
        scriptSrc: scriptSrcUrls,
        styleSrc: styleSrcUrls,
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        imgSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/dg2iz0zbi/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
            "https://images.unsplash.com/",
        ],
        upgradeInsecureRequests: [],
      },
    })
  );
  

// use static authenticate method of model in LocalStrategy
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    //FIX IT!

    // if (!['/login', '/'].includes(req.originalUrl)) {
    //     req.session.returnTo = req.originalUrl;
    // }
    req.session.returnTo = req.originalUrl;
    
    //

    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);
app.use('/', usersRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', {err});
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});
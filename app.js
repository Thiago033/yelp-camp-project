const express        = require('express');
const ejsMate        = require('ejs-mate');
const methodOverride = require('method-override');
const mongoose       = require('mongoose');
const path           = require('path');
const Campground     = require('./models/campground');
const Review         = require('./models/review');
const catchAsync     = require('./utils/catchAsync');
const ExpressError   = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("connected to database");
    })
    .catch(err => {
        console.log("Error!", err);
    });

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);

app.listen(3000, () => {
    console.log('Serving on port 3000');
})

const validateCampground = (req, res ,next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(',');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(',');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home');
});

// Show all campgrounds
app.get('/campgrounds',  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
}));

// Form to a new campground
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new');
});

// Creating a new campground
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {

    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);

    const campground = new Campground(req.body.campground);
    await campground.save(); 
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Show one specific campgrounds
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show', { campground });
}));

// Form to edit the campground
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

// Editing the campground
app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Delete a campground
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

// Reviews
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {

    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);

    campground.reviews.push(review);

    await review.save();
    await campground.save();

    res.redirect(`/campgrounds/${campground._id}`);

}));

// Delete review
app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {

    const { id, reviewId} = req.params;

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/campgrounds/${id}`);
}));

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', {err});
});
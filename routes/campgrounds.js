const express      = require('express');
const Campground   = require('../models/campground');
const catchAsync   = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');

const { campgroundSchema } = require('../schemas');

const router = express.Router();

const validateCampground = (req, res ,next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(',');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
}

// Show all campgrounds
router.get('/',  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

// Form to a new campground
router.get('/new', (req, res) => {
    res.render('campgrounds/new');
});

// Creating a new campground
router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    await campground.save(); 

    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Show one specific campgrounds
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    if(!campground){
        req.flash('error', 'Campground not founded!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}));

// Form to edit the campground
router.get('/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if(!campground){
        req.flash('error', 'Campground not founded!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}));

// Editing the campground
router.put('/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success', 'Successfully updated campground');
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Delete a campground
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}));

module.exports = router;
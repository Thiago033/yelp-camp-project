const express    = require('express');
const Campground = require('../models/campground');
const Review     = require('../models/review');
const catchAsync = require('../utils/catchAsync');

const { reviewSchema } = require('../schemas');

const router = express.Router({ mergeParams: true });

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(',');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
}

// Reviews
router.post('/', validateReview, catchAsync(async (req, res) => {

    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);

    campground.reviews.push(review);

    await review.save();
    await campground.save();

    req.flash('success', 'Successfully created new review!');
    res.redirect(`/campgrounds/${campground._id}`);

}));

// Delete review
router.delete('/:reviewId', catchAsync(async (req, res) => {

    const { id, reviewId} = req.params;

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/campgrounds/${id}`);
}));

module.exports = router;
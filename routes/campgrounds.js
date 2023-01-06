const express     = require('express');
const catchAsync  = require('../utils/catchAsync');
const campgrounds = require('../controllers/campgrounds');
const { storage } = require('../cloudinary/index');
const multer      = require('multer');
const upload = multer({ storage });

const router = express.Router();

const { isLoggedIn, validateCampground, isAuthor } = require('../middleware');


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))
;

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.editCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))
;

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;
import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    createReview,
    deleteReview,
    getManyReview,
    getReview,
    updateReview,
} from '../controllers/review'

/**
 ** ====================================
 ** Router
 ** ====================================
 */
const Router = express.Router()

/**
 ** ====================================
 ** Routes
 ** ====================================
 */

//[Retrieve] many review or [Create] a review
Router.route('/')
    .get(getManyReview)
    .post(
        isAuthenticated,
        isAuthorized('admin'),
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        createReview
    )

//[Retrieve] [Modify] [Remove] a review by its id
Router.route('/:id')
    .get(getReview)
    .put(
        isAuthenticated,
        isAuthorized('admin'),
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        updateReview
    )
    .delete(isAuthenticated, isAuthorized('admin'), deleteReview)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    createReview,
    deleteReview,
    getManyReview,
    getReview,
    setFilterQueryProductId,
    filterAndTransformTheBody,
    updateReview,
    searchReview,
} from '../controllers/review'

/**
 ** ====================================
 ** Router
 ** ====================================
 */
const Router = express.Router({ mergeParams: true })

/**
 ** ====================================
 ** Routes
 ** ====================================
 */

//[Retrieve] many review or [Create] a review
Router.route('/')
    .get(setFilterQueryProductId, getManyReview)
    .post(
        isAuthenticated,
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        filterAndTransformTheBody,
        createReview
    )

//[Retrieve] review via search
Router.route('/search/:query').get(
    isAuthenticated,
    isAuthorized('admin'),
    searchReview
)

//[Retrieve] [Modify] [Remove] a review by its id
Router.route('/:id')
    .get(getReview)
    .put(
        isAuthenticated,
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        filterAndTransformTheBody,
        updateReview
    )
    .delete(isAuthenticated, deleteReview)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    createReview,
    deleteReview,
    getManyReview,
    getReview,
    setFilterQuery,
    filterAndTransformTheBody,
    updateReview,
    searchReview,
    getRatingsOfProduct,
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

//[Retrive] ratings
Router.route('/ratings/:prodId').get(getRatingsOfProduct)

//[Retrive] [Create] [Update] [Delete] current user review
Router.route('/user')
    .get(isAuthenticated, setFilterQuery, getManyReview)
    .post(
        isAuthenticated,
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        createReview
    )
    .put(
        isAuthenticated,
        multerUpload.fields([
            {
                name: 'images',
            },
        ]),
        imageToMedia('images'),
        updateReview
    )
    .delete(isAuthenticated, deleteReview)

//[Retrieve] many review or [Create] a review
Router.route('/')
    .get(setFilterQuery, getManyReview)
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

import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    createDeal,
    deleteDeal,
    getDeal,
    getManyDeal,
    updateDeal,
} from '../controllers/deal'

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

//[Retrieve] many deal or [Create] a deal
Router.route('/')
    .get(getManyDeal)
    .post(
        isAuthenticated,
        isAuthorized('admin'),
        multerUpload.fields([
            {
                name: 'image',
                maxCount: 1,
            },
        ]),
        imageToMedia('image'),
        createDeal
    )

//[Retrieve] [Modify] [Remove] a deal by its id
Router.route('/:id')
    .get(getDeal)
    .put(
        isAuthenticated,
        isAuthorized('admin'),
        multerUpload.fields([
            {
                name: 'image',
                maxCount: 1,
            },
        ]),
        imageToMedia('image'),
        updateDeal
    )
    .delete(isAuthenticated, isAuthorized('admin'), deleteDeal)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

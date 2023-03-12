import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createCategory,
    deleteCategory,
    getCategory,
    getManyCategory,
    updateCategory,
} from '../controllers/category'
import { imageToMedia } from '../controllers/media'
import multerUpload from '../packages/multer'

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

//[Retrieve] many category or [Create] a category
Router.route('/')
    .get(getManyCategory)
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
        createCategory
    )

//[Retrieve] [Modify] [Remove] a category by its id
Router.route('/:id')
    .get(getCategory)
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
        updateCategory
    )
    .delete(isAuthenticated, isAuthorized('admin'), deleteCategory)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

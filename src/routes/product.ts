import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    createProduct,
    deleteProduct,
    getManyProduct,
    getProduct,
    getTotalProductsCount,
    updateProduct,
} from '../controllers/product'

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

//[Retrieve] total products count
Router.route('/total-products-count').get(
    isAuthenticated,
    isAuthorized('admin'),
    getTotalProductsCount
)

//[Retrieve] many product or [Create] a product
Router.route('/')
    .get(getManyProduct)
    .post(
        isAuthenticated,
        isAuthorized('admin'),
        multerUpload.fields([
            {
                name: 'image',
                maxCount: 1,
            },
            {
                name: 'image_gallery',
            },
        ]),
        imageToMedia('image'),
        imageToMedia('image_gallery'),
        createProduct
    )

//[Retrieve] [Modify] [Remove] a product by its id
Router.route('/:id')
    .get(getProduct)
    .put(isAuthenticated, isAuthorized('admin'), updateProduct)
    .delete(isAuthenticated, isAuthorized('admin'), deleteProduct)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

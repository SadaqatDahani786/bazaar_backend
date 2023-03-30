import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createProduct,
    deleteProduct,
    getFrquentlyBoughtTogether,
    getManyProduct,
    getProduct,
    getSimilarViewedItems,
    getTotalProductsCount,
    getTrendingItemsInYourArea,
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

//[Retrieve] trending items in your area
Router.route('/trending-items-in-your-area').get(
    isAuthenticated,
    getTrendingItemsInYourArea
)

//[Retrieve] similar viewed items
Router.route('/similar-viewed-items/:prodId').get(getSimilarViewedItems)

//[Retrieve] frequently bought together items
Router.route('/frequently-bought-together/:prodId').get(
    getFrquentlyBoughtTogether
)

//[Retrieve] total products count
Router.route('/total-products-count').get(
    isAuthenticated,
    isAuthorized('admin'),
    getTotalProductsCount
)

//[Retrieve] many product or [Create] a product
Router.route('/')
    .get(getManyProduct)
    .post(isAuthenticated, isAuthorized('admin'), createProduct)

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

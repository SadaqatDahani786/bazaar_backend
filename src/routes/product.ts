import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createProduct,
    deleteProduct,
    getFrquentlyBoughtTogether,
    getManyProduct,
    getProduct,
    getBrands,
    getSimilarViewedItems,
    getTopSellingProducts,
    getTotalProductsCount,
    getTrendingItemsInYourArea,
    searchProduct,
    setCategoryIdFromParams,
    updateProduct,
    getColors,
    getSizes,
} from '../controllers/product'
import RouterReview from './review'

/**
 ** ====================================
 ** Router
 ** ====================================
 */
const Router = express.Router({ mergeParams: true })

/**
 ** ====================================
 ** NESTED ROUTES
 ** ====================================
 */

//[Get] Product Reviews
Router.use('/:prodId/review', RouterReview)

/**
 ** ====================================
 ** Routes
 ** ====================================
 */

//[Retrieve] one or many product via search
Router.route('/search/:query').get(searchProduct)

//[Retrieve] filters from products data
Router.route('/filter/brand').get(getBrands)
Router.route('/filter/color').get(getColors)
Router.route('/filter/size').get(getSizes)

//[Retrieve] recommendations based on interests
Router.route('/similar-viewed-items/:prodId').get(getSimilarViewedItems)
Router.route('/top-selling-products').get(getTopSellingProducts)
Router.route('/frequently-bought-together/:prodId').get(
    getFrquentlyBoughtTogether
)
Router.route('/trending-items-in-your-area').get(
    isAuthenticated,
    getTrendingItemsInYourArea
)

//[Retrieve] total products count
Router.route('/total-products-count').get(
    isAuthenticated,
    isAuthorized('admin'),
    getTotalProductsCount
)

//[Retrieve] many product or [Create] a product
Router.route('/')
    .get(setCategoryIdFromParams, getManyProduct)
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

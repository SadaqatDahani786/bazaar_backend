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
    getUserInterestsItems,
} from '../controllers/product'

//Routers
import RouterReview from './review'
import RouterUser from './user'

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

//[Get] User
Router.use('/:prodId/user', RouterUser)

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
Router.route('/top-selling-products').get(getTopSellingProducts)
Router.route('/:prodId/similar-viewed-items').get(getSimilarViewedItems)
Router.route('/:prodId/frequently-bought-together').get(
    getFrquentlyBoughtTogether
)
Router.route('/user-interests-item').get(isAuthenticated, getUserInterestsItems)
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

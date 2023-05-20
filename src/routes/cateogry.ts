import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createCategory,
    deleteCategory,
    getCategory,
    getManyCategory,
    getTotalSalesInEachCategory,
    searchCategory,
    updateCategory,
} from '../controllers/category'
import RouterProduct from './product'

/**
 ** ====================================
 ** Router
 ** ====================================
 */
const Router = express.Router()

/**
 ** ====================================
 ** NESTED ROUTES [PRODUCTS]
 ** ====================================
 */
//Router For Products In A Category
Router.use('/:id/product', RouterProduct)

/**
 ** ====================================
 ** Routes
 ** ====================================
 */
//[Retrieve] sales in each category
Router.route('/sales-in-each-category').get(
    isAuthenticated,
    isAuthorized('admin'),
    getTotalSalesInEachCategory
)

//[Retrieve] many category or [Create] a category
Router.route('/')
    .get(getManyCategory)
    .post(isAuthenticated, isAuthorized('admin'), createCategory)

//[Retrieve] category via search
Router.route('/search/:query').get(
    isAuthenticated,
    isAuthorized('admin'),
    searchCategory
)

//[Retrieve] [Modify] [Remove] a category by its id
Router.route('/:id')
    .get(getCategory)
    .put(isAuthenticated, isAuthorized('admin'), updateCategory)
    .delete(isAuthenticated, isAuthorized('admin'), deleteCategory)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

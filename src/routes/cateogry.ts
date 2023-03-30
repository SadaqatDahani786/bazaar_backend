import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createCategory,
    deleteCategory,
    getCategory,
    getManyCategory,
    updateCategory,
} from '../controllers/category'

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
    .post(isAuthenticated, isAuthorized('admin'), createCategory)

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

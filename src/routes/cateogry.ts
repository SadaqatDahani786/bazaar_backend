import express from 'express'
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
Router.route('/').get(getManyCategory).post(createCategory)

//[Retrieve] [Modify] [Remove] a category by its id
Router.route('/:id').get(getCategory).put(updateCategory).delete(deleteCategory)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

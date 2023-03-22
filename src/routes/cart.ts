import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    addItemInCart,
    deleteCart,
    getCart,
    getManyCart,
    removeItemFromCart,
    setParamIdToAuthUserId,
} from '../controllers/cart'

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

/*
 ** **
 ** ** ** [Member-Access-Only]
 ** **
 */
Router.use(isAuthenticated)

//[Retrive] cart
Router.route('/my-cart').get(setParamIdToAuthUserId, getManyCart)

//[Add-item] in cart
Router.route('/add-item').post(isAuthenticated, addItemInCart)

//[Remove-item] from cart
Router.route('/remove-item').post(isAuthenticated, removeItemFromCart)

/*
 ** **
 ** ** ** [Admin-Access-Only]
 ** **
 */
Router.use(isAuthorized('admin', 'member'))

//[Retrieve] many cart
Router.route('/').get(getManyCart)

//[Retrieve] [Remove] a cart by its id
Router.route('/:id').get(getCart).delete(deleteCart)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

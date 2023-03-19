import express from 'express'
import multerUpload from '../packages/multer'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
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
 ** ** ** MEMBER
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
 ** ** ** ADMIN
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

import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createOrder,
    deleteOrder,
    getManyOrder,
    getOrder,
    setUserId,
    updateOrder,
} from '../controllers/order'

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

/**
 ** **
 ** ** ** [Members-Access-Only]
 ** **
 */
Router.use(isAuthenticated)

//[Retrieve] many order of current user
Router.route('/my-orders').get(setUserId, getManyOrder)

/**
 ** **
 ** ** ** [Admin-Access-Only]
 ** **
 */
Router.use(isAuthorized('admin', 'member'))

//[Retrieve] many order or [Create] a order
Router.route('/').get(getManyOrder).post(createOrder)

//[Retrieve] [Modify] [Remove] a order by its id
Router.route('/:id').get(getOrder).put(updateOrder).delete(deleteOrder)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

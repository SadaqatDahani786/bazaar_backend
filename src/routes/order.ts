import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import {
    createOrder,
    deleteOrder,
    getManyOrder,
    getOrder,
    getSalesInMonthsOfYear,
    getTotalOrdersCount,
    getTotalRefunds,
    getTotalSales,
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
Router.use(isAuthorized('admin'))

//[Retrieve] total sales
Router.route('/total-sales').get(getTotalSales)

//[Retrieve] total refunds
Router.route('/total-refunds').get(getTotalRefunds)

//[Retrieve] total sales summary
Router.route('/sales-in-months-of-year/:year').get(getSalesInMonthsOfYear)

//[Retrieve] total numbers of orders count
Router.route('/total-orders-count').get(getTotalOrdersCount)

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

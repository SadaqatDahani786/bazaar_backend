import express from 'express'
import { isAuthenticated } from '../controllers/auth'
import {
    checkoutSuccessWithoutPay,
    createCheckoutSession,
} from '../controllers/checkout'

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

Router.use(isAuthenticated)

//[Create] checkout session
Router.route('/session').post(createCheckoutSession)
Router.route('/success-no-pay').post(checkoutSuccessWithoutPay)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

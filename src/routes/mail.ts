import express from 'express'
import { recieveEmail } from '../controllers/mail'

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

//[Send] an email to use
Router.route('/').post(recieveEmail)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

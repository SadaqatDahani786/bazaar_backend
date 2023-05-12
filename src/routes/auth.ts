import express from 'express'
import {
    forgotPassword,
    isAuthenticated,
    login,
    logout,
    resetPassword,
    signup,
    updatePassword,
} from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import multerUpload from '../packages/multer'

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

Router.route('/signup').post(
    multerUpload.fields([
        {
            name: 'photo',
            maxCount: 1,
        },
    ]),
    imageToMedia('photo'),
    signup
)

Router.route('/login').post(login)

Router.route('/logout').post(logout)

Router.route('/update-password').put(isAuthenticated, updatePassword)

Router.route('/forgot-password').post(forgotPassword)

Router.route('/reset-password/:token').post(resetPassword)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

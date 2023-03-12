import express from 'express'
import {
    isAuthenticated,
    login,
    logout,
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

Router.route('/update-password').post(isAuthenticated, updatePassword)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

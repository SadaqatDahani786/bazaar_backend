import express from 'express'
import {
    createUser,
    deleteUser,
    getManyUser,
    getUser,
    getUsersCountThisMonth,
    updateUser,
} from '../controllers/user'

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

//[Retrieve] users count this month
Router.route('/users-count-this-month').get(getUsersCountThisMonth)

//[Retrieve] many user or [Create] a user
Router.route('/').get(getManyUser).post(createUser)

//[Retrieve] [Modify] [Remove] a user by its id
Router.route('/:id').get(getUser).put(updateUser).delete(deleteUser)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

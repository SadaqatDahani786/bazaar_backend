import express from 'express'
import { isAuthenticated, isAuthorized } from '../controllers/auth'
import { imageToMedia } from '../controllers/media'
import {
    addItemToMyHistory,
    clearMyHistory,
    createUser,
    deleteUser,
    getManyUser,
    getTotalusersCount,
    getUser,
    getUsersCountThisMonth,
    searchUser,
    setUserId,
    updateUser,
} from '../controllers/user'
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

/*
 ** **
 ** ** ** [Members-Access-Only]
 ** **
 */
Router.use(isAuthenticated)

//[Add] add item to my history
Router.route('/add-item-to-my-history/:prodId').put(addItemToMyHistory)

//[Clear] my history
Router.route('/clear-my-history').delete(clearMyHistory)

//[Retrive] [Mofify] and [Delete] user profile
Router.route('/me')
    .get(setUserId, getUser)
    .put(
        setUserId,
        multerUpload.fields([
            {
                name: 'photo',
                maxCount: 1,
            },
        ]),
        imageToMedia('photo'),
        updateUser
    )
    .delete(setUserId, deleteUser)

/*
 ** **
 ** ** ** [Admin-Access-Only]
 ** **
 */
Router.use(isAuthorized('admin'))

Router.route('/search/:query').get(searchUser)

//[Retrieve] total users count
Router.route('/total-users-count').get(getTotalusersCount)

//[Retrieve] users count this month
Router.route('/users-count-this-month').get(getUsersCountThisMonth)

//[Retrieve] many user or [Create] a user
Router.route('/')
    .get(getManyUser)
    .post(
        multerUpload.fields([
            {
                name: 'photo',
                maxCount: 1,
            },
        ]),
        imageToMedia('photo'),
        createUser
    )

//[Retrieve] [Modify] [Remove] a user by its id
Router.route('/:id')
    .get(getUser)
    .put(
        multerUpload.fields([
            {
                name: 'photo',
                maxCount: 1,
            },
        ]),
        imageToMedia('photo'),
        updateUser
    )
    .delete(deleteUser)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

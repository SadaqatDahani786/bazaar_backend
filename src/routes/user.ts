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
const Router = express.Router({ mergeParams: true })

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

//[Update] [Delete] user browsing history
Router.route('/history').patch(addItemToMyHistory).delete(clearMyHistory)

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

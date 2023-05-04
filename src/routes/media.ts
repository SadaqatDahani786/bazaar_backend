import express from 'express'
import multerUpload from '../packages/multer'
import {
    createMedia,
    deleteMedia,
    getManyMedia,
    getMedia,
    imageToMedia,
    searchMedia,
    updateMedia,
    uploadMedia,
} from '../controllers/media'
import { isAuthenticated, isAuthorized } from '../controllers/auth'

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

/*
 ** **
 ** ** ** [Admin-Access-Only]
 ** **
 */
Router.use(isAuthenticated, isAuthorized('admin'))

//[Upload] a one or many media image files
Router.route('/upload').post(
    multerUpload.fields([
        {
            name: 'images',
        },
    ]),
    imageToMedia('images'),
    uploadMedia
)

//[Retrieve] many media or [Create] a media
Router.route('/search/:query').get(searchMedia)

//[Retrieve] many media or [Create] a media
Router.route('/')
    .get(getManyMedia)
    .post(
        multerUpload.fields([
            {
                name: 'image',
                maxCount: 1,
            },
        ]),
        imageToMedia('image'),
        createMedia
    )

//[Retrieve] [Modify] [Remove] a media by its id
Router.route('/:id').get(getMedia).put(updateMedia).delete(deleteMedia)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

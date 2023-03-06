import express from 'express'
import multerUpload from '../packages/multer'
import {
    createMedia,
    deleteMedia,
    getManyMedia,
    getMedia,
    updateMedia,
    uploadMedia,
} from '../controllers/media'

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

//[Upload] a one or many media image files
Router.route('/upload').post(
    multerUpload.fields([
        {
            name: 'images',
        },
    ]),
    uploadMedia
)

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
        createMedia
    )

//[Retrieve] [Modify] [Remove] a media by its id
Router.route('/:id')
    .get(getMedia)
    .put(
        multerUpload.fields([
            {
                name: 'image',
                maxCount: 1,
            },
        ]),
        updateMedia
    )
    .delete(deleteMedia)

/**
 ** ====================================
 ** EXPORT [ROUTER]
 ** ====================================
 */
export default Router

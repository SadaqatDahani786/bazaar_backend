import { NextFunction, Request, Response } from 'express'

//Utils
import { promisify } from 'util'
import makeUrlComplete from '../utils/makeUrlComplete'

//Model & Types
import Media from '../models/Media'
import { File } from '../types/file'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Packages
import QueryModifier from '../packages/QueryModifier'
import imageSize from 'image-size'

/**
 ** ==========================================================
 ** MIDDLEWARES
 ** ==========================================================
 */
//Store upcoming image or images as media in req object
export const imageToMedia = (field: string) => {
    return catchAsyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            //1) Validation
            if (!req.body[field]) return next()

            //2) Promisify sizeOf method
            const sizeOf = promisify(imageSize)

            //3) If single image, else array images
            if (req.body[field] && !Array.isArray(req.body[field])) {
                //Dimensions
                const uploadedFileSize = await sizeOf(
                    global.app_dir + '/public/' + req.body[field].url
                ).catch(() => {
                    throw new AppError(
                        `Please provide a valid image file in [${field}] parameter.`,
                        400
                    )
                })

                //Save it to the request object
                req.media = {
                    ...req.body[field],
                    dimensions: {
                        width: uploadedFileSize?.width,
                        height: uploadedFileSize?.height,
                    },
                }
            } else if (
                Array.isArray(req.body[field]) &&
                req.body[field].length > 0
            ) {
                const mediaObjects = req.body.images.map((file: File) => {
                    //Image diemensions
                    const uploadedFileSize = imageSize(
                        global.app_dir + '/public/' + file.url
                    )

                    //return media object
                    return {
                        ...file,
                        dimensions: {
                            width: uploadedFileSize.width,
                            height: uploadedFileSize.height,
                        },
                    }
                })

                //Save array of media into req object
                req.media = mediaObjects
            }

            //4) Call next middleware
            next()
        }
    )
}

/**
 ** ==========================================================
 ** uploadMedia - Upload one or more images
 ** ==========================================================
 */
export const uploadMedia = catchAsyncHandler(async (req, res) => {
    //1) Get media arr from req object
    const mediaDocsToBeCreated = req.media

    //2) Validation
    if (
        !mediaDocsToBeCreated ||
        (Array.isArray(mediaDocsToBeCreated) &&
            mediaDocsToBeCreated.length <= 0)
    )
        throw new AppError(
            'Please provided [images] paramenter, which must contains one or more image files.',
            400
        )

    //3) Create a Media documents from it's model
    const DocsMedia = await Media.insertMany(mediaDocsToBeCreated)

    //4) Transormed docsMedia to have the full url for images
    const transormedDocsMedia = DocsMedia.map((doc) => ({
        ...doc.toJSON(),
        url: makeUrlComplete(doc.url, req),
    }))

    //5) Send a response
    res.status(201).json({
        status: 'success',
        results: DocsMedia.length,
        data: transormedDocsMedia,
    })
})

/**
 ** ==========================================================
 ** createMedia - Create a single media
 ** ==========================================================
 */
export const createMedia = catchAsyncHandler(async (req, res) => {
    //1) Get media from req object
    const mediaToBeCreated = req.media

    //2) Validation
    if (!mediaToBeCreated)
        throw new AppError(
            'Please provide [image] paramenter, which must contains a valid image file.',
            400
        )

    //3) Create media
    const DocMedia = await Media.create(mediaToBeCreated)

    //4) Transormed docsMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia.toJSON(),
        url: makeUrlComplete(DocMedia.url, req),
    }

    //5) Send a response
    res.status(201).json({
        status: 'success',
        data: transormedDocMedia,
    })
})

/**
 ** ==========================================================
 ** getMedia - Get a single media
 ** ==========================================================
 */
export const getMedia = catchAsyncHandler(async (req, res) => {
    //1) Get id of a media to be retrieved
    const id = req.params.id

    //2) Get query
    const query = Media.findById(id)

    //3) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(
        query,
        req.query
    ).select()

    //4) Exec query to retrieve media doc found
    const DocMedia = await QueryModfier.query.exec()

    //3) If no doc found with the ID, throw error
    if (!DocMedia) {
        throw new AppError(
            'No media document found to retrieve with the id provided.',
            404
        )
    }

    //4) Transormed DocMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia.toJSON(),
        url: DocMedia.url ? makeUrlComplete(DocMedia.url, req) : undefined,
    }

    //5) Send a response
    res.status(200).json({
        status: 'success',
        data: transormedDocMedia,
    })
})

/**
 ** ==========================================================
 ** getManyMedia - Get one or more media
 ** ==========================================================
 */
export const getManyMedia = catchAsyncHandler(async (req, res) => {
    //1) Get query
    const query = Media.find()

    //2) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(query, req.query)
        .filter()
        .sort()
        .select()
        .paginate()

    //3) Exec query to retrieve all media docs match found
    const DocsMedia = await QueryModfier.query.exec()

    //4) If no doc founds, throw error
    if (!DocsMedia) {
        throw new AppError('No media document found to be retrieved.', 404)
    }

    //5) Transormed DocsMedia to have the full url for images
    const transormedDocsMedia = DocsMedia.map((media) => ({
        ...media.toJSON(),
        url: media.url ? makeUrlComplete(media.url, req) : undefined,
    }))

    //6) Send a response
    res.status(200).json({
        status: 'success',
        results: transormedDocsMedia.length,
        data: transormedDocsMedia,
    })
})

/**
 ** ==========================================================
 ** updateMedia - Update a single media
 ** ==========================================================
 */
export const updateMedia = catchAsyncHandler(async (req, res) => {
    //1) Get id of media file to be deleted
    const id = req.params.id

    //2) Media to be updated
    const mediaToBeUpdated = {
        title: req.body.title,
        description: req.body.description,
        caption: req.body.caption,
    }

    //3) Updated media document
    const DocMedia = await Media.findOneAndUpdate(
        { _id: id },
        mediaToBeUpdated,
        {
            new: true,
        }
    )

    //4) If no doc found with the id, throw error
    if (!DocMedia) {
        throw new AppError(
            'No media document found to be update with the id provided.',
            404
        )
    }

    //5) Transormed DocMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia?.toJSON(),
        url: makeUrlComplete(DocMedia.url, req),
    }

    //6) Send a response
    res.status(200).json({
        status: 'success',
        data: transormedDocMedia,
    })
})

/**
 ** ==========================================================
 ** deletedMedia - Delete a single media
 ** ==========================================================
 */
export const deleteMedia = catchAsyncHandler(async (req, res) => {
    //1) Get ID of a media to be delted
    const id = req.params.id

    //2) Delete media doc with id
    const DelResults = await Media.deleteOne({ _id: id })

    //3) If no doc found with the id, throw error
    if (!DelResults || DelResults.deletedCount <= 0) {
        throw new AppError(
            'No media document found to be delete with the id provided.',
            404
        )
    }

    //4) Send response
    res.status(204).json()
})

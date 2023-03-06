//Utils
import { promisify } from 'util'
import imageSize from 'image-size'
import makeUrlComplete from '../utils/makeUrlComplete'

//Model & Types
import Media from '../models/Media'
import { File } from '../types/file'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

/**
 ** ==========================================================
 ** uploadMedia - Upload one or more images
 ** ==========================================================
 */
export const uploadMedia = catchAsyncHandler(async (req, res) => {
    //1) Validation
    if (
        !req.body.images ||
        (Array.isArray(req.body.images) && req.body.images.length <= 0)
    )
        throw new AppError(
            'Please provided [images] paramenter, which must contains one or more image files.',
            400
        )

    //2) Media docs to be created
    const mediaDocsToBeCreated = req.body.images.map((file: File) => {
        //Get uploaded image dimenstions with imageSize
        const uploadedFileSize = imageSize(
            global.app_dir + '/public/' + file.url
        )

        //Return media to be created
        return {
            ...file,
            dimensions: {
                width: uploadedFileSize.width,
                height: uploadedFileSize.height,
            },
        }
    })

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
    //1) Validation
    if (!req.body.image)
        throw new AppError(
            'Please provide [image] paramenter, which must contains a valid image file.',
            400
        )

    //2) Get uploaded image dimenstions with imageSize
    const sizeOf = promisify(imageSize)
    const uploadedFileSize = await sizeOf(
        global.app_dir + '/public/' + req.body.image?.url
    ).catch(() => {
        throw new AppError(
            'Please provide a valid image file in [image] parameter.',
            400
        )
    })

    //3) Media to be created
    const mediaToBeCreated = {
        ...req.body,
        ...req.body.image,
        dimensions: {
            width: uploadedFileSize?.width,
            height: uploadedFileSize?.height,
        },
    }

    //4) Create media
    const DocMedia = await Media.create(mediaToBeCreated)

    //5) Transormed docsMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia.toJSON(),
        url: makeUrlComplete(DocMedia.url, req),
    }

    //6) Send a response
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

    //2) Find media from its id
    const DocMedia = await Media.findById(id)

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
        url: makeUrlComplete(DocMedia.url, req),
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
    //1) Retrieve all media docs
    const DocsMedia = await Media.find()

    //2) If no doc founds, throw error
    if (!DocsMedia) {
        throw new AppError('No media document found to be retrieved.', 404)
    }

    //3) Transormed DocsMedia to have the full url for images
    const transormedDocsMedia = DocsMedia.map((media) => ({
        ...media.toJSON(),
        url: makeUrlComplete(media.url, req),
    }))

    //4) Send a response
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

    //2) Get uploaded image dimenstions with imageSize
    const sizeOf = promisify(imageSize)

    const uploadedFileSize = await sizeOf(
        global.app_dir + '/public/' + req.body.image?.url
    ).catch(() => {
        if (req.body.image)
            throw new AppError(
                'Please provide a valid image file in [image] parameter.',
                400
            )
    })

    //3) Media to be updated
    const mediaToBeUpdated = {
        ...req.body,
        ...req.body.image,
    }

    if (uploadedFileSize) {
        mediaToBeUpdated.dimensions = {
            width: uploadedFileSize.width,
            height: uploadedFileSize.height,
        }
    }

    //4) Updated media document
    const DocMedia = await Media.findOneAndUpdate(
        { _id: id },
        mediaToBeUpdated,
        {
            new: true,
        }
    )

    //5) If no doc found with the id, throw error
    if (!DocMedia) {
        throw new AppError(
            'No media document found to be update with the id provided.',
            404
        )
    }

    //6) Transormed DocMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia?.toJSON(),
        url: makeUrlComplete(DocMedia.url, req),
    }

    //7) Send a response
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

import fs from 'fs'
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
import { isToPopulate } from '../utils/isToPopulate'

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
                if (req.media?.length)
                    req.media = [
                        ...req.media,
                        {
                            name: field,
                            value: {
                                ...req.body[field],
                                dimensions: {
                                    width: uploadedFileSize?.width,
                                    height: uploadedFileSize?.height,
                                },
                            },
                        },
                    ]
                else
                    req.media = [
                        {
                            name: field,
                            value: {
                                ...req.body[field],
                                dimensions: {
                                    width: uploadedFileSize?.width,
                                    height: uploadedFileSize?.height,
                                },
                            },
                        },
                    ]
            } else if (
                Array.isArray(req.body[field]) &&
                req.body[field].length > 0
            ) {
                const mediaObjects = req.body[field].map((file: File) => {
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
                if (req.media?.length)
                    req.media = [
                        ...req.media,
                        {
                            name: field,
                            value: mediaObjects,
                        },
                    ]
                else
                    req.media = [
                        {
                            name: field,
                            value: mediaObjects,
                        },
                    ]
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
    const mediaDocsToBeCreated = req.media.find(
        (media) => media.name === 'images'
    )?.value

    //2) Validation
    if (
        !mediaDocsToBeCreated ||
        !Array.isArray(mediaDocsToBeCreated) ||
        mediaDocsToBeCreated.length <= 0
    )
        throw new AppError(
            'Please provided [images] paramenter, which must contains one or more image files.',
            400
        )

    //3) Create a Media documents from it's model
    const DocsMedia = await Media.insertMany(
        mediaDocsToBeCreated.map((media) => ({
            ...media,
            uploaded_by: req.user._id,
        }))
    )

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
 ** searchMedia - Get one or more media via searching
 ** ==========================================================
 */
export const searchMedia = catchAsyncHandler(async (req, res) => {
    //1) Get search query from params
    const query = req.params.query

    //2) Search for media
    const DocsMedia = await Media.find({ $text: { $search: query } })

    //3) Transormed DocsMedia to have the full url for images
    const transormedDocsMedia = DocsMedia.map((media) => ({
        ...media.toJSON(),
        url: media.url ? makeUrlComplete(media.url, req) : undefined,
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
 ** createMedia - Create a single media
 ** ==========================================================
 */
export const createMedia = catchAsyncHandler(async (req, res) => {
    //1) Get media from req object
    const mediaToBeCreated = {
        title: req.body.title,
        description: req.body.description,
        caption: req.body.description,
        uploaded_by: req.user._id,
    }

    //2) Validation
    if (!req.media?.some((m) => m.name === 'image'))
        throw new AppError(
            'Please provide [image] paramenter, which must contains a valid image file.',
            400
        )

    //3) Create media
    const DocMedia = await Media.create({
        ...req.media.find((m) => m.name === 'image')?.value,
        ...mediaToBeCreated,
    })

    //4) Populate fields
    await DocMedia.populate({
        path: 'uploaded_by',
        select: { _id: 0, name: 1, email: 1 },
    })

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

    //2) Get query
    const query = Media.findById(id)

    //3) Populates fields when it's okay to do so
    if (isToPopulate('uploaded_by', req)) {
        query.populate({
            path: 'uploaded_by',
            select: { _id: 0, name: 1, email: 1 },
        })
    }

    //4) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(
        query,
        req.query
    ).select()

    //5) Exec query to retrieve media doc found
    const DocMedia = await QueryModfier.query.exec()

    //6) If no doc found with the ID, throw error
    if (!DocMedia) {
        throw new AppError(
            'No media document found to retrieve with the id provided.',
            404
        )
    }

    //7) Transormed DocMedia to have the full url for images
    const transormedDocMedia = {
        ...DocMedia.toJSON(),
        url: DocMedia.url ? makeUrlComplete(DocMedia.url, req) : undefined,
    }

    //8) Send a response
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

    //2) Populates fields when it's okay to do so
    if (isToPopulate('uploaded_by', req)) {
        query.populate({
            path: 'uploaded_by',
            select: { _id: 0, name: 1, email: 1 },
        })
    }

    //3) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(query, req.query)
        .filter()
        .sort()
        .select()
        .paginate()

    //4) Exec query to retrieve all media docs match found
    const DocsMedia = await QueryModfier.query.exec()

    //5) Create new query and apply modifier just filter only to count documents
    const DocsCount = await new QueryModifier<typeof query>(
        Media.find(),
        req.query
    )
        .filter()
        .query.count()
        .exec()

    //5) If no doc founds, throw error
    if (!DocsMedia) {
        throw new AppError('No media document found to be retrieved.', 404)
    }

    //6) Transormed DocsMedia to have the full url for images
    const transormedDocsMedia = DocsMedia.map((media) => ({
        ...media.toJSON(),
        url: media.url ? makeUrlComplete(media.url, req) : undefined,
    }))

    //7) Send a response
    res.status(200).json({
        status: 'success',
        results: transormedDocsMedia.length,
        data: transormedDocsMedia,
        count: DocsCount,
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

    //5) Populate fields
    await DocMedia.populate({
        path: 'uploaded_by',
        select: { _id: 0, name: 1, email: 1 },
    })

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
    const DocMedia = await Media.findByIdAndDelete(id)

    //3) If no doc found with the id, throw error
    if (!DocMedia) {
        throw new AppError(
            'No media document found to be delete with the id provided.',
            404
        )
    }

    //4) Delete attached media and send response
    fs.unlink(`${global.app_dir}/public/${DocMedia.url}`, (err) => {
        if (err) throw err
        else res.status(204).json()
    })
})

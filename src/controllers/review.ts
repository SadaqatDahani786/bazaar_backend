import { Request, Response } from 'express'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Models & Types
import Media from '../models/Media'
import Review, { IReview } from '../models/Review'

//Packages & Utils
import { isToPopulate } from '../utils/isToPopulate'
import makeUrlComplete from '../utils/makeUrlComplete'
import QueryModifier from '../packages/QueryModifier'

/**
 ** ==========================================================
 ** createReview - Create a single review
 ** ==========================================================
 */
export const createReview = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get review to be created from req body
        const reviewToBeCreated: IReview = {
            title: req.body.title,
            review: req.body.review,
            rating: req.body.rating,
            product: req.body.product,
            author: req.body.author,
        }

        //2) Set product images if provided
        if (req.media?.some((m) => m.name === 'images')) {
            const imgs = req.media.find((m) => m.name === 'images')?.value
            if (Array.isArray(imgs) && imgs.length > 0) {
                await Promise.all(
                    imgs.map(async (m) => {
                        return await Media.create(m)
                    })
                ).then((mediaObjects) => {
                    reviewToBeCreated.images = mediaObjects.map((m) => m._id)
                })
            }
        }

        //3) Create review
        const DocReview = await Review.create(reviewToBeCreated)

        //4) Populate fields
        await DocReview.populate({
            path: 'product author images',
            select: {
                _id: 0,
                url: 1,
                name: 1,
                title: 1,
            },
        })

        //5) Make url complete for images
        const transformedImages: { url: string }[] = []
        DocReview?.images?.map((media) => {
            if (media instanceof Media)
                transformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //6) Send a response
        res.status(201).json({
            status: 'success',
            data: { ...DocReview.toJSON(), images: transformedImages },
        })
    }
)

/**
 ** ==========================================================
 ** getReview - Retrieve a single review
 ** ==========================================================
 */
export const getReview = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a review to be retrieved
        const id = req.params.id

        //2) Get query
        const query = Review.findById(id)

        //3) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //4) Populate fields only when it's okay to do so
        if (isToPopulate('images', req)) {
            query.populate({
                path: 'images',
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('product', req)) {
            query.populate({
                path: 'product',
                select: { title: 1, _id: 0 },
            })
        }
        if (isToPopulate('author', req)) {
            query.populate({
                path: 'author',
                select: { name: 1, _id: 0 },
            })
        }

        //5) Exec query to retrieve review doc match found
        const DocReview = await QueryModfier.query.exec()

        //6) If no product document found, throw err
        if (!DocReview) {
            throw new AppError(
                'No review document found to be retrieved with the id provided.',
                404
            )
        }

        //7) Make url complete for images
        const tranformedImages: { url: string }[] = []
        DocReview?.images?.map((media) => {
            if (media instanceof Media)
                tranformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //8) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                ...DocReview.toJSON(),
                images:
                    tranformedImages.length > 0 ? tranformedImages : undefined,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getManyReview - Retrieve one or more review
 ** ==========================================================
 */
export const getManyReview = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = Review.find()

        //2) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //3) Populate fields only when it's okay to do so
        if (isToPopulate('images', req)) {
            query.populate({
                path: 'images',
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('product', req)) {
            query.populate({
                path: 'product',
                select: { title: 1, _id: 0 },
            })
        }
        if (isToPopulate('author', req)) {
            query.populate({
                path: 'author',
                select: { name: 1, _id: 0 },
            })
        }

        //4) Exec query to retrieve all review docs match found
        const DocsReviews = await QueryModfier.query.exec()

        //5) If no product document found, throw err
        if (!DocsReviews) {
            throw new AppError('No review document found to be retrieved.', 404)
        }

        //6) Make url complete for image
        const tranformedDocsReview = DocsReviews.map((prod) => {
            //=> Transform images
            const tranformedImages: { url: string }[] = []
            prod?.images?.map((media) => {
                if (media instanceof Media)
                    tranformedImages.push({
                        url: makeUrlComplete(media.url, req),
                    })
            })

            //=> Return
            return {
                ...prod.toJSON(),
                images:
                    tranformedImages.length > 0 ? tranformedImages : undefined,
            }
        })

        //7) Send a response
        res.status(200).json({
            status: 'success',
            results: tranformedDocsReview.length,
            data: tranformedDocsReview,
        })
    }
)

/**
 ** ==========================================================
 ** updateReview - Update a single review
 ** ==========================================================
 */
export const updateReview = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a review to be updated
        const id = req.params.id

        //2) Get fields from req body
        const reviewToBeUpdated: IReview = {
            title: req.body.title,
            review: req.body.review,
            rating: req.body.rating,
            product: req.body.product,
            author: req.body.author,
        }

        //3) Set product images if provided
        if (req.media?.some((m) => m.name === 'images')) {
            const imgs = req.media.find((m) => m.name === 'images')?.value
            if (Array.isArray(imgs) && imgs.length > 0) {
                await Promise.all(
                    imgs.map(async (m) => {
                        return await Media.create(m)
                    })
                ).then((mediaObjects) => {
                    reviewToBeUpdated.images = mediaObjects.map((m) => m._id)
                })
            }
        }

        //4) Update review
        const DocReview = await Review.findByIdAndUpdate(
            id,
            reviewToBeUpdated,
            { new: true }
        ).populate({
            path: 'product author images',
            select: {
                _id: 0,
                url: 1,
                name: 1,
                title: 1,
            },
        })

        //5) if no doc found with the id, throw err
        if (!DocReview) {
            throw new AppError(
                'No review document found to be updated with the provided.',
                404
            )
        }

        //6) Make url complete for images
        const transformedImages: { url: string }[] = []
        DocReview?.images?.map((media) => {
            if (media instanceof Media)
                transformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //7) Send a response
        res.status(200).json({
            status: 'success',
            data: { ...DocReview.toJSON(), images: transformedImages },
        })
    }
)

/**
 ** ==========================================================
 ** deleteReview - Delete a single review
 ** ==========================================================
 */
export const deleteReview = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a review to be deleted
        const id = req.params.id

        //2) Delete review
        const DelResults = await Review.deleteOne({ _id: id })

        //3) If no doc found with the id, throw error
        if (!DelResults || DelResults.deletedCount <= 0)
            throw new AppError(
                'No review document found to be deleted with the id provided.',
                404
            )

        //4) Send a response
        res.status(204).json()
    }
)

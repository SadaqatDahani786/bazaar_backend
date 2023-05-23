import { NextFunction, Request, Response } from 'express'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Models & Types
import Media from '../models/Media'
import User from '../models/User'
import Review, { IReview } from '../models/Review'

//Packages & Utils
import { isToPopulate } from '../utils/isToPopulate'
import makeUrlComplete from '../utils/makeUrlComplete'
import QueryModifier from '../packages/QueryModifier'
import { ObjectId } from 'mongodb'

/**
 ** ==========================================================
 ** MIDDLEWARES
 ** ==========================================================
 */
//=> Set filter query
export const setFilterQuery = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    //=> Set product id
    if (req.params.prodId)
        req.query = { ...req.query, product: req.params.prodId }

    //=> Set user id
    if (req.user) req.query = { ...req.query, author: req.user._id?.toString() }

    //=> Move to next middleware
    next()
}

//=> tranform the body by adding author
export const filterAndTransformTheBody = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user.role !== 'admin') req.body.author = undefined
    if (req.params.prodId) req.body.product = req.params.prodId
    next()
}

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
            product: req.params.prodId ? req.params.prodId : req.body.product,
            author: req.body.author ? req.body.author : req.user._id,
        }

        //2) Find if the product already reviewed by current user
        const DocUserReview = await Review.findOne({
            author: req.body.author,
            product: req.body.product,
        }).populate({
            path: 'author',
        })

        //3) Don't allow multiple reviews, throw err
        if (DocUserReview) {
            throw new AppError(
                `The product already reviewed by user ${
                    DocUserReview.author instanceof User
                        ? DocUserReview.author.name
                        : ''
                }, multiple reviews are not allowed on same product.`,
                400
            )
        }

        //4) Set product images if provided
        if (req.media?.some((m) => m.name === 'images')) {
            const imgs = req.media.find((m) => m.name === 'images')?.value
            if (Array.isArray(imgs) && imgs.length > 0) {
                await Promise.all(
                    imgs.map(async (media) => {
                        return await Media.create({
                            ...media,
                            uploaded_by: reviewToBeCreated.author,
                        })
                    })
                ).then((mediaObjects) => {
                    reviewToBeCreated.images = mediaObjects.map((m) => m._id)
                })
            }
        }

        //6) Create review
        const DocReview = await Review.create(reviewToBeCreated)

        //7) Populate product image fields
        await DocReview.populate({
            path: 'product images',
            select: {
                _id: 1,
                url: 1,
                name: 1,
                title: 1,
            },
        })

        //8) Populate author and author image
        await DocReview.populate({
            path: 'author',
            populate: {
                path: 'photo',
                model: 'Media',
            },
        })

        //9) Make url complete for images
        const transformedImages: { url: string }[] = []
        DocReview?.images?.map((media) => {
            if (media instanceof Media)
                transformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //10) Make url complete for author url
        if (
            DocReview.author instanceof User &&
            DocReview.author.photo instanceof Media
        )
            DocReview.author.photo.url = makeUrlComplete(
                DocReview.author.photo.url,
                req
            )

        //11) Send a response
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
                select: { url: 1, _id: 1 },
            })
        }
        if (isToPopulate('product', req)) {
            query.populate({
                path: 'product',
                select: { title: 1, _id: 1 },
            })
        }
        if (isToPopulate('author', req)) {
            query.populate({
                path: 'author',
                select: { name: 1, _id: 1 },
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
                select: { url: 1, _id: 1, title: 1 },
            })
        }
        if (isToPopulate('product', req)) {
            query.populate({
                path: 'product',
                select: { title: 1, _id: 1 },
            })
        }
        if (isToPopulate('author', req)) {
            query.populate({
                path: 'author',
                select: { name: 1, username: 1, _id: 1 },
                populate: {
                    path: 'photo',
                    model: 'Media',
                },
            })
        }

        //4) Exec query to retrieve all review docs match found
        const DocsReviews = await QueryModfier.query.exec()

        //5) Create new query and apply modifier just filter only to count documents
        const DocsCount = await new QueryModifier<typeof query>(
            Review.find(),
            req.query
        )
            .filter()
            .query.count()
            .exec()

        //6) If no product document found, throw err
        if (!DocsReviews) {
            throw new AppError('No review document found to be retrieved.', 404)
        }

        //7) Make url complete for image
        const tranformedDocsReview = DocsReviews.map((prod) => {
            //=> Transform images
            const tranformedImages: { url: string }[] = []
            prod?.images?.map((media) => {
                if (media instanceof Media)
                    tranformedImages.push({
                        url: makeUrlComplete(media.url, req),
                    })
            })

            //=> Transform author photo
            const transformedAuthor = prod.author
            if (
                transformedAuthor instanceof User &&
                transformedAuthor.photo instanceof Media
            ) {
                transformedAuthor.photo.url = makeUrlComplete(
                    transformedAuthor.photo.url,
                    req
                )
            }

            //=> Return
            return {
                ...prod.toJSON(),
                images:
                    tranformedImages.length > 0 ? tranformedImages : undefined,
            }
        })

        //8) Send a response
        res.status(200).json({
            count: DocsCount,
            status: 'success',
            results: tranformedDocsReview.length,
            data: tranformedDocsReview,
        })
    }
)

/**
 ** ==========================================================
 ** getRatingsOfProduct - Get rartings of a product
 ** ==========================================================
 */
export const getRatingsOfProduct = catchAsyncHandler(async (req, res) => {
    //1) Get product id
    const ids = req.params.prodId.split(',')

    //2) Get rating via aggreggation
    const ratings = await Review.aggregate([
        {
            $match: { product: { $in: ids.map((id) => new ObjectId(id)) } },
        },
        {
            $group: {
                _id: '$product',
                product: { $first: '$product' },
                ratings: { $push: '$rating' },
            },
        },
        {
            $unwind: '$ratings',
        },
        {
            $group: {
                _id: { ratings: '$ratings', product: '$product' },
                product: { $first: '$product' },
                rating_star: { $first: '$ratings' },
                ratings_count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$product',
                product: { $first: '$product' },
                ratings: {
                    $push: {
                        rating_star: '$rating_star',
                        ratings_count: '$ratings_count',
                    },
                },
            },
        },
        {
            $sort: { rating_star: 1 },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ])

    //3) Send reponse
    res.status(200).json({
        status: 'success',
        data: ratings,
    })
})

/**
 ** ==========================================================
 ** searchReview - Get one or more review via searching
 ** ==========================================================
 */
export const searchReview = catchAsyncHandler(async (req, res) => {
    //1) Get search query from params
    const query = req.params.query

    //2) Search for media
    const DocsReview = await Review.find({ $text: { $search: query } })

    //3) Make url complete for image
    const tranformedDocsReview = DocsReview.map((review) => {
        //=> Transform images
        const tranformedImages: { url: string }[] = []
        review?.images?.map((media) => {
            if (media instanceof Media)
                tranformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //=> Return
        return {
            ...review.toJSON(),
            images: tranformedImages.length > 0 ? tranformedImages : undefined,
        }
    })

    //4) Send a response
    res.status(200).json({
        status: 'success',
        results: tranformedDocsReview.length,
        data: tranformedDocsReview,
    })
})

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
            author: req.body.author ? req.body.author : req.user._id,
        }

        //3) Find out if the review already exist by this author for this product
        const DocUserReview = await Review.findOne({
            author: req.body.author,
            product: req.body.product,
        }).populate({ path: 'author' })

        //4) If found review other than this review, throw err, else proceed and set the auther
        if (DocUserReview && DocUserReview._id.toString() !== id.toString()) {
            throw new AppError(
                `The product already reviewed by user ${
                    DocUserReview.author instanceof User
                        ? DocUserReview.author.name
                        : ''
                }, multiple reviews are not allowed for the same product.`,
                400
            )
        } else if (DocUserReview) {
            reviewToBeUpdated.author = DocUserReview.author
        }

        //5) Set product images if provided
        if (req.media?.some((m) => m.name === 'images')) {
            const imgs = req.media.find((m) => m.name === 'images')?.value
            if (Array.isArray(imgs) && imgs.length > 0) {
                await Promise.all(
                    imgs.map(async (media) => {
                        return await Media.create({
                            ...media,
                            uploaded_by: reviewToBeUpdated.author,
                        })
                    })
                ).then((mediaObjects) => {
                    reviewToBeUpdated.images = mediaObjects.map((m) => m._id)
                })
            }
        }

        //6) Update condition differs based on being update by admin or user
        const updateCondition = req.body.author
            ? { author: req.body.author, product: req.body.product }
            : { _id: id }

        //7) Update review
        const DocReview = await Review.findOneAndUpdate(
            updateCondition,
            reviewToBeUpdated,
            { new: true }
        )
            .populate({
                path: 'product images',
                select: {
                    _id: 1,
                    url: 1,
                    name: 1,
                    title: 1,
                },
            })
            .populate({
                path: 'author',
                populate: {
                    path: 'photo',
                    model: 'Media',
                },
            })

        //8) if no doc found with the id, throw err
        if (!DocReview) {
            throw new AppError(
                'No review document found to be updated with the provided.',
                404
            )
        }

        //9) Make url complete for images
        const transformedImages: { url: string }[] = []
        DocReview?.images?.map((media) => {
            if (media instanceof Media)
                transformedImages.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //10) Make url complete for author url
        if (
            DocReview.author instanceof User &&
            DocReview.author.photo instanceof Media
        )
            DocReview.author.photo.url = makeUrlComplete(
                DocReview.author.photo.url,
                req
            )

        //11) Send a response
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

        //2) Allow admin to del any review, restrict user to be able to delete it's own review only
        const deleteCondition =
            req.user.role === 'admin'
                ? { _id: id }
                : { author: req.user._id, product: req.params.prodId }

        //3) Delete review
        const DelResults = await Review.deleteOne(deleteCondition)

        //4) If no doc found with the id, throw error
        if (!DelResults || DelResults.deletedCount <= 0)
            throw new AppError(
                'No review document found to be deleted with the id provided.',
                404
            )

        //5) Send a response
        res.status(204).json()
    }
)

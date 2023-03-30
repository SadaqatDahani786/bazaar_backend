import { Request, Response } from 'express'

//Models & Types
import Deal, { IDeal } from '../models/Deal'
import Media from '../models/Media'

//Error Handler
import { catchAsyncHandler } from '../error handling/errorHandlers'
import AppError from '../error handling/AppError'

//Packages & Utils
import makeUrlComplete from '../utils/makeUrlComplete'
import QueryModifier from '../packages/QueryModifier'
import { isToPopulate } from '../utils/isToPopulate'

/**
 ** ====================================
 ** createDeal = Create a single deal
 ** ====================================
 */
export const createDeal = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get fields from req body
        const dealToBeCreated: IDeal = {
            title: req.body.title,
            products: req.body.products,
            image: req.body.image,
            starts_from: req.body.starts_from,
            expires_in: req.body.expires_in,
        }

        //2) Create deal
        const DocDeal = await Deal.create(dealToBeCreated)

        //3) Populate fields
        await DocDeal.populate({
            path: 'image products',
            select: { _id: 0, url: 1, title: 1 },
        })

        //4) Make url complete for image
        if (DocDeal?.image instanceof Media) {
            DocDeal.image.url = makeUrlComplete(DocDeal.image.url, req)
        }

        //5) Send a response
        res.status(201).json({
            status: 'success',
            data: DocDeal,
        })
    }
)

/**
 ** ====================================
 ** getDeal = Get a single deal
 ** ====================================
 */
export const getDeal = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a deal to be retrieved
        const id = req.params.id

        //2) Get query
        const query = Deal.findById(id)

        //3) Populate fields when it's okay to do so
        if (isToPopulate('image', req)) {
            query.populate({
                path: 'image',
                select: { _id: 0, url: 1 },
            })
        }
        if (isToPopulate('products', req)) {
            query.populate({
                path: 'products',
                select: { _id: 0, title: 1 },
            })
        }

        //4) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //5) Exec query to retrieve deal doc match found
        const DocDeal = await QueryModfier.query.exec()

        //6) If no document found, throw err
        if (!DocDeal) {
            throw new AppError(
                'No deal document found to be retrieve with the id provided.',
                404
            )
        }

        //7) Make url complete for image
        if (DocDeal?.image instanceof Media) {
            DocDeal.image.url = makeUrlComplete(DocDeal.image.url, req)
        }

        //8) Send a response
        res.status(200).json({
            status: 'success',
            data: DocDeal,
        })
    }
)

/**
 ** ====================================
 ** getManyDeal = Get one or more deal
 ** ====================================
 */
export const getManyDeal = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = Deal.find()

        //2) Populate fields when it's okay to do so
        if (isToPopulate('image', req)) {
            query.populate({
                path: 'image',
                select: { _id: 0, url: 1 },
            })
        }
        if (isToPopulate('products', req)) {
            query.populate({
                path: 'products',
                select: { _id: 0, title: 1 },
            })
        }

        //3) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //4) Exec query to retrieve deal docs match found
        const DocsDeal = await QueryModfier.query.exec()

        //5) If no document found, throw err
        if (!DocsDeal || DocsDeal.length <= 0) {
            throw new AppError('No deal document found to be retrieve.', 404)
        }

        //6) Transormed DocsDeal to have the full url for images
        const transformedDocsDeal = DocsDeal.map((deal) => {
            if (deal?.image instanceof Media)
                return {
                    ...deal.toJSON(),
                    image: {
                        url: makeUrlComplete(deal.image.url, req),
                    },
                }

            return deal
        })

        //7) Send a response
        res.status(200).json({
            status: 'success',
            results: transformedDocsDeal.length,
            data: transformedDocsDeal,
        })
    }
)

/**
 ** ====================================
 ** updateDeal = Update a single deal
 ** ====================================
 */
export const updateDeal = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of deal to be updated
        const id = req.params.id

        //2) Get fields from req body
        const dealToBeUpdated: IDeal = {
            title: req.body.title,
            products: req.body.products,
            image: req.body.image,
            starts_from: req.body.starts_from,
            expires_in: req.body.expires_in,
        }

        //3) Update deal
        const DocDeal = await Deal.findByIdAndUpdate(id, dealToBeUpdated, {
            new: true,
        }).populate({
            path: 'image products',
            select: { _id: 0, url: 1, title: 1 },
        })

        //4) If no deal document found, throw err
        if (!DocDeal) {
            throw new AppError(
                'No deal document found to be update with the id provided.',
                404
            )
        }

        //5) Make url complete for image
        if (DocDeal?.image instanceof Media) {
            DocDeal.image.url = makeUrlComplete(DocDeal.image.url, req)
        }

        //6) Return a response
        res.status(200).json({
            status: 'sucess',
            data: DocDeal,
        })
    }
)

/**
 ** ====================================
 ** deleteDeal = Delete a single deal
 ** ====================================
 */
export const deleteDeal = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a deal to be deleted
        const id = req.params.id

        //2) Delete deal
        const DelResults = await Deal.deleteOne({ _id: id })

        //3) If no document found, throw err
        if (!DelResults || DelResults.deletedCount <= 0) {
            throw new AppError(
                'No deal found to be deleted with the id provided.',
                404
            )
        }

        //4) Send a response
        res.status(204).json()
    }
)

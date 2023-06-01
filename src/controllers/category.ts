import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'

//Utils
import makeUrlComplete from '../utils/makeUrlComplete'
import { isToPopulate } from '../utils/isToPopulate'

//Models
import Media from '../models/Media'
import Category, { ICategory } from '../models/Category'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Query Modifier
import QueryModifier from '../packages/QueryModifier'
import Order from '../models/Order'

/**
 ** ==========================================================
 ** createCategory - Create a single category
 ** ==========================================================
 */
export const createCategory = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get fields from request body
        const categoryToBeCreated: ICategory = {
            slug: req.body.slug,
            name: req.body.name,
            description: req.body.description,
            image: new ObjectId(req.body.image),
            parent: req.body.parent,
        }

        //2) Create category
        const DocCategory = await Category.create(categoryToBeCreated)

        //3) Populate fields
        await DocCategory.populate({
            path: 'image parent',
            select: { url: 1, _id: 0, name: 1, slug: 1 },
        })

        //4) Make url complete
        if (DocCategory?.image instanceof Media) {
            DocCategory.image.url = makeUrlComplete(DocCategory.image.url, req)
        }

        //5) Send a response
        res.status(201).json({
            status: 'success',
            data: DocCategory,
        })
    }
)

/**
 ** ==========================================================
 ** getCategory - get a single category
 ** ==========================================================
 */
export const getCategory = catchAsyncHandler(async (req, res) => {
    //1) Get id of category to be retrieved
    const id = req.params.id

    //2) Get query
    const query = Category.findById(id)

    //3) Populate fields only when it's okay to do so
    if (isToPopulate('image', req)) {
        query.populate({
            path: 'image',
            select: { url: 1, _id: 0 },
        })
    }
    if (isToPopulate('parent', req)) {
        query.populate({
            path: 'parent',
            select: { _id: 0, name: 1, slug: 1 },
        })
    }

    //4) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(
        query,
        req.query
    ).select()

    //4) Exec query to retrieve category doc found
    const DocCategory = await QueryModfier.query.exec()

    //5) If no doc found with the id, throw error
    if (!DocCategory) {
        throw new AppError(
            'No category document found to retrieve with the id provided.',
            404
        )
    }

    //6) Transormed DocCategory to have the full url for images
    if (DocCategory?.image instanceof Media) {
        DocCategory.image.url = DocCategory.image.url
            ? makeUrlComplete(DocCategory.image.url, req)
            : ''
    }

    //7) Send a response
    res.status(200).json({
        status: 'success',
        data: DocCategory,
    })
})

/**
 ** ==========================================================
 ** getManyCategory - Get one or more categories
 ** ==========================================================
 */
export const getManyCategory = catchAsyncHandler(async (req, res) => {
    //1) Get query
    const query = Category.find()

    //2) Populate fields only when it's okay to do so
    if (isToPopulate('image', req)) {
        query.populate({
            path: 'image',
            select: { url: 1, _id: 1 },
        })
    }
    if (isToPopulate('parent', req)) {
        query.populate({
            path: 'parent',
            select: { _id: 1, name: 1, slug: 1 },
        })
    }

    //3) Apply query modifiers to query
    const QueryModfier = new QueryModifier<typeof query>(query, req.query)
        .filter()
        .sort()
        .select()
        .paginate()

    //4) Retrieve all category docs
    const DocsCategory = await QueryModfier.query.exec()

    //5) Create new query and apply modifier just filter only to count documents
    const DocsCount = await new QueryModifier<typeof query>(
        Category.find(),
        req.query
    )
        .filter()
        .query.count()
        .exec()

    //6) Transormed DocsCategory to have the full url for images
    const transformedDocCategories = DocsCategory.map((category) => {
        if (category?.image instanceof Media)
            return {
                ...category.toJSON(),
                image: {
                    url: makeUrlComplete(category.image.url, req),
                },
            }

        return category
    })

    //7) Send a response
    res.status(200).json({
        status: 'success',
        results: transformedDocCategories.length,
        data: transformedDocCategories,
        count: DocsCount,
    })
})

/**
 ** ==========================================================
 ** getTotalSalesInEachCategory - Get the tatal sales in each category
 ** ==========================================================
 */
export const getTotalSalesInEachCategory = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get sales in each category via aggregation
        const SalesInEachCategory = await Order.aggregate([
            {
                $unwind: {
                    path: '$products',
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $unwind: {
                    path: '$product',
                },
            },
            {
                $unwind: {
                    path: '$product.categories',
                },
            },
            {
                $group: {
                    _id: '$product.categories',
                    sales: { $sum: '$billing.paid_amount' },
                    orders: { $sum: '$products.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                },
            },
            {
                $sort: {
                    sales: -1,
                },
            },
            {
                $limit: 6,
            },
        ])

        //2) Send Response
        res.status(200).json({
            status: 'success',
            results: SalesInEachCategory.length,
            data: SalesInEachCategory,
        })
    }
)

/**
 ** ==========================================================
 ** searchCategory - Get one or more category via searching
 ** ==========================================================
 */
export const searchCategory = catchAsyncHandler(async (req, res) => {
    //1) Get search query from params
    const query = req.params.query

    //2) Search for media
    const DocsCategory = await Category.find({ $text: { $search: query } })

    //3) Transormed DocsCategory to have the full url for images
    const transformedDocsCategory = DocsCategory.map((category) => {
        if (category?.image instanceof Media)
            return {
                ...category.toJSON(),
                image: {
                    url: makeUrlComplete(category.image.url, req),
                },
            }

        return category
    })

    //4) Send a response
    res.status(200).json({
        status: 'success',
        results: transformedDocsCategory.length,
        data: transformedDocsCategory,
    })
})

/**
 ** ==========================================================
 ** updateCategory - Update a single category
 ** ==========================================================
 */
export const updateCategory = catchAsyncHandler(async (req, res) => {
    //1) Get id of category to be updated
    const id = req.params.id

    //2) Get fields from request body
    const categoryToBeUpdated: ICategory = {
        slug: req.body.slug,
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        parent: req.body.parent,
    }

    //3) Updated category document
    const DocCategory = await Category.findOneAndUpdate(
        { _id: id },
        categoryToBeUpdated,
        { new: true }
    ).populate({
        path: 'image parent',
        select: { url: 1, _id: 0, name: 1, slug: 1 },
    })

    //4) If no doc found with the id, throw error
    if (!DocCategory) {
        throw new AppError(
            'No category document found to be update with the id provided.',
            404
        )
    }

    //5) Transormed DocCategory to have the full url for images
    if (DocCategory.image instanceof Media) {
        DocCategory.image.url = makeUrlComplete(DocCategory.image.url, req)
    }

    //6) Send a response
    res.status(200).json({
        status: 'success',
        data: DocCategory,
    })
})

/**
 ** ==========================================================
 ** deleteCategory - Delete a single category
 ** ==========================================================
 */
export const deleteCategory = catchAsyncHandler(async (req, res) => {
    //1) Get ID of a media to be delted
    const id = req.params.id

    //2) Delete media doc with id
    const DelResults = await Category.deleteOne({ _id: id })

    //3) If no doc found with the id, throw error
    if (!DelResults || DelResults.deletedCount <= 0) {
        throw new AppError(
            'No category document found to be delete with the id provided.',
            404
        )
    }

    //4) Send response
    res.status(204).json()
})

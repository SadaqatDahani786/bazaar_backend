import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'

//Models & Types
import Media, { IMedia } from '../models/Media'
import User from '../models/User'
import Order from '../models/Order'
import Product, { IProduct } from '../models/Product'

//Error Handler
import { catchAsyncHandler } from '../error handling/errorHandlers'
import AppError from '../error handling/AppError'

//Packages & Utils
import makeUrlComplete from '../utils/makeUrlComplete'
import QueryModifier from '../packages/QueryModifier'
import { isToPopulate } from '../utils/isToPopulate'

/**
 ** ==========================================================
 ** createProduct - Create a single product
 ** ==========================================================
 */
export const createProduct = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get product fields from req body
        const productToBeCreated: IProduct = {
            sku: req.body.sku,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            selling_price: req.body.selling_price,
            image: req.body.image,
            image_gallery:
                req.body.image_gallery && JSON.parse(req.body.image_gallery),
            stock: req.body.stock,
            categories: req.body.categories && JSON.parse(req.body.categories),
            manufacturing_details: {
                brand: req.body.manufacturing_details?.brand,
                model_number: req.body.manufacturing_details?.model_number,
                release_date: req.body.manufacturing_details?.release_date,
            },
            shipping: {
                dimensions: {
                    width: req.body.shipping?.dimensions?.width,
                    height: req.body.shipping?.dimensions?.height,
                    length: req.body.shipping?.dimensions?.length,
                },
                weight: req.body.shipping?.weight,
            },
            variants: req.body.variants && JSON.parse(req.body.variants),
            staff_picked: req.body.staff_picked,
        }

        //2) Create product
        const DocProduct = await Product.create(productToBeCreated)

        //3) Populate Fields
        await DocProduct.populate({
            path: 'image image_gallery categories',
            select: {
                _id: 1,
                url: 1,
                name: 1,
                title: 1,
                slug: 1,
                parent: 1,
            },
        })

        //4) Make url complete for image
        if (DocProduct?.image instanceof Media) {
            DocProduct.image.url = makeUrlComplete(DocProduct.image.url, req)
        }

        //5) Make url complete for image gallery
        const tranformedImageGallery: { url: string }[] = []
        DocProduct?.image_gallery?.map((media) => {
            if (media instanceof Media)
                tranformedImageGallery.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //6) Send a response
        res.status(201).json({
            status: 'success',
            data: {
                ...DocProduct.toJSON(),
                image_gallery: tranformedImageGallery,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getProduct - Get a single product
 ** ==========================================================
 */
export const getProduct = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get an id of product to be retrieved
        const id = req.params.id

        //2) Get query
        const query = Product.findById(id)

        //3) Populate fields only when it's okay to do so
        if (isToPopulate('image', req)) {
            query.populate({
                path: 'image',
                select: { url: 1, _id: 1, title: 1 },
            })
        }
        if (isToPopulate('image_gallery', req)) {
            query.populate({
                path: 'image_gallery',
                select: { url: 1, _id: 1, title: 1 },
            })
        }
        if (isToPopulate('categories', req)) {
            query.populate({
                path: 'categories',
                select: { name: 1, slug: 1, parent: 1, _id: 1 },
            })
        }

        //4) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //5) Exec query to retrieve category doc found
        const DocProduct = await QueryModfier.query.exec()

        //6) If no product document found, throw err
        if (!DocProduct) {
            throw new AppError(
                'No product document found to retrieve with the id provided.',
                404
            )
        }

        //7) Make url complete for image
        if (DocProduct?.image instanceof Media) {
            DocProduct.image.url = makeUrlComplete(DocProduct.image.url, req)
        }

        //8) Make url complete for image gallery
        const tranformedImageGallery: { url: string }[] = []
        DocProduct?.image_gallery?.map((media) => {
            if (media instanceof Media)
                tranformedImageGallery.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //9) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                ...DocProduct.toJSON(),
                image_gallery:
                    tranformedImageGallery.length > 0
                        ? tranformedImageGallery
                        : undefined,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getManyProduct - Get one or more product
 ** ==========================================================
 */
export const getManyProduct = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = Product.find()

        //2) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //3) Populate fields only when it's okay to do so
        if (isToPopulate('image', req)) {
            query.populate({
                path: 'image',
                select: { url: 1, _id: 1, title: 1 },
            })
        }
        if (isToPopulate('image_gallery', req)) {
            query.populate({
                path: 'image_gallery',
                select: { url: 1, _id: 1, title: 1 },
            })
        }
        if (isToPopulate('categories', req)) {
            query.populate({
                path: 'categories',
                select: { name: 1, slug: 1, parent: 1, _id: 1 },
            })
        }

        //4) Exec query to retrieve all product docs match found
        const DocsProduct = await QueryModfier.query.exec()

        //5) If no product document found, throw err
        if (!DocsProduct) {
            throw new AppError(
                'No product document found to be retrieved.',
                404
            )
        }

        //6) Make url complete for image
        const tranformedDocsProduct = DocsProduct.map((prod) => {
            //=> Transform omage gallery
            const tranformedImageGallery: { url: string }[] = []
            prod?.image_gallery?.map((media) => {
                if (media instanceof Media)
                    tranformedImageGallery.push({
                        url: makeUrlComplete(media.url, req),
                    })
            })

            //=> Transform Image
            const transformedImage: { url: string } = { url: '' }
            if (prod.image instanceof Media)
                transformedImage.url = makeUrlComplete(prod.image.url, req)

            //=> Return
            return {
                ...prod.toJSON(),
                image: transformedImage.url ? transformedImage : undefined,
                image_gallery:
                    tranformedImageGallery.length > 0
                        ? tranformedImageGallery
                        : undefined,
            }
        })

        //7) Send a response
        res.status(200).json({
            status: 'success',
            results: tranformedDocsProduct.length,
            data: tranformedDocsProduct,
        })
    }
)

/**
 ** ==========================================================
 ** getTotalProductsCount - Get the count of total products
 ** ==========================================================
 */
export const getTotalProductsCount = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get count of total number of products
        const ProductsCount = await Product.aggregate([
            {
                $count: 'products_count',
            },
        ])

        //2) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                total_products_count: ProductsCount[0].products_count,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getTopSellingProducts - Get top selling products
 ** ==========================================================
 */
export const getTopSellingProducts = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get top selling products
        const DocsProduct = await Order.aggregate([
            {
                $unwind: {
                    path: '$products',
                },
            },
            {
                $group: {
                    _id: '$products.product',
                    sold: { $sum: '$products.quantity' },
                    sales: { $sum: '$billing.paid_amount' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
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
                $lookup: {
                    from: 'media',
                    localField: 'product.image',
                    foreignField: '_id',
                    as: 'image',
                },
            },
            { $unwind: { path: '$image', preserveNullAndEmptyArrays: true } },
            {
                $sort: {
                    sold: -1,
                },
            },
        ])

        //2) Transform to make url complete
        const transformedDocs = DocsProduct.map(
            (prod: { product: IProduct; image: IMedia }) => {
                if (prod.image) {
                    return {
                        ...prod,
                        image: {
                            ...prod.image,
                            url: makeUrlComplete(prod.image.url, req),
                        },
                    }
                }
                return prod
            }
        )

        //3) Send a response
        res.status(200).json({
            status: 'success',
            results: transformedDocs.length,
            data: transformedDocs,
        })
    }
)
/**
 ** ==========================================================
 ** getFrequentlyBoughtTogether - Get frequently bought together items
 ** ==========================================================
 */
export const getFrquentlyBoughtTogether = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get product id
        const prodId = req.params.prodId

        //2) Get bought together items via aggreggation
        const boughtTogetherItems = await Order.aggregate([
            {
                $match: { 'products.product': new ObjectId(prodId) },
            },
            {
                $unwind: {
                    path: '$products',
                },
            },
            {
                $match: { 'products.product': { $ne: new ObjectId(prodId) } },
            },
            {
                $group: {
                    _id: '$products.product',
                    sold: { $sum: '$products.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $project: {
                    _id: 0,
                },
            },
            {
                $sort: { sold: -1 },
            },
        ])

        //3) Send a response
        res.json({
            status: 'success',
            reuslts: boughtTogetherItems.length,
            data: boughtTogetherItems,
        })
    }
)

/**
 ** ==========================================================
 ** getSimilarViewedItems - Get similar viewed items
 ** ==========================================================
 */
export const getSimilarViewedItems = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get prodId
        const prodId = req.params.prodId

        //2) Find product with its id
        const DocProduct = await Product.findById(prodId)

        //3) Aggregate to find similar viewed items
        const DocProducts = await User.aggregate([
            {
                $match: { 'history.product': new ObjectId(prodId) },
            },
            {
                $unwind: { path: '$history' },
            },
            {
                $match: { 'history.product': { $ne: new ObjectId(prodId) } },
            },
            {
                $group: { _id: '$history.product', count: { $sum: 1 } },
            },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: '_id',
                    as: 'product',
                },
            },
            {
                $match: {
                    'product.categories': { $in: DocProduct?.categories },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
            {
                $project: {
                    _id: 0,
                },
            },
        ])

        //4) Send a response
        res.status(200).json({
            status: 'success',
            results: DocProducts.length,
            data: DocProducts,
        })
    }
)

/**
 ** ==========================================================
 ** getTrendingItemsInYourArea - Get trending items in your area
 ** ==========================================================
 */
export const getTrendingItemsInYourArea = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Throw error if no addresses found
        if (!req.user || req?.user?.addresses?.length <= 0)
            throw new AppError(
                'Must set an address to get trending items based on your location.',
                400
            )

        //2) Get user country from addresses
        const userLoc = req.user.addresses.map((address) => address.country)

        //3) Find trending products based on customers location
        const DocsProduct = await Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'customer',
                    as: 'customer',
                },
            },
            {
                $match: { 'customer.addresses.country': { $in: userLoc } },
            },
            {
                $unwind: { path: '$products' },
            },
            {
                $group: {
                    _id: '$products.product',
                    sales: { $sum: '$products.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: '_id',
                    as: 'product',
                },
            },
            {
                $sort: {
                    sales: -1,
                },
            },
            {
                $project: {
                    _id: 0,
                },
            },
        ])

        //4) Send a response
        res.status(200).json({
            status: 'success',
            results: DocsProduct.length,
            data: DocsProduct,
        })
    }
)

/**
 ** ==========================================================
 ** searchProduct - Get one or more product via searching
 ** ==========================================================
 */
export const searchProduct = catchAsyncHandler(async (req, res) => {
    //1) Get search query from params
    const query = req.params.query

    //2) Search for media
    const DocsProduct = await Product.find({
        $text: { $search: query },
    }).populate({
        path: 'image',
        select: { url: 1, _id: 1, title: 1 },
    })

    //3) Make url complete for image
    const tranformedDocsProduct = DocsProduct.map((prod) => {
        //=> Transform image gallery
        const tranformedImageGallery: { url: string }[] = []
        prod?.image_gallery?.map((media) => {
            if (media instanceof Media)
                tranformedImageGallery.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //=> Transform Image
        const transformedImage: { url: string } = { url: '' }
        if (prod.image instanceof Media)
            transformedImage.url = makeUrlComplete(prod.image.url, req)

        //=> Return
        return {
            ...prod.toJSON(),
            image: transformedImage.url ? transformedImage : undefined,
            image_gallery:
                tranformedImageGallery.length > 0
                    ? tranformedImageGallery
                    : undefined,
        }
    })

    //4) Send a response
    res.status(200).json({
        status: 'success',
        results: tranformedDocsProduct.length,
        data: tranformedDocsProduct,
    })
})

/**
 ** ==========================================================
 ** updateProduct - Update a single product
 ** ==========================================================
 */
export const updateProduct = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of a product to be updated
        const id = req.params.id

        //2) Get product fields from req body
        const productToBeUpdated: IProduct = {
            sku: req.body.sku,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            selling_price: req.body.selling_price,
            image: req.body.image,
            image_gallery:
                req.body.image_gallery && JSON.parse(req.body.image_gallery),
            stock: req.body.stock,
            categories: req.body.categories && JSON.parse(req.body.categories),
            manufacturing_details: {
                brand: req.body.manufacturing_details?.brand,
                model_number: req.body.manufacturing_details?.model_number,
                release_date: req.body.manufacturing_details?.release_date,
            },
            shipping: {
                dimensions: {
                    width: req.body.shipping?.dimensions?.width,
                    height: req.body.shipping?.dimensions?.height,
                    length: req.body.shipping?.dimensions?.length,
                },
                weight: req.body.shipping?.weight,
            },
            variants: req.body.variants && JSON.parse(req.body.variants),
            staff_picked: req.body.staff_picked,
        }

        //3) Update product
        const DocProduct = await Product.findByIdAndUpdate(
            id,
            productToBeUpdated,
            {
                new: true,
            }
        ).populate({
            path: 'image image_gallery',
            select: { _id: 1, url: 1, title: 1 },
        })

        //4) If no document found, throw err
        if (!DocProduct) {
            throw new AppError(
                'No product document to update with the id provided.',
                404
            )
        }

        //5) Make url complete for image
        if (DocProduct?.image instanceof Media) {
            DocProduct.image.url = makeUrlComplete(DocProduct.image.url, req)
        }

        //6) Make url complete for image gallery
        const tranformedImageGallery: { url: string }[] = []
        DocProduct?.image_gallery?.map((media) => {
            if (media instanceof Media)
                tranformedImageGallery.push({
                    url: makeUrlComplete(media.url, req),
                })
        })

        //7) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                ...DocProduct.toJSON(),
                image_gallery: tranformedImageGallery,
            },
        })
    }
)

/**
 ** ==========================================================
 ** deleteProduct - Delete a single product
 ** ==========================================================
 */
export const deleteProduct = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of product to be deleted
        const id = req.params.id

        //2) Delete product
        const DelResults = await Product.deleteOne({ _id: id })

        //3) If no doc found with the id, throw error
        if (!DelResults || DelResults.deletedCount <= 0) {
            throw new AppError(
                'No product document found to be delete with the id provided.',
                404
            )
        }

        //4) Send a response
        res.status(204).json()
    }
)

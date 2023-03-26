import { Request, Response } from 'express'

//Models & Types
import Media from '../models/Media'
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
            selling_price: req.body.price,
            stock: req.body.stock,
            categories: req.body.categories,
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
            variants: {
                color: req.body.variants?.color,
                size: req.body.variants?.size,
                custom: req.body.variants?.custom,
            },
            staff_picked: req.body.staff_picked,
        }

        //2) Set product image if provided
        if (req.media?.some((m) => m.name === 'image')) {
            const media = await Media.create(
                req.media.find((m) => m.name === 'image')?.value
            )
            productToBeCreated.image = media._id
        }

        //3) Set product image gallery if provided
        if (req.media?.some((m) => m.name === 'image_gallery')) {
            const imgGallery = req.media.find(
                (m) => m.name === 'image_gallery'
            )?.value
            if (Array.isArray(imgGallery) && imgGallery.length > 0) {
                await Promise.all(
                    imgGallery.map(async (m) => {
                        return await Media.create(m)
                    })
                ).then((mediaObjects) => {
                    productToBeCreated.image_gallery = mediaObjects.map(
                        (m) => m._id
                    )
                })
            }
        }

        //4) Create product
        const DocProduct = await Product.create(productToBeCreated)

        //5) Populate Fields
        await DocProduct.populate({
            path: 'image image_gallery categories',
            select: {
                _id: 0,
                url: 1,
                name: 1,
                slug: 1,
                parent: 1,
            },
        })

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
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('image_gallery', req)) {
            query.populate({
                path: 'image_gallery',
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('categories', req)) {
            query.populate({
                path: 'categories',
                select: { name: 1, slug: 1, parent: 1, _id: 0 },
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
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('image_gallery', req)) {
            query.populate({
                path: 'image_gallery',
                select: { url: 1, _id: 0 },
            })
        }
        if (isToPopulate('categories', req)) {
            query.populate({
                path: 'categories',
                select: { name: 1, slug: 1, parent: 1, _id: 0 },
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
            selling_price: req.body.price,
            stock: req.body.stock,
            categories: req.body.categories,
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
            variants: {
                color: req.body.variants?.color,
                size: req.body.variants?.size,
                custom: req.body.variants?.custom,
            },
            staff_picked: req.body.staff_picked,
        }

        //3) Set product image if provided
        if (req.media?.some((m) => m.name === 'image')) {
            const media = await Media.create(
                req.media.find((m) => m.name === 'image')?.value
            )
            productToBeUpdated.image = media._id
        }

        //4) Set product image gallery if provided
        if (req.media?.some((m) => m.name === 'image_gallery')) {
            const imgGallery = req.media.find(
                (m) => m.name === 'image_gallery'
            )?.value
            if (Array.isArray(imgGallery) && imgGallery.length > 0) {
                await Promise.all(
                    imgGallery.map(async (m) => {
                        return await Media.create(m)
                    })
                ).then((mediaObjects) => {
                    productToBeUpdated.image_gallery = mediaObjects.map(
                        (m) => m._id
                    )
                })
            }
        }

        //5) Update product
        const DocProduct = await Product.findByIdAndUpdate(
            id,
            productToBeUpdated,
            {
                new: true,
            }
        ).populate({ path: 'image image_gallery', select: { _id: 0, url: 1 } })

        //6) If no document found, throw err
        if (!DocProduct) {
            throw new AppError(
                'No product document to update with the id provided.',
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

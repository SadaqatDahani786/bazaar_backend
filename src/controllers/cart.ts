import { NextFunction, Request, Response } from 'express'

//Error Handler
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Models & Types
import Cart from '../models/Cart'
import Product from '../models/Product'
import { ObjectId } from 'mongodb'
import { Color, Size, CustomVariant } from '../types/variants'

//Utils & Packages
import { isToPopulate } from '../utils/isToPopulate'
import QueryModifier from '../packages/QueryModifier'

/**
 ** ==========================================================
 ** MIDDLEWARES
 ** ==========================================================
 */
//Set param id to currently authenticated user id
export const setParamIdToAuthUserId = catchAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        if (req.user._id) req.query.owner = req.user._id.toString()

        next()
    }
)

/**
 ** ==========================================================
 ** getCart - Get a single cart
 ** ==========================================================
 */
export const getCart = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of category to be retrieved
        const id = req.params.id

        //2) Get query
        const query = Cart.findById(id)

        //3) Populate fields only when it's okay to do so
        if (isToPopulate('products', req)) {
            query.populate({
                path: 'products.product',
                select: 'title',
            })
        }

        //4) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //5) Exec query to retrieve cart doc found
        const DocCart = await QueryModfier.query.exec()

        //6) If no doc found with the id, throw error
        if (!DocCart) {
            throw new AppError(
                'No cart document found to retrieve with the id provided.',
                404
            )
        }

        //7) Send a response
        res.status(200).json({
            status: 'success',
            data: DocCart,
        })
    }
)

/**
 ** ==========================================================
 ** getManyCart - Get one or more cart
 ** ==========================================================
 */
export const getManyCart = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = Cart.find()

        //2) Populate fields only when it's okay to do so
        if (isToPopulate('products', req)) {
            query.populate({
                path: 'products.product',
                select: 'title',
            })
        }

        //3) Apply query modifiers to query
        const QueryModfier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //4) Exec query to retrieve cart doc found
        const DocsCart = await QueryModfier.query.exec()

        //5) If no doc found with the id, throw error
        if (!DocsCart) {
            throw new AppError(
                'No cart document found to retrieve with the id provided.',
                404
            )
        }

        //6) Send a response
        res.status(200).json({
            status: 'success',
            results: DocsCart.length,
            data: DocsCart,
        })
    }
)

/**
 ** ==========================================================
 ** deleteCart - Get a single cart
 ** ==========================================================
 */
export const deleteCart = catchAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        //1) Get id a cart to be delete
        const id = req.params.id

        //2) Delete cart
        const DocCart = await Cart.findOneAndDelete({ _id: id })

        //3) If no doc to delete, throw err
        if (!DocCart) {
            throw new AppError(
                'No cart document found to delete with the id provided.',
                404
            )
        }

        //4) Reclaim the stock
        const updateAllProducts = DocCart.products.map(async (prod) => {
            //=> Get id and quantity
            const prodId = prod.product
            const quantity = prod.quantity

            //=> Reclaim stock
            return Product.findOneAndUpdate(
                { _id4: prodId },
                { $in4c: { stock: +quantity } },
                { ne4w: true, runValidators: true }
            )
        })

        //5) Consume all promises and then send a response
        Promise.all(updateAllProducts)
            .then(() => {
                //=> Send a response
                res.status(204).json()
            })
            .catch((err) => next(err))
    }
)

/**
 ** ==========================================================
 ** addItemInCart - Add an item in the cart
 ** ==========================================================
 */
export const addItemInCart = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Validate
        if (!req.body.product) {
            throw new AppError(
                'Must provide id of the product to add into the cart.',
                400
            )
        }

        //2) Get fields
        const productId = new ObjectId(req.body.product.toString())
        const quantity = Number(req.body.quantity) * 1

        //3 Update product stocks and remove equal the quantity being add in the cart
        const DocProduct = await Product.findOneAndUpdate(
            { _id: req.body.product, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true, runValidators: true }
        )

        //4) If not updated product stock due to not enough stock, throw err
        if (!DocProduct) {
            throw new AppError('No sufficient stock available.', 400)
        }

        //5) Find user cart, if not exist create a new one
        const DocCart = await Cart.findOneAndUpdate(
            { owner: req.user._id },
            { owner: req.user._id },
            { upsert: true, new: true, runValidators: true }
        )

        //6) If failed, rollback changes, and throw err
        if (!DocCart) {
            //=> Rollback changes
            DocProduct.stock += quantity
            await DocProduct.save()

            //=> Throw err
            throw new AppError(
                'Failed to add item in cart, please try again.',
                500
            )
        }

        //7) Try to find index of a product in cart if it exist
        const ind = DocCart.products?.findIndex(
            (curr) => curr.product.toString() === productId.toString()
        )

        //8) If item already exist, increment the quanity, else push new product
        if (ind !== -1) {
            DocCart.products[ind].quantity += quantity
        } else {
            DocCart.products?.push({
                product: productId,
                selected_variants: {
                    color: req.body.color as Color,
                    size: req.body.size as Size,
                    custom: req.body.custom as CustomVariant,
                },
                quantity: quantity,
            })
        }

        //9) Save changes
        await DocCart.save()

        //10) Send a response
        res.status(200).json({
            status: 'success',
            data: DocCart,
        })
    }
)

/**
 ** ==========================================================
 ** removeItemFromCart - Remove an item from the cart
 ** ==========================================================
 */
export const removeItemFromCart = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Validate
        if (!req.body.product || !req.body.quantity) {
            if (!req.body.product)
                throw new AppError(
                    'Must provide id of the product to be remove from the cart.',
                    400
                )
            else
                throw new AppError(
                    'Must provide the quantity of the product to be remove from the cart.',
                    400
                )
        }

        //2) Get fields
        const productId = new ObjectId(req.body.product.toString())
        const quantity = Number(req.body.quantity) * 1

        //3) Find user cart, if not exist create a new one
        const DocCart = await Cart.findOneAndUpdate(
            { owner: req.user._id },
            { owner: req.user._id },
            { upsert: true, new: true, runValidators: true }
        )

        //4) Try to find index of a product in cart if it exist
        const ind = DocCart.products?.findIndex(
            (curr) => curr.product.toString() === productId.toString()
        )

        //5) If product not found in cart, throw err
        if (ind !== -1) {
            //=> If more quantity was provided than what's available in stock, throw err, decrement the quantity
            if (DocCart.products[ind].quantity < quantity) {
                throw new AppError(
                    'Please provide quantity equal or less to the amount of products in cart.',
                    400
                )
            } else if (DocCart.products[ind].quantity === quantity) {
                DocCart.products.splice(ind, 1)
            } else {
                DocCart.products[ind].quantity -= quantity
            }

            //=> Save changes
            await DocCart.save()
        }

        //6 Update product stocks and remove equal the quantity being add in the cart
        const DocProduct = await Product.findOneAndUpdate(
            { _id: req.body.product },
            { $inc: { stock: +quantity } },
            { new: true, runValidators: true }
        )

        //7) If failed to update product stock, rollback changes, and throw error.
        if (!DocProduct) {
            //=> If item was removed completely, insert, else increment the quantity
            if (
                DocCart.products[ind].product.toString() ===
                productId.toString()
            )
                DocCart.products[ind].quantity += quantity
            else
                DocCart.products?.push({
                    product: productId,
                    selected_variants: {
                        color: req.body.color as Color,
                        size: req.body.size as Size,
                        custom: req.body.custom as CustomVariant,
                    },
                    quantity: quantity,
                })

            //=> Save changes
            await DocCart.save()

            //=> Throw err
            throw new AppError(
                'Failed to remove item from the cart. Please try again.',
                500
            )
        }

        //8) Send a response
        res.status(200).json({
            status: 'success',
            data: DocCart,
        })
    }
)

import { NextFunction, Request, Response } from 'express'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Model & Types
import Order, { IOrder } from '../models/Order'
import Product from '../models/Product'
import Media from '../models/Media'

//Utils & Packages
import { isToPopulate } from '../utils/isToPopulate'
import QueryModifier from '../packages/QueryModifier'
import makeUrlComplete from '../utils/makeUrlComplete'

/**
 ** ==========================================================
 ** MIDDLEWARES
 ** ==========================================================
 */
//Sets the customer in query equal to user id from user obj stored in req
export const setUserId = (req: Request, res: Response, next: NextFunction) => {
    if (req.user._id) req.query.customer = req.user._id.toString()

    next()
}

/**
 *
 ** ==========================================================
 ** createOrder - Create a single order
 ** ==========================================================
 */
export const createOrder = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get orderToBeCreated from req body
        const orderToBeCreated: IOrder = {
            customer: req.body.customer,
            products: JSON.parse(req.body.products),
            delivery_status: req.body.delivery_status,
            shipping: {
                address: {
                    ...JSON.parse(req.body.shipping?.address),
                    default_billing_address: false,
                    default_shipping_address: true,
                },
            },
            billing: {
                address: {
                    ...JSON.parse(req.body.billing?.address),
                    default_billing_address: true,
                    default_shipping_address: false,
                },
                payment_method: req.body.billing?.payment_method,
                paid_amount: req.body.billing?.paid_amount,
                transaction_id: req.body.billing?.transaction_id,
            },
            created_at: req.body.created_at,
        }

        //2) Create Order
        const DocOrder = await Order.create(orderToBeCreated)

        //3) If no doc, throw err
        if (!DocOrder) {
            throw new AppError(
                'Failed to create an order for some reason, please try again.',
                500
            )
        }

        //4) Populate fields
        await DocOrder.populate({
            path: 'customer products.product',
            select: { addresses: 0 },
        })

        //5) Send a response
        res.status(201).json({
            status: 'success',
            data: DocOrder,
        })
    }
)

/**
 ** ==========================================================
 ** getOrder - Get a single order
 ** ==========================================================
 */
export const getOrder = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of order to be retrieve
        const id = req.params.id

        //2) Get query
        const query = Order.findById(id)

        //3) Apply query modifiers to query
        const queryModifier = new QueryModifier<typeof query>(
            query,
            req.query
        ).select()

        //4) Populate fieds only when its okay to do so
        if (isToPopulate('customer', req)) {
            query.populate('customer')
        }
        if (isToPopulate('products', req)) {
            query.populate({
                path: 'products.product',
                populate: {
                    path: 'image',
                    model: 'Media',
                },
            })
        }

        //5) Exec query and retrive the matching doc found
        const DocOrder = await queryModifier.query.exec()

        //6) Make url complete for image
        const transformedProducts = DocOrder?.products.map((prod) => {
            if (prod.product instanceof Product) {
                return {
                    quantity: prod.quantity,
                    selected_variants: prod.selected_variants,
                    product: {
                        ...prod.product.toObject(),
                        image: prod.product.image instanceof Media && {
                            ...prod.product.image.toObject(),
                            url: makeUrlComplete(prod.product.image.url, req),
                        },
                    },
                }
            }

            return prod
        })

        //7) If no doc found, throw err
        if (!DocOrder) {
            throw new AppError(
                'No order document found to be retrieved with the id provided.',
                404
            )
        }

        //8) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                ...DocOrder.toJSON(),
                products: transformedProducts,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getManyOrder - Get one or more order
 ** ==========================================================
 */
export const getManyOrder = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get query
        const query = Order.find()

        //2) Apply query modifiers to query
        const queryModifier = new QueryModifier<typeof query>(query, req.query)
            .filter()
            .sort()
            .select()
            .paginate()

        //4) Populate fieds only when its okay to do so
        if (isToPopulate('customer', req)) {
            query.populate('customer')
        }
        if (isToPopulate('products', req)) {
            query.populate('products.product')
        }

        //5) Exec query and retrive the matching doc found
        const DocsOrder = await queryModifier.query.exec()

        //6) Create new query and apply modifier just filter only to count documents
        const DocsCount = await new QueryModifier<typeof query>(
            Order.find(),
            req.query
        )
            .filter()
            .query.count()
            .exec()

        //7) If no doc found, throw err
        if (!DocsOrder) {
            throw new AppError('No order document found to be retrieved.', 404)
        }

        //8) Send a response
        res.status(200).json({
            status: 'success',
            results: DocsOrder.length,
            count: DocsCount,
            data: DocsOrder,
        })
    }
)

/**
 ** ==========================================================
 ** getTotalOrdersCount - Get the count of total orders
 ** ==========================================================
 */
export const getTotalOrdersCount = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get count of total number of orders
        const OrdersCount = await Order.aggregate([
            {
                $count: 'orders_count',
            },
        ])

        //2) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                total_orders_count: OrdersCount[0].orders_count,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getTotalSales - Get the tatal sales
 ** ==========================================================
 */
export const getTotalSales = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Calc total sales via aggregation
        const TotalSales = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    sales: { $sum: '$billing.paid_amount' },
                    orders: { $sum: 1 },
                },
            },
            { $project: { _id: 0, sales: 1, orders: 1 } },
        ])

        //2) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                total_sales: TotalSales[0]?.sales || 0,
                total_orders: TotalSales[0]?.orders || 0,
            },
        })
    }
)

/**
 ** ==========================================================
 ** getTotalRefunds - Get the tatal of refunds
 ** ==========================================================
 */
export const getTotalRefunds = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Calc total refunds via aggregation
        const totalRefunds = await Order.aggregate([
            {
                $match: { delivery_status: { $eq: 'refunded' } },
            },
            {
                $group: { _id: null, amount: { $sum: '$billing.paid_amount' } },
            },
            { $project: { _id: 0, amount: 1 } },
        ])

        //2) Calc total refunds this year
        const totalRefundsInMonthsOfYear = await Order.aggregate([
            {
                $match: {
                    delivery_status: { $eq: 'refunded' },
                },
            },
            {
                $group: {
                    _id: { $month: '$created_at' },
                    amount: { $sum: '$billing.paid_amount' },
                },
            },
            { $project: { _id: 0, month: '$_id', amount: 1 } },
        ])

        //3) Transform refunds this year
        const transformedRefundsThisYear = totalRefundsInMonthsOfYear.map(
            (doc) => ({
                refunds: doc?.amount || 0,
                month: new Date(`2022-${doc.month}-01`).toLocaleString(
                    'default',
                    {
                        month: 'short',
                    }
                ),
            })
        )

        //4) Send a response
        res.status(200).json({
            status: 'success',
            data: {
                total_refunds: totalRefunds[0]?.amount || 0,
                refunds_in_months_of_year: transformedRefundsThisYear,
            },
        })
    }
)

/**
 ** ====================================
 ** GET SALES IN MONTHS OF YEAR
 ** ====================================
 */
export const getSalesInMonthsOfYear = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get Date
        const year = req.params.year
            ? req.params.year
            : new Date(Date.now()).getFullYear()
        const dateYearStart = new Date(`${year}-01-01`)

        //2) Get sales in months of year by aggregation
        const SalesInMonthsOfYear = await Order.aggregate([
            {
                $match: { created_at: { $gte: dateYearStart } },
            },
            {
                $group: {
                    _id: { $month: '$created_at' },
                    orders: { $sum: 1 },
                    sales: { $sum: '$billing.paid_amount' },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    orders: 1,
                    sales: 1,
                },
            },
        ])

        //3) Transform Sales
        const transformedSales = SalesInMonthsOfYear.map((doc) => ({
            orders: doc?.orders || 0,
            sales: doc?.sales || 0,
            month: new Date(`2022-${doc.month}-01`).toLocaleString('default', {
                month: 'short',
            }),
        }))

        //4) Send Response
        res.status(200).json({
            status: 'success',
            data: transformedSales,
        })
    }
)

/**
 ** ==========================================================
 ** updateOrder - Update a single order
 ** ==========================================================
 */
export const updateOrder = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of an order to be updated
        const id = req.params.id

        //2) Get orderToBeUpdated from req body
        const orderToBeUpdated: IOrder = {
            customer: req.body.customer,
            products: JSON.parse(req.body.products),
            delivery_status: req.body.delivery_status,
            shipping: {
                address: {
                    ...JSON.parse(req.body.shipping.address),
                    default_billing_address: false,
                    default_shipping_address: true,
                },
            },
            billing: {
                address: {
                    ...JSON.parse(req.body.billing.address),
                    default_billing_address: true,
                    default_shipping_address: false,
                },
                payment_method: req.body.billing?.payment_method,
                paid_amount: req.body.billing?.paid_amount,
            },
            created_at: req.body.created_at,
        }

        //3) Update order
        const DocOrder = await Order.findByIdAndUpdate(id, orderToBeUpdated)

        //4) Get updated order
        const DocOrderUpdated = await Order.findById(id).populate({
            path: 'customer products.product',
        })

        //5) If no doc found, throw err
        if (!DocOrder || !DocOrderUpdated) {
            throw new AppError(
                'No order found to be updated with the id provided.',
                404
            )
        }

        //6) If delivery status changed, set the current date
        if (DocOrder.delivery_status !== DocOrderUpdated.delivery_status) {
            await DocOrder.updateOne({ status_changed_at: Date.now() })
        }

        //7) Send a response
        res.status(200).json({
            status: 'success',
            data: DocOrderUpdated,
        })
    }
)

/**
 ** ==========================================================
 ** deleteOrder - Delete a single order
 ** ==========================================================
 */
export const deleteOrder = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Get id of order to be deleted
        const id = req.params.id

        //2) Delete order
        const DelResults = await Order.deleteOne({ _id: id })

        //3) If no doc found, throw err,
        if (!DelResults || DelResults.deletedCount <= 0) {
            throw new AppError(
                'No order document found to be deleted with the id provided.',
                404
            )
        }

        //4) Send a response
        res.status(204).json()
    }
)

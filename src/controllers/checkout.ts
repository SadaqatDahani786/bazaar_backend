import { Request, Response } from 'express'
import stripe from 'stripe'

//Error Handling
import AppError from '../error handling/AppError'
import { catchAsyncHandler } from '../error handling/errorHandlers'

//Models & Types
import Cart from '../models/Cart'
import Product from '../models/Product'
import Order, { IOrder } from '../models/Order'
import User, { IUser } from '../models/User'
import Media from '../models/Media'

/**
 ** ==============================================================
 ** placeMyOrder - A reuable func to create and place order
 ** ==============================================================
 */
const placeMyOrder = async (
    user: IUser,
    status: 'CASH_ON_DELIVERY' | 'STRIPE_CHECKOUT'
) => {
    //1) If not user provided, throw err
    if (!user._id) {
        throw new AppError(
            'You must be logged in to access this route. Please login first.',
            401
        )
    }

    //2) Find User cart
    const cart = await Cart.findOne({ owner: user._id }).populate({
        path: 'products.product',
    })

    //3) If cart is empty, throw an error
    if (!cart || !cart.products || cart.products.length <= 0) {
        throw new AppError(
            'Your cart is empty. Add some products in cart before placing an order.',
            400
        )
    }

    //4) Get default billing address
    const billing_address = user.addresses.find(
        (address) => address.default_billing_address === true
    )

    //5) Get default shipping address
    const shipping_address = user.addresses.find(
        (address) => address.default_shipping_address === true
    )

    //6) If any of default addresses are not set, throw err
    if (!billing_address || !shipping_address) {
        throw new AppError(
            'Please set a default shipping and billing address first before proceeding with checkout.',
            400
        )
    }

    //7) Calc total amount
    const totalAmount = cart.products.reduce<number>((prev, currProd) => {
        //=> Narrow type to product
        if (!(currProd.product instanceof Product)) {
            return prev
        }

        //=> Calc total
        const total =
            (currProd.product.selling_price
                ? currProd.product.selling_price
                : currProd.product.price) * currProd.quantity

        //=> Accumulate total
        return (prev += total)
    }, 0)

    //8) Create order object
    const orderObject: IOrder = {
        billing: {
            address: billing_address,
            payment_method:
                status === 'CASH_ON_DELIVERY' ? 'cash_on_delivery' : 'card',
            paid_amount: totalAmount,
        },
        shipping: {
            address: shipping_address,
        },
        customer: user._id,
        delivery_status:
            status === 'CASH_ON_DELIVERY' ? 'pending_payment' : 'processing',
        products: cart.products,
        status_changed_at: new Date(Date.now()),
        created_at: new Date(Date.now()),
    }

    //9) Create order
    const DocOrder = await Order.create(orderObject)

    //10) If order creation failed, throw err
    if (!DocOrder) {
        throw new AppError(
            'Failed to place an order for some reason, please try again.',
            500
        )
    }

    //11) Empty cart
    cart.products = []
    await cart.save()

    //12 return newly created order document
    return DocOrder
}

/**
 ** ==============================================================
 ** createCheckoutSession - Create stripe checkout session
 ** ==============================================================
 */
export const createCheckoutSession = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Throw error if stripe secret key is not setup
        if (!process.env.STRIPE_SECRET_KEY) {
            console.log(
                'Please setup stripe secret key in a .env config file, "STRIPE_SECRET_KEY" is missing.'
            )
            throw new Error()
        }

        //2) User must be authenticated to create a checkout session
        if (!req.user || !req.user._id) {
            throw new AppError(
                'You need to login first to create a checkout session.',
                401
            )
        }

        //3) Don't allow checkout if default addresses is not set
        if (
            !req.user.addresses.some(
                (address) => address.default_billing_address === true
            ) ||
            !req.user.addresses.some(
                (address) => address.default_shipping_address === true
            )
        ) {
            throw new AppError(
                'Please set a default shipping and billing address first before proceeding with checkout.',
                400
            )
        }

        //4) Init stripe
        const stripeAPI = new stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2022-11-15',
        })

        //5) Find User cart
        const cart = await Cart.findOne({ owner: req.user._id }).populate({
            path: 'products.product',
            model: 'Product',
            populate: [
                {
                    path: 'image',
                    model: 'Media',
                },
            ],
        })

        //6) If cart is empty, throw an error
        if (!cart || !cart.products || cart.products.length <= 0) {
            throw new AppError(
                'Your cart is empty. Add some products in cart before placing an order.',
                400
            )
        }

        //7) Success and Cancel URLS
        const success_url = req.headers.origin + '/order_success'
        const cancel_url = req.headers.origin + '/cart'

        //8) Create stripe checkiut session
        const checkout_session = await stripeAPI.checkout.sessions.create({
            payment_method_types: ['card'],
            success_url,
            cancel_url,
            customer_email: req.user.email,
            client_reference_id: req.user._id.toString(),
            mode: 'payment',
            line_items: cart.products.map((prod) => ({
                quantity: prod.quantity,
                price_data: {
                    currency: 'eur',
                    unit_amount_decimal:
                        prod.product instanceof Product
                            ? (
                                  (prod.product.selling_price ||
                                      prod.product.price) * 100
                              ).toString()
                            : '0.0',
                    product_data: {
                        name:
                            prod.product instanceof Product
                                ? prod.product.title
                                : '',
                        description:
                            prod.product instanceof Product
                                ? prod.product.description.length > 100
                                    ? prod.product.description.slice(0, 100) +
                                      '...'
                                    : prod.product.description
                                : '',
                        images: [
                            prod.product instanceof Product &&
                            prod.product?.image instanceof Media
                                ? `https://bazaar.loca.lt/${prod.product.image.url}`
                                : 'https://joadre.com/wp-content/uploads/2019/02/no-image.jpg',
                        ],
                    },
                },
            })),
        })

        //9) If no checkout session, throw err
        if (!checkout_session || !checkout_session.url) {
            throw new AppError(
                'Failed to create a checkout sesison, please try again.',
                500
            )
        }

        //10) If in NodeEnv in dev mode, send a response, else redirect to url
        if (process.env.NODE_ENVIRONMENT === 'development') {
            res.status(200).json({
                status: 'success',
                session: checkout_session,
                data: checkout_session.url,
            })
        } else {
            res.status(200).json({
                status: 'success',
                data: checkout_session.url,
            })
        }
    }
)

/**
 ** ==============================================================
 ** checkoutSuccessWithoutPay - Place order for cash on delivery
 ** ==============================================================
 */
export const checkoutSuccessWithoutPay = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Place order
        const DocOrder = await placeMyOrder(req.user, 'CASH_ON_DELIVERY')

        //2) Send a response
        res.json({ status: 'success', data: DocOrder })
    }
)

/**
 ** ==============================================================
 ** checkoutSuccessStripeWebhook - Capture stripe session complete
 ** ==============================================================
 */
export const checkoutSuccessStripeWebhook = catchAsyncHandler(
    async (req: Request, res: Response) => {
        //1) Throw error if stripe secret key or webhook secret is not setup
        if (
            !process.env.STRIPE_SECRET_KEY ||
            !process.env.STRIPE_WEBHOOK_SECRET
        ) {
            console.log(
                'Please setup "STRIPE_SECRET_KEY" and "STRIPE_WEBHOOK_SECRET" in your .env config file.'
            )
            throw new Error()
        }

        //2) Init stripe
        const stripeAPI = new stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2022-11-15',
        })

        //3) Get stripe signature from headers
        const signature = req.headers['stripe-signature']

        //4) If signature not found, throw err
        if (!signature) {
            console.log('Signatue is missing from req headers.')
            throw new AppError('Signatue is missing from req headers.', 400)
        }

        //5) Create event
        const event = stripeAPI.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )

        //6 If checkout was completed, place an order
        if (event.type === 'checkout.session.completed') {
            //=> Webhook Event
            const eventObj = event.data.object as {
                client_reference_id: string
            }

            event.data.object as stripe.Card

            //=> Find user with id stored in event
            const DocUser = await User.findById(eventObj.client_reference_id)

            //=> Throw err, if no user found
            if (!DocUser) {
                throw new AppError(
                    'User does not exist, chekout session failed.',
                    400
                )
            }

            //=> Place my order
            placeMyOrder(DocUser, 'STRIPE_CHECKOUT')
        }

        //7 Send a respose
        res.status(200).json({
            status: 'success',
            received: 'true',
        })
    }
)

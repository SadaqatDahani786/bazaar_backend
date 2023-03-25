import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import dotenv from 'dotenv'
import cors from 'cors'

import Server from './Server'
import { errorHandler, errorHandler404 } from './error handling/errorHandlers'

//Routers
import RouterMedia from './routes/media'
import RouterCategory from './routes/cateogry'
import RouterUser from './routes/user'
import RouterAuth from './routes/auth'
import RouterProduct from './routes/product'
import RouterReview from './routes/review'
import RouterDeal from './routes/deal'
import RouterCart from './routes/cart'
import RouterOrder from './routes/order'
import RouterCheckout from './routes/checkout'

//Controllers
import { checkoutSuccessStripeWebhook } from './controllers/checkout'

/**
 ** ====================================
 ** INIT
 ** ====================================
 */
//Config
global.app_dir = path.resolve(__dirname)
dotenv.config({ path: '.env' })

//Vars
const API_ENDPOINT = '/api/v1'

//Init
const app = express()
const HttpServer = new Server(app)

/**
 ** ====================================
 ** WEBHOOKS
 ** ====================================
 */
app.route(`${API_ENDPOINT}/checkout/success-stripe-webhook`).post(
    express.raw({ limit: '10kb', type: 'application/json' }),
    checkoutSuccessStripeWebhook
)

/**
 ** ====================================
 ** MIDDLEWARES
 ** ====================================
 */
app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json({ limit: '10kb' }))
app.use(express.static('src/public'))

/**
 ** ====================================
 ** ROUTES
 ** ====================================
 */
app.use(`${API_ENDPOINT}/media`, RouterMedia)
app.use(`${API_ENDPOINT}/category`, RouterCategory)
app.use(`${API_ENDPOINT}/user`, RouterUser)
app.use(`${API_ENDPOINT}/auth`, RouterAuth)
app.use(`${API_ENDPOINT}/product`, RouterProduct)
app.use(`${API_ENDPOINT}/review`, RouterReview)
app.use(`${API_ENDPOINT}/deal`, RouterDeal)
app.use(`${API_ENDPOINT}/cart`, RouterCart)
app.use(`${API_ENDPOINT}/order`, RouterOrder)
app.use(`${API_ENDPOINT}/checkout`, RouterCheckout)

/**
 ** ====================================
 ** ERROR HANDLING
 ** ====================================
 */
app.all('*', errorHandler404)
app.use(errorHandler)

/**
 ** ====================================
 ** RUN HTTP SERVER
 ** ====================================
 */
HttpServer.run()

/**
 ** ====================================
 ** EXPORTS
 ** ====================================
 */
export default app

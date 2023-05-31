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
import RouterLocation from './routes/location'
import RouterMail from './routes/mail'

//Controllers
import { checkoutSuccessStripeWebhook } from './controllers/checkout'

//Security
import helm from 'helmet'
import rateLimit from 'express-rate-limit'
import sanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import hppPrevent from 'hpp-prevent'

/**
 ** ====================================
 ** INIT
 ** ====================================
 */
//Config
global.app_dir = path.resolve(__dirname)
dotenv.config({ path: '.env' })
hppPrevent.config({ whitelist: ['created_at'] })

//Vars
const API_ENDPOINT = '/api/v1'

//Init
const app = express()
const HttpServer = new Server(app)
const limitRequests = rateLimit({
    max: 10000,
    windowMs: 60 * 60 * 1000,
    message:
        'Too many requests from the same IP address. Please try again in an hour.',
})

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

// app.use(helm())
app.use('/api', limitRequests)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '10kb' }))
app.use(express.json({ limit: '10kb' }))

app.use(xss())
// app.use(sanitize()) disabled because due to not allowing "." through req
// app.use(hppPrevent.hppPrevent()) disabled because due to not allowing arrays of objects through req

app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'https://checkout.stripe.com',
            'https://bazaar.loca.lt',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    })
)

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
app.use(`${API_ENDPOINT}/location`, RouterLocation)
app.use(`${API_ENDPOINT}/mail`, RouterMail)

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

import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'

import dotenv from 'dotenv'
import cors from 'cors'

import Server from './Server'
import { errorHandler, errorHandler404 } from './error handling/errorHandlers'

//Routers
import RouterMedia from './routes/media'
import RouterCategory from './routes/cateogry'
import RouterUser from './routes/user'
import RouterAuth from './routes/auth'
import cookieParser from 'cookie-parser'

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

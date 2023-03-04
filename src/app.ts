/**
 ** ====================================
 ** IMPORTS
 ** ====================================
 */
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'

import Server from './Server'
import { errorHandler, errorHandler404 } from './error handling/errorHandlers'

/**
 ** ====================================
 ** INIT
 ** ====================================
 */
dotenv.config({ path: '.env' })
const app = express()
const HttpServer = new Server(app)

/**
 ** ====================================
 ** MIDDLEWARES
 ** ====================================
 */
app.use(cors())
app.use(bodyParser.json({ limit: '10kb' }))

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

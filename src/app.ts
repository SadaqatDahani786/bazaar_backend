/**
 ** ====================================
 ** IMPORTS
 ** ====================================
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import Server from './Server'

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

import { Server as HttpServer } from 'http'
import { Express } from 'express'
import { connect } from 'mongoose'
import {
    unhandledPromiseRejectionHandler,
    uncaughtExceptionHandler,
} from './error handling/errorHandlers'
import { populateLocations } from './controllers/location'

/**
 ** ====================================
 ** TYPE [NodeEnv]
 ** ====================================
 */
export type NodeEnv = 'development' | 'production'

/**
 ** ====================================
 ** Interface [IServer]
 ** ====================================
 */
export interface IServer {
    readonly app: Express
    readonly port: number
    readonly nodeEnv: NodeEnv
    readonly server: HttpServer | null
}

/**
 ** ====================================
 ** Class [Server]
 ** ====================================
 */
export default class Server implements IServer {
    /**
     ** **
     ** ** ** VARS
     ** **
     */
    readonly app: Express //express application
    readonly port: number //port where application will run
    readonly nodeEnv: NodeEnv //node environment
    server: HttpServer | null //http server

    /**
     ** **
     ** ** ** INIT
     ** **
     */
    constructor(app: Express, port?: number) {
        this.app = app
        this.port = port ? port : ((process.env.PORT_NO || 3000) as number)
        this.nodeEnv = process.env.NODE_ENVIRONMENT as NodeEnv
        this.server = null

        //Register Error Handler
        this.registerErrorHandlers()

        // NODE ENV
        console.log(`Node Environment Is In Mode:\t\t[${this.nodeEnv}]`)
    }

    /**
     ** **
     ** ** ** CONNECT TO MONGODB
     ** **
     */
    private async connectMongodb() {
        //connect to mongodb
        try {
            await connect(
                this.nodeEnv === 'development'
                    ? (process.env.MONGODB_CONNECTION_LOCAL as NodeEnv)
                    : (process.env.MONGODB_CONNECTION_ATLAS as NodeEnv)
            )
            console.log('MongoDB Connection Was:\t\t\t[Successfull]')

            //populate locations
            populateLocations()
        } catch (error) {
            console.log(
                `MongoDB Connection Was:\t\t\t[UnSuccessfull]\n${error}`
            )
        }
    }

    /**
     ** **
     ** ** ** HANDLE NODE PROCESS ERROR EVENTS
     ** **
     */
    private registerErrorHandlers() {
        //Promise Rejection
        process.on('unhandledRejection', (err: Error) => {
            unhandledPromiseRejectionHandler(err, this)
        })

        //UncaughtException
        process.on('uncaughtException', (err) =>
            uncaughtExceptionHandler(err, this)
        )
    }

    /**
     ** **
     ** ** ** RUN SERVER
     ** **
     */
    run() {
        //Connect to mongodb server
        this.connectMongodb()

        //Start spinning http server
        this.server = this.app.listen(this.port, () => {
            console.log(`App Started Running On Port:\t\t[${this.port}]`)
        })
    }

    /**
     ** **
     ** ** ** CLOSE SERVER
     ** **
     */
    close() {
        this.server?.close(() => {
            process.exit(1)
        })
    }
}

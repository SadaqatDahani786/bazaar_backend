import { Express } from 'express'
import { connect } from 'mongoose'

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

    /**
     ** **
     ** ** ** INIT
     ** **
     */
    constructor(app: Express, port?: number) {
        this.app = app
        this.port = port ? port : ((process.env.PORT_NO || 3000) as number)
        this.nodeEnv = process.env.NODE_ENVIRONMENT as NodeEnv

        // NODE ENV
        console.log(`Node Environment Is In Mode:\t\t[${this.nodeEnv}]`)
    }

    /**
     ** **
     ** ** ** CONNECT TO MONGODB
     ** **
     */
    async connectMongodb() {
        //connect to mongodb
        try {
            await connect(
                this.nodeEnv === 'development'
                    ? (process.env.MONGODB_CONNECTION_LOCAL as NodeEnv)
                    : (process.env.MONGODB_CONNECTION_ATLAS as NodeEnv)
            )
            console.log('MongoDB Connection Was:\t\t\t[Successfull]')
        } catch (error) {
            console.log(
                `MongoDB Connection Was:\t\t\t[UnSuccessfull]\n${error}`
            )
        }
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
        this.app.listen(this.port, () => {
            console.log(`App Started Running On Port:\t\t[${this.port}]`)
        })
    }
}

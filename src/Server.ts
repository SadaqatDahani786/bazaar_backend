import { Express } from 'express'

/**
 ** ====================================
 ** Interface [IServer]
 ** ====================================
 */
export interface IServer {
    readonly app: Express
    readonly port: number
}

/**
 ** ====================================
 ** Class [Server]
 ** ====================================
 */
export default class Server implements IServer {
    readonly app: Express //express application
    readonly port: number //port where application will run

    //Init
    constructor(app: Express, port?: number) {
        this.app = app
        this.port = port ? port : ((process.env.PORT_NO || 3000) as number)
    }

    //Run server
    run() {
        //Start spinning http server
        this.app.listen(this.port, () => {
            console.log(`App Started Running On Port:\t\t[${this.port}]`)
        })
    }
}

import { Request } from 'express'

/**
 ** ==========================================================
 ** Utitlity func which makes url complete
 ** ==========================================================
 */
export default (url: string, req: Request) => {
    return `${req.protocol}://${req.hostname}:${
        process.env.PORT_NO || 3000
    }/${url}`
}

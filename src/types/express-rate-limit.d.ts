/**
 ** ==========================================================
 ** Module [express-rate-limit]
 ** ==========================================================
 */
declare module 'express-rate-limit' {
    const value: (options: {
        max: number
        windowMs: number
        message: string
    }) => (req, res, next) => void

    export default value
}

/**
 ** ==========================================================
 ** Module [xss-clean]
 ** ==========================================================
 */
declare module 'xss-clean' {
    const value: (path?: PathParams) => (req, res, next) => void

    export default value
}

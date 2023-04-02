/**
 ** ==========================================================
 ** Module [helmet]
 ** ==========================================================
 */
declare module 'helmet' {
    const value: () => (req, res, next) => void

    export default value
}

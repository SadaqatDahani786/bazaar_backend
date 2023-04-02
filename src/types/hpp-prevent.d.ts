/**
 ** ==========================================================
 ** Module [hpp-prevent]
 ** ==========================================================
 */
declare module 'hpp-prevent' {
    const hppPrevent: () => (req, res, next) => void
    const config: (options: {
        blacklist?: Array<string>
        whitelist?: Array<string>
        takeLastOcurrences?: boolean
        returnBadRequestReponse?: boolean
        customInvalidParamMessage?: string
        canIgnoreBodyParse?: boolean
        deepSearch?: boolean
    }) => void

    export default { hppPrevent, config }
}

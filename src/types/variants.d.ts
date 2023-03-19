/**
 ** ====================================
 ** Type [Color]
 ** ====================================
 */
export type Color =
    | 'Aqua'
    | 'Crimson'
    | 'Black'
    | 'Blue'
    | 'Brown'
    | 'Gold'
    | 'Gray'
    | 'Green'
    | 'Orange'
    | 'Pink'
    | 'Purple'
    | 'Red'
    | 'Teal'
    | 'Violet'
    | 'White'
    | 'Yellow'

/**
 ** ====================================
 ** Type = [Size]
 ** ====================================
 */
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL'

/**
 ** ====================================
 ** Type = [CustomVariant]
 ** ====================================
 */
export type CustomVariant = Array<{
    name: string
    term: string
}>

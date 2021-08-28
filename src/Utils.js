export const hasDefinedKey = (object,key) => {
    return key in object && object[key] !== undefined
}

export const hasUndefinedKey = (object,key) => {
    return key in object && object[key] === undefined
}
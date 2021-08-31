export const hasDefinedKey = (object,key) => {
    return key in object && object[key] !== undefined
}

export const hasUndefinedKey = (object,key) => {
    return key in object && object[key] === undefined
}

export function numToSSColumn(num){
    let s = '', t;
  
    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      num = (num - t)/26 | 0;
    }
    return s || undefined;
}

export function getPreviousIndex(index,state){
    var previousStepIndex = index - 1
    if (previousStepIndex === -1){previousStepIndex = state.steps.length - 1}
    return previousStepIndex
}

export function getNextIndex(index, state) {
    var nextStepIndex = index + 1
    if (nextStepIndex === state.steps.length) { nextStepIndex = 0} 
    return nextStepIndex
}
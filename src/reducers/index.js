import Thermodynamics from "../Thermodynamics"
import { hasDefinedKey, hasUndefinedKey } from "../Utils"

const initialState = {
    system:{
        moles: 1,
        isochoricHeatCapacity: 5/2 * Thermodynamics.R
    },
    steps: []
}

initialState.steps.push({
        pressure: 10000,
        volume: 1,
        temperature: 10000/Thermodynamics.R,
        staticEntropy: 0,
        type: 'none'
})

const _applySubsequentPointConstraintsAtIndex = (
        state, index, applyConstraintsFunc, getSubsequentIndex
    ) => {
    var step = state.steps[index]
    step = Thermodynamics.solvePVT(step, state.system)
    var subStepIndex = getSubsequentIndex(index, state)
    var subsubStepIndex = getSubsequentIndex(subStepIndex,state)
    var subStep = state.steps[subStepIndex]
    var subsubStep = state.steps[subsubStepIndex]
    var subStepConstrained = applyConstraintsFunc(step, subStep,subsubStep,state.system)
    if (subStepConstrained === subStep) {
        return [{
            ...state, steps: _steps_replaceAtIndex(state.steps, index, step)
        }, true]
    }
    subStep = Thermodynamics.solvePVT(subStepConstrained, state.system)
    return [{
        ...state, steps: _steps_replaceAtIndex(
            _steps_replaceAtIndex(state.steps, subStepIndex, subStep),
            index, step)
    }, false]
}

const _applyNextPointConstraintsAtIndex = (state, index) => {
    return _applySubsequentPointConstraintsAtIndex(
        state,index,_applyStepTypeConstraintsToNextPoint,_getNextIndex
    )
}

const _applyPreviousPointConstraintsAtIndex = (state, index) => {
    return _applySubsequentPointConstraintsAtIndex(
        state,index,_applyStepTypeConstraintsToPreviousPoint,_getPreviousIndex
    )
}
const steps_update = (state,action) => {
    checkStepTypeIsValid(action.newStep)
    
    state = {...state, steps: _steps_replaceAtIndex(
        state.steps, action.index, action.newStep
    )}

    var startIndex = action.index
    state = _operateOnNextUntilCondition(
        state,startIndex,
        _applyNextPointConstraintsAtIndex,
        _generateRTSorSignalCondition(startIndex)
    )

    state = _operateOnPreviousUntilCondition(
        state,startIndex,
        _applyPreviousPointConstraintsAtIndex,
        _generateRTSorSignalCondition(startIndex)
    )

    return _forEachStep(state,(state,index)=>{
        return _recalculateEntropyAtIndex(state, index)
    })
}

const _steps_replaceAtIndex = (steps,index,newStep) => {
    return([
        ...steps.slice(0,index),
        newStep,
        ...steps.slice(index+1)
    ])
}

const steps_add = (steps,system,index,newStep) => {
    newStep = Thermodynamics.solvePVT(newStep,system)
    if (index === steps.length || index === -1){
        return([
            ...steps,
            newStep
        ])
    }
    return([
        ...steps.slice(0,index),
        newStep,
        ...steps.slice(index)
    ])
}

const steps_delete = (steps,index) => {
    return([
        ...steps.slice(0,index),
        ...steps.slice(index+1)
    ])
}

const thermodynamicSystemReducer = (state=initialState,action) =>{
    if (action.type === 'steps/update'){return steps_update(state,action)}
    if (action.type === 'steps/updateProperties'){
        action = _markUndefinedOneUnspecifiedPvtParameter(action)
        return steps_update(
            state,
            {
                index: action.index, 
                newStep:{
                    ...state.steps[action.index],...action.newProperties
                }
            }
        )
    }
    if (action.type === 'steps/add'){return {...state,
        steps: steps_add(state.steps,state.system,action.index,action.newStep)
    }}
    if (action.type === 'steps/delete'){return {...state,
        steps: steps_delete(state.steps,action.index)
    }}
    if (action.type === 'system/setMoles'){
        var newState = {...state, system: {...state.system, moles: action.moles}}
        newState = _forEachStep(newState,_recalculateTemperatureAtIndex)
        newState = _forEachStep(newState,
            (state,index)=>{
                return steps_update(
                    state, {index: index, newStep: state.steps[index]}
                )
            }
        )
        return newState
    }
    return state
}

export default thermodynamicSystemReducer

function checkStepTypeIsValid(newStep) {
    if (hasDefinedKey(newStep, 'type')) {
        if (!['none', 'isobaric', 'isochoric', 'isothermal', 'isentropic'].includes(newStep.type)) {
            throw new Error(
                `Step type must be one of 'none','isobaric','isochoric','isothermal' or 'isentropic'
                not ${newStep.type}`
            )
        }
    }
}

function _generateRTSorSignalCondition(startIndex) {
    return (state, index, breakCondition) => {
        const returnedToStartIndex = index === startIndex && breakCondition !== undefined
        if (returnedToStartIndex) {return false} 
        if (breakCondition) { return false} 
        return true
    }
}

function _recalculateEntropyAtIndex(state, index) {
    var step = state.steps[index]
    var nextStep = _getNextStep(state, index)
    const isUnfixedEntropyStepType = (
        step.type !== 'none' &&
        state.steps.length !== 1
    )
    if (isUnfixedEntropyStepType) {
        if (step.type === 'isentropic'){
            step.entropyChange = 0
        }else{
            step.entropyChange = _getEntropyChange(step, nextStep, state)
        }
        var stepEntropy = _getStepEntropy(step)
        nextStep.entropy = stepEntropy + step.entropyChange
    }
    return state
}

function _getStepEntropy(step) {
    return hasDefinedKey(step, 'staticEntropy') ?
        step.staticEntropy : step.entropy
}

function _applyStepTypeConstraintsToSubsequentPoint(
        step,subStep,subsubStep,refStep,secondRefStep,system
    ){
    if (refStep.type === 'isobaric' && step.pressure !== subStep.pressure) {
        subStep = {...subStep,  pressure: step.pressure}
        if (['none','isobaric','isochoric'].includes(secondRefStep.type)){
            subStep.temperature = undefined
        }
        if (secondRefStep.type === 'isothermal'){subStep.volume = undefined}
        subStep = _applyConstraintsFromIsentropicAsNeighbour(secondRefStep,subsubStep, subStep, system,
            {pressure_2: subStep.pressure}    
        )
    }
    if (refStep.type === 'isochoric' && step.volume !== subStep.volume){
        subStep = {...subStep, volume: step.volume}
        if (['none','isobaric','isochoric'].includes(secondRefStep.type)){
            subStep.temperature = undefined
        }
        if (secondRefStep.type === 'isothermal'){subStep.pressure = undefined}
        subStep = _applyConstraintsFromIsentropicAsNeighbour(secondRefStep,subsubStep, subStep, system,
            {volume_2: subStep.volume}    
        )
    }
    if (refStep.type === 'isothermal' && step.temperature !== subStep.temperature){
        subStep = {...subStep, temperature: step.temperature}
        if (['none','isobaric','isothermal'].includes(secondRefStep.type)){
            subStep.volume = undefined
        }
        if (secondRefStep.type === 'isochoric'){subStep.pressure = undefined}
        subStep = _applyConstraintsFromIsentropicAsNeighbour(secondRefStep,subsubStep, subStep, system,
            {temperature_2: subStep.temperature}    
        )
    }
    if (refStep.type === 'isentropic'){
        var entropyChangeBefore = Thermodynamics.solveEntropyChange({
            volume_1: step.volume,
            volume_2: subStep.volume,
            pressure_1: step.pressure,
            pressure_2: subStep.pressure,
        },system).entropyChange
        if (
            Math.abs(entropyChangeBefore) > 0.000005
        ){
            const stepEntropyConstraints = {
                entropyChange: 0,
                volume_1: step.volume,
                pressure_1:step.pressure,
            }
            if (['none','isentropic','isothermal'].includes(secondRefStep.type)){
                stepEntropyConstraints.temperature_2 = subStep.temperature
            }
            if (secondRefStep.type === 'isobaric'){
                stepEntropyConstraints.pressure_2 = subStep.pressure
            }
            if (secondRefStep.type === 'isochoric'){
                stepEntropyConstraints.volume_2 = subStep.volume
            }

            const stepSolution = Thermodynamics.solveEntropyChange(stepEntropyConstraints,system)
            subStep = {...subStep,
                pressure: stepSolution.pressure_2, 
                volume: stepSolution.volume_2,
                temperature: stepSolution.temperature_2,
            }
        }
    }
    return subStep
}

function _applyConstraintsFromIsentropicAsNeighbour(secondRefStep,subsubStep, subStep, system, constraint) {
    if (secondRefStep.type === 'isentropic'){
        var entropyStepConstraints = {
            ...constraint,
            volume_1: subsubStep.volume,
            pressure_1: subsubStep.pressure,
            entropyChange: 0
        }
        var entropyStepRes = Thermodynamics.solveEntropyChange(entropyStepConstraints, system)
        subStep = {...subStep,pressure: undefined}
        subStep.pressure = entropyStepRes.pressure_2
        subStep.temperature = entropyStepRes.temperature_2
        subStep.volume = entropyStepRes.volume_2
    }
    return subStep
}

function _applyStepTypeConstraintsToNextPoint(step, nextStep,nextNextStep,system) {
    return _applyStepTypeConstraintsToSubsequentPoint(step,nextStep,nextNextStep,step,nextStep,system)
}

function _applyStepTypeConstraintsToPreviousPoint(step, previousStep,previousPreviousStep,system) {
    return _applyStepTypeConstraintsToSubsequentPoint(
        step,previousStep,previousPreviousStep,previousStep,previousPreviousStep,system
    )
}

function _markUndefinedOneUnspecifiedPvtParameter(action) {
    if (
        hasUndefinedKey(action.newProperties,'temperature') ||
        hasUndefinedKey(action.newProperties,'pressure') ||
        hasUndefinedKey(action.newProperties,'volume')
    ){
        return action
    }
    const [hasT, hasV, hasP] = Thermodynamics.flagsForKeysInPoint(action.newProperties)
    const numberOfConstraints = hasT + hasV + hasP
    if (numberOfConstraints === 2) {
        ['volume', 'temperature', 'pressure'].forEach((key) => {
            if (!hasDefinedKey(action.newProperties,key)) {
                action.newProperties[key] = undefined
            }
        })
    }
    if (numberOfConstraints === 1) {
        if (!hasT) {
            action.newProperties.temperature = undefined
        } else {
            action.newProperties.volume = undefined
        }
    }
    return action
}

function _forEachStep(state,lambda){
    //lambda should accept state and index as parameters and return modified version of state
    for (var index=0; index<state.steps.length; index++){
        state = lambda(state,index)
    }
    return state
}

function _recalculateTemperatureAtIndex(state, index) {
    return {
        ...state, steps: _steps_replaceAtIndex(
            state.steps,
            index,
            Thermodynamics.solvePVT(
                { ...state.steps[index], temperature: undefined }, state.system)
        )
    }
}

function _getEntropyChange(step, nextStep, state) {
    return Thermodynamics.solveEntropyChange({
        pressure_1: step.pressure,
        volume_1: step.volume,
        pressure_2: nextStep.pressure,
        volume_2: nextStep.volume
    }, state.system).entropyChange
}

function _getNextIndex(index, state) {
    var nextStepIndex = index + 1
    if (nextStepIndex === state.steps.length) { nextStepIndex = 0} 
    return nextStepIndex
}

function _getNextStep(state, index) {
    return state.steps[_getNextIndex(index, state)]
}

function _getPreviousIndex(index,state){
    var previousStepIndex = index - 1
    if (previousStepIndex === -1){previousStepIndex = state.steps.length - 1}
    return previousStepIndex
}

function _operateOnSubsequentUntilCondition(state,startIndex,lambda,condition,subsequentIndexFinder){
    // lambda is a function of the form [state, breakCondition] = lambda(state,index)
    // condition is a funcion of the form (continue) = condition(state,index,breakCondition)
    var index = startIndex
    var breakCondition
    while (condition(state,index,breakCondition)){
        [state, breakCondition] = lambda(state,index)
        index = subsequentIndexFinder(index,state)
    }
    return state
}

function _operateOnNextUntilCondition (state,startIndex, lambda, condition){
    return _operateOnSubsequentUntilCondition(state,startIndex,lambda,condition,_getNextIndex)
}

function _operateOnPreviousUntilCondition (state,startIndex, lambda, condition){
    return _operateOnSubsequentUntilCondition(state,startIndex,lambda,condition,_getPreviousIndex)
}
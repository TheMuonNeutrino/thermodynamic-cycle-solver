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

const _applyNextPointConstraintsAtIndex = (state, index) => {
    var step = state.steps[index]
    step = Thermodynamics.solvePVT(step, state.system)
    var nextStepIndex = _getNextIndex(index, state)
    var nextStep = state.steps[nextStepIndex]
    var nextStepConstrained = _applyStepTypeConstraintsToNextPoint(step, nextStep)
    if (nextStepConstrained === nextStep) {
        return [{
            ...state, steps: _steps_replaceAtIndex(state.steps, index, step)
        }, true]
    }
    nextStep = Thermodynamics.solvePVT(nextStepConstrained, state.system)
    return [{
        ...state, steps: _steps_replaceAtIndex(
            _steps_replaceAtIndex(state.steps, nextStepIndex, nextStep),
            index, step)
    }, false]
}

const _applyPreviousPointConstraintsAtIndex = (state, index) => {
    var step = state.steps[index]
    step = Thermodynamics.solvePVT(step, state.system)
    var previousStepIndex = _getPreviousIndex(index, state)
    var previousStep = state.steps[previousStepIndex]
    var previousStepConstrained = _applyStepTypeConstraintsToPreviousPoint(previousStep, step)
    if (previousStepConstrained === previousStep) {
        return [{
            ...state, steps: _steps_replaceAtIndex(state.steps, index, step)
        }, true]
    }

    previousStep = Thermodynamics.solvePVT(previousStepConstrained, state.system)

    return [{
        ...state, steps: _steps_replaceAtIndex(
            _steps_replaceAtIndex(state.steps, previousStepIndex, previousStep),
            index, step)
    }, false]
}
const steps_update = (state,action) => {
    
    state = {...state, steps: _steps_replaceAtIndex(
        state.steps, action.index, action.newStep
    )}
    var startIndex = action.index
    state = _operateOnNextUntilCondition(
        state,startIndex,
        _applyNextPointConstraintsAtIndex,
        _generateNotReturnedToStartOrBreakSignalCondition(startIndex)
    )

    state = _operateOnPreviousUntilCondition(
        state,startIndex,
        _applyPreviousPointConstraintsAtIndex,
        _generateNotReturnedToStartOrBreakSignalCondition(startIndex)
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

function _generateNotReturnedToStartOrBreakSignalCondition(startIndex) {
    return (state, index, breakCondition) => {
        const returnedToStartIndex = index === startIndex && breakCondition !== undefined
        if (returnedToStartIndex) { return false} 
        if (breakCondition) { return false} 
        return true
    }
}

function _recalculateEntropyAtIndex(state, index) {
    var step = state.steps[index]
    var nextStep = _getNextStep(state, index)
    const isUnfixedEntropyStepType = (
        step.type !== 'isentropic' &&
        step.type !== 'none' &&
        state.steps.length !== 1
    )
    if (isUnfixedEntropyStepType) {
        step.entropyChange = _getEntropyChange(step, nextStep, state)
        var stepEntropy = _getStepEntropy(step)
        nextStep.entropy = stepEntropy + step.entropyChange
    }
    return state
}

function _getStepEntropy(step) {
    return hasDefinedKey(step, 'staticEntropy') ?
        step.staticEntropy : step.entropy
}

function _applyStepTypeConstraintsToNextPoint(step, nextStep) {
    if (step.type === 'isobaric' && step.pressure !== nextStep.pressure) {
        nextStep = { ...nextStep, pressure: step.pressure, temperature: undefined }
    }
    return nextStep
}

function _applyStepTypeConstraintsToPreviousPoint(previousStep, step) {
    if (previousStep.type === 'isobaric' && previousStep.pressure !== step.pressure) {
        previousStep = { ...previousStep, pressure: step.pressure, temperature: undefined }
    }
    return previousStep
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
        for (key in ['volume', 'temperature', 'pressure']) {
            if (!hasDefinedKey(action.newProperties,key)) {
                action.newProperties[key] = undefined
            }
        }
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
        temperature_1: step.temperature,
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
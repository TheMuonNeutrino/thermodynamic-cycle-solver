import Thermodynamics from "../Thermodynamics"
import { getNextIndex, hasDefinedKey } from "../Utils"

export const steps_add = (index, step) => {
    return {
        type: 'steps/add',
        index: index,
        newStep: step,
    }
}

export const steps_update = (index, step) => {
    return {
        type: 'steps/update',
        index: index,
        newStep: step,
    }
}

export const steps_updateProperties = (index, properties) => {
    return {
        type: 'steps/updateProperties',
        index: index,
        newProperties: properties
    }
}

export const steps_delete = (index) => {
    return {
        type: 'steps/delete',
        index: index,
    }
}

export const system_setParams = (params) => {
    if (hasDefinedKey(params,'isochoricHeatCapacityR')){
        params.isochoricHeatCapacity = params.isochoricHeatCapacityR *Thermodynamics.R
    }
    return{
        type: 'system/setParams',
        params: params,
    }
}

export const steps_reorder = (newOrder) => {
    return{
        type: 'steps/setAll',
        newSteps: newOrder,
    }
}

export const steps_reverse = (steps) => {
    var newSteps = []
    newSteps.push({...steps[0],type: steps[(getNextIndex(0,{steps: steps}))].type})
    for (var i=steps.length-1; i>0; i--){
        newSteps.push({...steps[i],type: steps[(getNextIndex(i,{steps: steps}))].type})
    }
    return{
        type: 'steps/setAll',
        newSteps: newSteps
    }
}
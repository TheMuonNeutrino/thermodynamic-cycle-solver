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

export const system_setMoles = (moles) => {
    return{
        type: 'system/setMoles',
        moles: moles,
    }
}
export const setPreset = (preset) => {
    var action = {type: 'steps/setAll'}
    if (preset === 'carnotCycle'){
        action.newSteps = [
            {
                staticEntropy: 1,
                temperature: 500,
                pressure: 2e5,
                type: 'isothermal',
            },{
                temperature: 500,
                pressure: 1e5,
                type: 'isentropic'
            },{
                pressure: 100000,
                temperature: 400,
                type: 'isothermal'
            },{
                temperature: 400,
                pressure: 200000,
                type: 'isentropic',
            }
        ]
    }
    if (preset === 'isobaricIsochoric'){
        action.newSteps = [
            {
                staticEntropy: 0,
                pressure: 1e5,
                volume: 0.05,
                type: 'isochoric'
            },{
                pressure: 2e5,
                volume: 0.05,
                type: 'isobaric'
            },{
                pressure: 2e5,
                volume: 0.15,
                type: 'isochoric'
            },{
                pressure: 1e5,
                volume: 0.15,
                type: 'isobaric'
            }
        ]
    }
    return action
}
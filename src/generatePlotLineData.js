import Thermodynamics from './Thermodynamics'

export const generatePlotLineDataPV = (steps,system) =>{
    const res = []
    for (var index=0; index<steps.length-1; index++){
        var indexNext = index + 1
        res.push(_getLinePointsPV(steps, index, indexNext,system))
    }
    res.push(_getLinePointsPV(steps, steps.length-1, 0,system))
    return res
}

const _getXYPV = (step) => {
    return {x: step.volume, y: step.pressure}
}

function _getLinePointsPV(steps, index, indexNext,system) {
    if (steps[index].type === 'isobaric' || steps[index].type === 'isochoric'){
        return [
            _getXYPV(steps[index]), _getXYPV(steps[indexNext])
        ]
    }
    const volumes = linspace(steps[index].volume,steps[indexNext].volume,100)
    if (steps[index].type === 'isothermal'){
        const c = steps[index].pressure * steps[index].volume
        
        const points = volumes.map((vol)=>{
            return {x: vol, y:c / vol}
        })
        return points
    }
    if (steps[index].type === 'isentropic'){
        const c = Math.pow(
            steps[index].pressure,system.isochoricHeatCapacity
        ) * Math.pow(
            steps[index].volume,system.isochoricHeatCapacity + Thermodynamics.R
        )
        const points = volumes.map((vol)=>{
            return {x: vol, y:(
                Math.pow(c / Math.pow(vol,system.isochoricHeatCapacity + Thermodynamics.R),1/system.isochoricHeatCapacity)
            )}
        })
        return points
    }
    return [
        _getXYPV(steps[index]), _getXYPV(steps[indexNext])
    ]
    
}

function linspace(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

import Thermodynamics from './Thermodynamics'
import { hasDefinedKey } from './Utils'

export const generatePlotLineDataPV = (steps,system) =>{
    return generatePlotLineData(steps,system,_getLinePointsPV)
}

export const generatePlotLineDataST = (steps, system) => {
    return generatePlotLineData(steps,system,_getLinePointsST)
}

const generatePlotLineData = (steps,system,_getLinePoints) =>{
    const res = []
    for (var index=0; index<steps.length-1; index++){
        var indexNext = index + 1
        res.push(_getLinePoints(steps, index, indexNext,system))
    }
    res.push(_getLinePoints(steps, steps.length-1, 0,system))
    return res
}

const _getXYPV = (step) => {
    return {x: step.volume, y: step.pressure}
}

const getEntropy = (step) => {
    if (hasDefinedKey(step,'staticEntropy')){
        return step.staticEntropy
    }
    return step.entropy
}

const _getXYST = (step) => {
    return {x: getEntropy(step), y: step.temperature}
}

function _getLinePointsST(steps,index,indexNext,system) {
    if (steps[index].type === 'isothermal' || steps[index].type === 'isentropic'){
        return[
            _getXYST(steps[index]), _getXYST(steps[indexNext])
        ]
    }
    const entropies = linspace(getEntropy(steps[index]),getEntropy(steps[indexNext]),100)
    if (steps[index].type === 'isochoric' || steps[index].type === 'isobaric'){
        var power
        if (steps[index].type === 'isochoric'){
            power = system.isochoricHeatCapacity
        }
        if (steps[index].type === 'isobaric'){
            power = system.isochoricHeatCapacity + Thermodynamics.R
        }
        const points = entropies.map((entropy)=>{
            const x = Math.exp((entropy-getEntropy(steps[index]))/system.moles) * Math.pow(
                steps[index].temperature,power
            )
            return {y: Math.pow(x,1/power), x:entropy}
        })
        return points
    }
    return [_getXYST(steps[index]),]
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
        _getXYPV(steps[index])
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

import { hasDefinedKey } from "./Utils"

const R = 8.3145

class InsufficientConstraintsError extends Error {}
class IncompatibleConstraintsError extends Error {}

const flagsForKeysInPoint = (point) =>{
    const hasT = 'temperature' in point && point.temperature !== undefined
    const hasV = 'volume' in point && point.volume !== undefined
    const hasP = 'pressure' in point && point.pressure !== undefined
    return [hasT,hasV,hasP]
}

const solvePVT = (pointConstraints,system) => {
    const point = Object.assign({},pointConstraints)
    const [hasT,hasV,hasP] = flagsForKeysInPoint(point)

    if (hasT + hasP + hasV < 2){
        throw new InsufficientConstraintsError(
            `Must specify two of the constraints in point: ${JSON.stringify(point)}`
        );
    }
    if (hasT && hasP && hasV){
        const computedT = point.pressure * point.volume / (R * system.moles)
        if (Math.abs(computedT - point.temperature) > 0.0001){
            throw new IncompatibleConstraintsError(
                `Point ${JSON.stringify(point)} is not a valid solution to the PVT equation`
            )
        }
        return point
    }

    if (!hasT && hasP && hasV){
        point.temperature = point.pressure * point.volume / (R * system.moles)
    }
    if (!hasV && hasP && hasT){
        point.volume = point.temperature * R * system.moles / point.pressure
    }
    if (!hasP && hasV && hasT){
        point.pressure = point.temperature * R * system.moles / point.volume
    }
    return point
}

const _computeEntropyCalculationComponent = (pointConstraints,system) =>{
    var point = Object.assign({},pointConstraints)
    const [hasT,hasV,hasP] = flagsForKeysInPoint(point)

    if (hasT + hasV + hasP === 0){
        throw new InsufficientConstraintsError(
            "Must provide atleast one constraint (P V or T) for each point"
        )
    }
    if (hasT + hasV + hasP > 1){
        point = solvePVT(point,system)
        point.entropyCalculationComponent = (
            Math.pow(point.pressure,system.isochoricHeatCapacity) *
            Math.pow(point.volume,system.isochoricHeatCapacity + R)
        )
    }
    return point
}

const _PvtFromEntropyCalculationComponent = (component,pressure,volume,temperature,system) =>{
    if (temperature !== undefined){
        volume = Math.pow(
            component/Math.pow(temperature * system.moles * R,system.isochoricHeatCapacity),
            1/R
        )
    }else if (volume !== undefined){
        pressure = Math.pow(
            component/Math.pow(volume,system.isochoricHeatCapacity+R),
            1/system.isochoricHeatCapacity
        )
    }else if (pressure !== undefined){
        volume = Math.pow(
            component/Math.pow(pressure,system.isochoricHeatCapacity),
            1/(system.isochoricHeatCapacity + R)
        )
    }
    return {pressure, volume, temperature}

}

const _extractPointsFromStep = (step) => {
    var point1 = {
        pressure: step.pressure_1,
        volume: step.volume_1,
        temperature: step.temperature_1
    }
    var point2 = {
        pressure: step.pressure_2,
        volume: step.volume_2,
        temperature: step.temperature_2
    }
    return [point1, point2]
}

const solveEntropyChange = (stepConstraints,system) => {
    const step = Object.assign({},stepConstraints)
    const hasDeltaS = hasDefinedKey(step,'entropyChange')
    const hasP1 = hasDefinedKey(step,'pressure_1')
    const hasV1 = hasDefinedKey(step,'volume_1')
    const hasT1 = hasDefinedKey(step,'temperature_1')
    const hasP2 = hasDefinedKey(step,'pressure_2')
    const hasV2 = hasDefinedKey(step,'volume_2')
    const hasT2 = hasDefinedKey(step,'temperature_2')
    const numberOfConstraints = hasDeltaS + hasP1 + hasV1 + hasT1 + hasP2 + hasV2 + hasT2

    if (numberOfConstraints < 4){
        throw new InsufficientConstraintsError('Must specify atleast 4 constraints')
    }

    var [point1, point2] = _extractPointsFromStep(step)

    var A, B, X, hasA, hasB
    hasA = hasB = false
    
    point1 = _computeEntropyCalculationComponent(point1,system)
    if ('entropyCalculationComponent' in point1){
        B = point1.entropyCalculationComponent
        hasB = true
    }
    point2 = _computeEntropyCalculationComponent(point2,system)
    if ('entropyCalculationComponent' in point2){
        A = point2.entropyCalculationComponent
        hasA = true
    }

    X = Math.exp(step.entropyChange/system.moles)

    if (hasDeltaS && hasA && hasB){
        var computedX = A / B
        if (Math.abs(computedX - X) > 0.0001){
            throw new IncompatibleConstraintsError(
                `Step ${JSON.stringify(stepConstraints)} is not a valid solution for the entropy change,
                X = ${X}, computedX = ${computedX}`
            )
        }
    }

    if (!hasDeltaS && hasA && hasB){
        X = A / B
        step.entropyChange = Math.log(X) * system.moles
    }
    if (!hasA && hasDeltaS && hasB){
        A = X*B
        point2 = _PvtFromEntropyCalculationComponent(
            A,step.pressure_2,step.volume_2,step.temperature_2,system
        )
    }
    if (!hasB && hasDeltaS && hasA){
        B = A/X
        point1 = _PvtFromEntropyCalculationComponent(
            B,step.pressure_1,step.volume_1,step.temperature_1,system
        )
    }

    point1 = solvePVT(point1,system)
    point2 = solvePVT(point2, system)

    step.temperature_1 = point1.temperature
    step.pressure_1 = point1.pressure
    step.volume_1 = point1.volume
    step.temperature_2 = point2.temperature
    step.pressure_2 = point2.pressure
    step.volume_2 = point2.volume
    
    return step
}

const Thermodynamics = {
    R, 
    solvePVT,
    solveEntropyChange,
    flagsForKeysInPoint,
    InsufficientConstraintsError, 
    IncompatibleConstraintsError
}

export default Thermodynamics
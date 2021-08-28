import Thermodynamics from "../Thermodynamics";

describe('solvePVT tests',()=>{
    const system = {
        moles: 25
    }
    const point = {
        pressure: 10000,
        volume: 1,
    }
    const expectTemperature = 10000 / 25 / Thermodynamics.R;

    test('R is 8.3145',()=>{
        expect(Thermodynamics.R).toBeCloseTo(8.3145)
    })

    test('Can compute T from point with P V, system with n, without mutating orginal point data',()=>{
        const newPoint = Thermodynamics.solvePVT(point,system)
        expect(newPoint.temperature).toBeCloseTo(expectTemperature);
        expect(point.temperature).toBeUndefined()
    })

    test('Compute P from point with T V',()=>{
        const point = {
            volume: 1,
            temperature: expectTemperature
        }
        const newPoint = Thermodynamics.solvePVT(point,system)
        expect(newPoint.pressure).toBeCloseTo(10000)
    })

    test('Compute V from point with T P',()=>{
        const point = {
            pressure: 10000,
            temperature: expectTemperature*2
        }
        const newPoint = Thermodynamics.solvePVT(point,system)
        expect(newPoint.volume).toBeCloseTo(2)
    })

    test('Throws error when passing only one contraint to solvePVT',()=>{
        const point = {pressure: 1000}
        expect(()=>{
            newPoint = Thermodynamics.solvePVT(point,system)
        }).toThrow(Thermodynamics.InsufficientConstraintsError)
    })

    test('Throws error when passing invalid combination of P V and T',()=>{
        const point={
            pressure: 25000,
            volume: 1,
            temperature: 100
        }
        expect(()=>{
            newPoint = Thermodynamics.solvePVT(point,system)
        }).toThrow(Thermodynamics.IncompatibleConstraintsError)
    })
    
    test('Returns input point if P V and T specified in valid combination',()=>{
        const point = {
            pressure: 2500,
            volume: 1,
            temperature: 2500 / system.moles / Thermodynamics.R
        }
        const newPoint = Thermodynamics.solvePVT(point,system)
        expect(newPoint.temperature).toBeCloseTo(point.temperature)
        expect(newPoint.pressure).toBeCloseTo(point.pressure)
        expect(newPoint.volume).toBeCloseTo(point.volume)
    })

})

describe('solveEntropyChange tests',()=>{
    const system = {
        moles: 2,
        isochoricHeatCapacity: 5/2 * Thermodynamics.R
    }
    const step = {
        pressure_1: 10000,
        pressure_2: 10000,
        volume_1: 1,
        volume_2: 2
    }
    const expectedEntropyChange = (
        system.moles * system.isochoricHeatCapacity *
        Math.log(step.pressure_2*step.volume_2/step.pressure_1/step.volume_1) +
        (system.moles * Thermodynamics.R * Math.log(step.volume_2/step.volume_1))
    )

    test('Solve for entropy change of isobaric',()=>{
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.entropyChange).toBeCloseTo(expectedEntropyChange)
    })

    test('Solve for V2 given entropy change',()=>{
        const step = {
            pressure_1: 10000,
            pressure_2: 10000,
            volume_1: 1,
            entropyChange: expectedEntropyChange
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.volume_2).toBeCloseTo(2)
    })

    test('Solve for P2 given entropy change',()=>{
        const step = {
            pressure_1: 10000,
            volume_1: 1,
            volume_2: 2,
            entropyChange: expectedEntropyChange
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.pressure_2).toBeCloseTo(10000)
    })

    test('Solve for V2 given entropy change and T2, but not P2',()=>{
        const step = {
            pressure_1: 10000,
            volume_1: 1,
            temperature_2: 2 * 10000 / system.moles / Thermodynamics.R,
            entropyChange: expectedEntropyChange
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.volume_2).toBeCloseTo(2)
    })
    test('Solve for V1 given entropy change and P1 V2 P2',()=>{
        const step = {
            pressure_1: 10000,
            pressure_2: 10000,
            volume_2: 2,
            entropyChange: expectedEntropyChange 
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.volume_1).toBeCloseTo(1)
    })
    test('Throw error if only 3 contrains given',()=>{
        const step = {
            pressure_1: 10000,
            pressure_2: 10000,
            volume_2: 2,
        }
        expect(()=>{
            Thermodynamics.solveEntropyChange(step,system)
        }).toThrow(Thermodynamics.InsufficientConstraintsError)
    })
    test('Throw error if incompatible set of PVT constraints',()=>{
        const step = {
            pressure_1: 10000,
            pressure_2: 10000,
            volume_2: 2,
            temperature_2: 1000,
            entropyChange: expectedEntropyChange 
        }
        expect(()=>{
            Thermodynamics.solveEntropyChange(step,system)
        }).toThrow(Thermodynamics.IncompatibleConstraintsError)
    })
    test('Throw error if no constraints for one point',()=>{
        const step={
            pressure_1: 10000,
            volume_1: 1,
            temperature_1: 10000 / system.moles / Thermodynamics.R,
            entropyChange: expectedEntropyChange
        }
        expect(()=>{
            Thermodynamics.solveEntropyChange(step,system)
        }).toThrow(Thermodynamics.InsufficientConstraintsError)
    })
    test('Accept an input point with 3 vaild constraints',()=>{
        const step={
            pressure_1: 10000,
            volume_1: 1,
            temperature_1: 10000 / system.moles / Thermodynamics.R,
            volume_2: 2,
            entropyChange: expectedEntropyChange
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.pressure_2).toBeCloseTo(10000)
        expect(newStep.temperature_2).toBeCloseTo(20000 / system.moles / Thermodynamics.R)
    })
    test('Solve for P1 T1 given V1 P2 T2 entropyChange',()=>{
        const step = {
            volume_1: 1,
            pressure_2: 10000,
            temperature_2: 20000 / system.moles / Thermodynamics.R,
            entropyChange: expectedEntropyChange,
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        expect(newStep.pressure_1).toBeCloseTo(10000)
        expect(newStep.temperature_1).toBeCloseTo(10000 / system.moles / Thermodynamics.R)
    })
    test('Throws error on passing set of 5 incompatible constraints',()=>{
        const step = {
            pressure_1: 30,
            volume_1: 1,
            pressure_2: 10000,
            temperature_2: 20000 / system.moles / Thermodynamics.R,
            entropyChange: expectedEntropyChange,
        }
        expect(()=>{
            Thermodynamics.solveEntropyChange(step,system)
        }).toThrow(Thermodynamics.IncompatibleConstraintsError)
    })
    test('Returns step on passing set of 5 compatible constraints',()=>{
        const step = {
            pressure_1: 10000,
            volume_1: 1,
            pressure_2: 10000,
            temperature_2: 20000 / system.moles / Thermodynamics.R,
            entropyChange: expectedEntropyChange,
        }
        const newStep = Thermodynamics.solveEntropyChange(step,system)
        for (const property in step){
            expect(newStep[property]).toBeCloseTo(step[property])
        }
    })
    
})
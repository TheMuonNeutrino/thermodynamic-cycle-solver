import Thermodynamics from '../Thermodynamics'
import {createStore} from 'redux'
import thermodynamicSystemReducer from '../reducers'
import {steps_add, steps_update, steps_updateProperties, steps_delete, system_setMoles} from '../actions'

describe('App state - Basic tests',()=>{
    const system = {
        moles: 1,
        isochoricHeatCapacity: 5/2 * Thermodynamics.R
    }
    const firstStep = {
        pressure: 10000,
        volume: 1,
        temperature: 10000/Thermodynamics.R,
        staticEntropy: 0,
        type: 'none'
    }
    const secondStep = {
        pressure: 10000,
        volume: 2,
        temperature: 20000/Thermodynamics.R,
        type: 'none'
    }
    const thirdStep = {
        pressure: 20000,
        volume: 2,
        temperature: 40000/Thermodynamics.R,
        type: 'none'
    }
    const expectedEntropyChangeFirstToSecond = (
        system.moles * system.isochoricHeatCapacity * Math.log(2) +
        system.moles * Thermodynamics.R * Math.log(2)
    )
    const expectedEntropyChangeSecondToThird = (
        system.moles * system.isochoricHeatCapacity * Math.log(2)
    )
    var store
    beforeEach(()=>{
        store = createStore(thermodynamicSystemReducer)
    })

    it('Is initialised to startup config',()=>{
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [firstStep]
        })
    })
    it('Allows a step to be added at the end using -1 index',()=>{
        store.dispatch(steps_add(-1,secondStep))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [firstStep, secondStep]
        })
    })
    it('Allows a step to be added at the end using {length} index',()=>{
        store.dispatch(steps_add(2,secondStep))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [firstStep, secondStep]
        })
    })
    it('Allows a step to be added at the start',()=>{
        store.dispatch(steps_add(0,secondStep))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [secondStep, firstStep]
        })
    })
    it('Allows a step to be added in the middle',()=>{
        store.dispatch(steps_add(-1,thirdStep))
        store.dispatch(steps_add(1,secondStep))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [firstStep,secondStep,thirdStep]
        })
    })
    it('Allows a step to be updated based on index',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_update(0,thirdStep))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [thirdStep,secondStep]
        })
    })
    it('Allows a step to be deleted',()=>{
        store.dispatch(steps_delete(0))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: []
        })
    })
    it('Allows system moles to be set, updating entropy change computation and temperature',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_update(0,{...firstStep, type:'isobaric'}))
        store.dispatch(system_setMoles(2))
        expect(
            store.getState()
        ).toStrictEqual({
            system: {...system, moles: 2},
            steps: [{
                ...firstStep,
                entropyChange:expectedEntropyChangeFirstToSecond*2, 
                type:'isobaric',
                temperature: firstStep.temperature/2
            },
            {
                ...secondStep,
                entropy:expectedEntropyChangeFirstToSecond*2,
                temperature: secondStep.temperature/2
            }]
        })
    })
    it('Computes the entropy change for an isobaric step',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_update(0,{...firstStep,type:'isobaric'}))
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [{...firstStep, entropyChange: expectedEntropyChangeFirstToSecond, type: 'isobaric'},
            {...secondStep, entropy: expectedEntropyChangeFirstToSecond}]
        })
    })
    it('Computes the entropy change for an isochoric step, chains entropy calculations',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_add(-1,thirdStep))
        store.dispatch(steps_update(0,{...firstStep,type:'isobaric'}))
        store.dispatch(steps_update(1,{...secondStep,type:'isochoric'}))
        const resState = store.getState()
        expect(resState.steps[2].entropy).toBeCloseTo(
            expectedEntropyChangeFirstToSecond + expectedEntropyChangeSecondToThird
        )
        expect(resState.steps[1].entropyChange).toBeCloseTo(
            expectedEntropyChangeSecondToThird
        )
    })
    it('Forces point at end of isobaric step to have the same pressure before computing properties',()=>{
        store.dispatch(steps_add(-1,{...secondStep,pressure: 11000,temperature: undefined}))
        store.dispatch(steps_update(0,{...firstStep,type:'isobaric'}))
        const resState = store.getState()
        expect(resState.steps[1].pressure).toBeCloseTo(10000)
        expect(
            store.getState()
        ).toStrictEqual({
            system: system,
            steps: [{...firstStep, entropyChange: expectedEntropyChangeFirstToSecond, type: 'isobaric'},
            {...secondStep, entropy: expectedEntropyChangeFirstToSecond}]
        })
    })
    it('Allows target properties to be updated for a step',()=>{
        store.dispatch(steps_updateProperties(0,{type:'isobaric',volume: 2}))
        expect(store.getState()).toStrictEqual({
            system: system,
            steps: [{...firstStep, type:'isobaric',volume:2,temperature:secondStep.temperature}]
        })
    })

    it('Forces chained isobaric steps to have the same pressure for all points',()=>{
        store.dispatch(steps_add(-1,{...secondStep,pressure: 11000,temperature: undefined}))
        store.dispatch(steps_add(-1,{...secondStep,pressure: 11000, volume: 3, temperature: undefined}))
        store.dispatch(steps_updateProperties(1,{type:'isobaric'}))
        store.dispatch(steps_updateProperties(0,{type:'isobaric'}))
        const resState = store.getState()
        expect(resState.steps[1].pressure).toBeCloseTo(10000)
        expect(resState.steps[2].pressure).toBeCloseTo(10000)
    })
    it('Forward propagates changes in the pressure of isobaric step',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_updateProperties(0,{type:'isobaric'}))
        store.dispatch(steps_updateProperties(0,{pressure: 11000, volume: undefined}))
        const resState = store.getState()
        expect(resState.steps[1].pressure).toBeCloseTo(11000)
    })
    it('Backwards propagates changes in the pressure of isobaric step',()=>{
        store.dispatch(steps_add(-1,secondStep))
        store.dispatch(steps_updateProperties(0,{type:'isobaric'}))
        store.dispatch(steps_updateProperties(1,{pressure: 11000}))
        const resState = store.getState()
        expect(resState.steps[0].pressure).toBeCloseTo(11000)
    })
    it('Propagates change in the volume of isochoric step',()=>{
        store = createStore(thermodynamicSystemReducer,{
            system: system,
            steps: [
                {...secondStep, type: 'isochoric'},
                thirdStep
            ]
        })
        store.dispatch(steps_updateProperties(0,{volume:2.1}))
        const resState = store.getState()
        expect(resState.steps[1].volume).toBeCloseTo(2.1)
    })
    it('Throws an error on passing invalid type',()=>{
        expect(()=>{
            store.dispatch(steps_updateProperties(0,{type:'myInvalidType'}))
        }).toThrow(Error)
    })
})

describe('App state - Three step types',()=>{
    const system = {
        moles: 20,
        isochoricHeatCapacity: 3/2 * Thermodynamics.R
    }
    const firstStep = {
        pressure: 10000,
        volume: 1,
        temperature: 1000/2/Thermodynamics.R,
        staticEntropy: 0,
        type: 'isobaric'
    }
    const secondStep = {
        pressure: 10000,
        volume: 2,
        temperature: 1000/Thermodynamics.R,
        type: 'isochoric'
    }
    const thirdStep = {
        pressure: 20000,
        volume: 2,
        temperature: 2000/Thermodynamics.R,
        type: 'isothermal'
    }
    const fourthStep = {
        pressure: 30000,
        temperature:thirdStep.temperature,
        volume:4/3,
        type:'isobaric'
    }
    const fifthStep = {
        pressure: 30000,
        volume: 1,
        temperature:1500/Thermodynamics.R,
        type:'isochoric'
    }
    var store
    beforeEach(()=>{
        store = createStore(thermodynamicSystemReducer,{
            system: system,
            steps: [firstStep,secondStep,thirdStep,fourthStep,fifthStep]
        })
    })
    it('Propagates changes to thermodynamic step',()=>{
        store = createStore(thermodynamicSystemReducer,{
            system: system,
            steps: [firstStep,secondStep,thirdStep,{
                pressure: 40000,
                volume: 1,
                temperature: 2000/Thermodynamics.R,
                type: 'isochoric',
            }]
        })
        store.dispatch(steps_updateProperties(2,{temperature: 2500/Thermodynamics.R}))
        const resState = store.getState()
        expect(resState.steps[3].temperature).toBeCloseTo(2500/Thermodynamics.R)
        expect(resState.steps[3].volume).toBeCloseTo(1)
        expect(resState.steps[3].pressure).toBeCloseTo(2500*20)
        expect(resState.steps[0].pressure).toBeCloseTo(10000)
        expect(resState.steps[0].volume).toBeCloseTo(1)
    })
    it('Propagates changes to thermodynamic step respecting following isobaric step',()=>{
        store.dispatch(steps_updateProperties(2,{temperature: 2500/Thermodynamics.R}))
        const resState = store.getState()
        expect(resState.steps[2].temperature).toBeCloseTo(2500/Thermodynamics.R)
        expect(resState.steps[3].temperature).toBeCloseTo(2500/Thermodynamics.R)
        expect(resState.steps[3].pressure).toBeCloseTo(30000)
        expect(resState.steps[4].pressure).toBeCloseTo(30000)
        expect(resState.steps[4].volume).toBeCloseTo(1)
    })
    it('Propagates changes to isochoric step respecting following isothermal step',()=>{
        store.dispatch(steps_updateProperties(1,{volume: 2.1}))
        const resState = store.getState()
        expect(resState.steps[1].volume).toBeCloseTo(2.1)
        expect(resState.steps[1].pressure).toBeCloseTo(secondStep.pressure)
        expect(resState.steps[2].volume).toBeCloseTo(2.1)
        expect(resState.steps[2].temperature).toBeCloseTo(thirdStep.temperature)
    })
    it('Backwards propagates changes to isobaric step respecting prior isothermal step',()=>{
        store.dispatch(steps_updateProperties(4,{pressure: 32000}))
        const resState = store.getState()
        expect(resState.steps[4].pressure).toBeCloseTo(32000)
        expect(resState.steps[4].volume).toBeCloseTo(fifthStep.volume)
        expect(resState.steps[3].pressure).toBeCloseTo(32000)
        expect(resState.steps[3].temperature).toBeCloseTo(fourthStep.temperature)
        expect(resState.steps[2].temperature).toBeCloseTo(thirdStep.temperature)
    })
})
describe('App state - Isentropic step logic',()=>{
    const systemA = {
        moles: 20,
        isochoricHeatCapacity: 3/2 * Thermodynamics.R
    }
    it('Propagates changes across isentropic step',()=>{
        var store = createStore(thermodynamicSystemReducer,{
            system: systemA,
            steps: [
                {pressure: 100000, volume: 1, temperature: 100000/20/Thermodynamics.R, 
                    type: 'none', staticEntropy:0},
                {pressure: 100000, volume: 2, temperature: 10000/Thermodynamics.R, type:'none'}
            ]
        })
        store.dispatch(steps_updateProperties(0,{type: 'isentropic'}))
        const resState = store.getState()
        expect(resState.steps[0].entropyChange).toBeCloseTo(0)
    })
    it('Propagates changes across isentropic step respecting subsequent isobaric step',()=>{
        var store = createStore(thermodynamicSystemReducer,{
            system: systemA,
            steps: [
                {pressure: 200000, volume: 1, temperature: 10000/Thermodynamics.R, 
                    type: 'none', staticEntropy:0},
                {pressure: 100000, volume: 2, temperature: 10000/Thermodynamics.R, type:'isobaric'},
                {pressure: 100000, volume: 3, temperature: 30000/2/Thermodynamics.R, type:'none'}
            ]
        })
        store.dispatch(steps_updateProperties(0,{type: 'isentropic'}))
        const resState = store.getState()
        expect(resState.steps[0].entropyChange).toBeCloseTo(0)
        expect(resState.steps[1].pressure).toBeCloseTo(100000)
        expect(resState.steps[2].pressure).toBeCloseTo(100000)
    })
    it('Propagates changes across isentropic step respecting subsequent isochoric step',()=>{
        var store = createStore(thermodynamicSystemReducer,{
            system: systemA,
            steps: [
                {pressure: 200000, volume: 1, temperature: 10000/Thermodynamics.R, 
                    type: 'none', staticEntropy: 0},
                {pressure: 100000, volume: 2, temperature: 10000/Thermodynamics.R, type:'isochoric'},
                {pressure: 50000, volume: 2, temperature: 5000/Thermodynamics.R, type:'none'}
            ]
        })
        store.dispatch(steps_updateProperties(0,{type: 'isentropic'}))
        const resState = store.getState()
        expect(resState.steps[0].entropyChange).toBeCloseTo(0)
        expect(resState.steps[1].volume).toBeCloseTo(2)
        expect(resState.steps[2].volume).toBeCloseTo(2)
    })
})
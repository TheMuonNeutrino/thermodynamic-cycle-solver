import Thermodynamics from '../Thermodynamics'
import {createStore} from 'redux'
import thermodynamicSystemReducer from '../reducers'
import {steps_add, steps_update, steps_updateProperties, steps_delete, system_setMoles} from '../actions'

describe('App state - tests',()=>{
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
        store.dispatch(steps_updateProperties(1,{pressure: 11000, volume: undefined}))
        const resState = store.getState()
        expect(resState.steps[0].pressure).toBeCloseTo(11000)
    })
})
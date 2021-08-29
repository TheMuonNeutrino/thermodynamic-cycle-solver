import React from 'react';
import {mount} from 'enzyme';
import StepListItem from '../components/StepListItem';
import {createSerializer} from 'enzyme-to-json';
expect.addSnapshotSerializer(createSerializer({mode: 'deep'}));

describe.skip('StepList tests',()=>{
    var step, index, setStep, wrapper
    beforeEach(()=>{
        step = {
            temperature: 100,
            pressure: 1000000,
            volume: 5,
            staticEntropy: 5,
            type: 'isobaric',
            entropyChange: 300,
        }
        index = 3
        setStep = jest.fn()
        wrapper = mount(
            <StepListItem step={step} index={index} setStep={setStep}/>
        )
    })
    it('should render StepList',()=>{
        expect(wrapper).toMatchSnapshot();
    })
    it('should pass changes to the first 4 fields to setStep, parsing floats',()=>{
        wrapper.find('.parameter-field-value').at(0).simulate('change',{
            target: {value: '10'} 
        })
        expect(setStep).toHaveBeenLastCalledWith(index,{pressure: 10})
        wrapper.find('.parameter-field-value').at(2).simulate('change',{
            target: {value: '1e5'} 
        })
        expect(setStep).toHaveBeenLastCalledWith(index,{temperature: 100000})
    })
    it('should reject none float inputs',()=>{
        wrapper.find('.parameter-field-value').at(0).simulate('change',{
            target: {value: 'abc'} 
        })
        expect(setStep).not.toHaveBeenCalled()
    })
    it('should pass changes to step type to setStep',()=>{
        wrapper.find('span.text').at(2).simulate('click')
        expect(setStep).toHaveBeenLastCalledWith(3,{type: 'isochoric'})
    })
})
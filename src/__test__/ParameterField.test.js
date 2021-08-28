import React from 'react';
import { shallow } from 'enzyme';
import ParameterField from "../components/ParameterField";

describe('ParameterField tests',()=>{
    var value, onValueChange, component
    beforeEach(()=>{
        value = 0
        onValueChange = jest.fn()
        component = shallow(
            <ParameterField 
                label='myTestLabel' 
                value='myTestValue' 
                readOnly={false} 
                updateValue={onValueChange}
                updateKey='myTestUpdateKey'
            />
        )
    })
    it('Should render with label and value',()=>{
        expect(component.getElements()).toMatchSnapshot()
    })
    it('Should call onValueChange when changed',()=>{
        component.find('input').simulate('change',{
            target: {value: '10'}
        })
        expect(onValueChange).toHaveBeenLastCalledWith({myTestUpdateKey: '10'})
    })
})
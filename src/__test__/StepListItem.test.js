import React from 'react';
import {shallow} from 'enzyme';
import StepListItem from '../components/StepListItem';

describe('StepList tests',()=>{
    it('should render StepList',()=>{
        const component = shallow(<StepListItem />)
        expect(component.getElements()).toMatchSnapshot();
    }) 
})
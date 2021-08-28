import React from 'react';
import ParameterField from './ParameterField';
import { Form } from 'semantic-ui-react';
import './StepListItem.css';

const DropDown = () => {
    const dropdownOptions = [
        {key: 'none', text:'(None)', value: 'none'},
        {key: 'isobaric', text:'Isobaric', value:'isobaric'},
        {key: 'isochoric', text:'Isochoric', value:'isochoric'},
        {key: 'isothermal', text:'Isothermal', value:'isothermal'},
        {key: 'isentropic', text:'Isentropic', value:'isentropic'},
    ]

    return(
        <Form.Dropdown search selection options={dropdownOptions} label='Step Type' />
    )
}

const StepListItem = (step,index) => {

    const pointUpdateFunction = () =>{

    }

    var entropyChange = 5

    const firstLinefieldProperties = [
        {
            label: 'Pressure',
            key: 'pressure',
            readOnly: false,
        },{
            label: 'Volume',
            key: 'volume',
            readOnly: false,
        },{
            label: 'Temperature',
            key: 'temperature',
            readOnly: false
        },{
            label: 'Entropy',
            key: 'entropy',
            readOnly: true
        }
    ]

    return(
        <div className='ui container'>
            <div className='ui large form'>
                <div className='fields'>
                    {firstLinefieldProperties.map((item)=>{return(
                        <ParameterField 
                            label={item.label}
                            value={step[item.key]}
                            key={item.label}
                            readOnly={item.readOnly}
                            updateValue={pointUpdateFunction}
                            updateKey={item.key}
                        />
                    )})}
                </div>
                <div className='fields'>
                    <div className='step-list-dropdown-wrapper'>
                        <DropDown />
                    </div>
                    <ParameterField
                        label='Entropy Change'
                        value={entropyChange}
                        key='entropyChange'
                        readOnly={true}
                    />
                </div>
            </div>
        </div>
    )
}

export default StepListItem
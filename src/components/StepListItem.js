import React from 'react';
import ParameterField from './ParameterField';
import { Form } from 'semantic-ui-react';
import './StepListItem.css';

const DropDown = ({value,setValue}) => {

    const dropdownOptions = [
        {key: 'none', text:'(None)', value: 'none'},
        {key: 'isobaric', text:'Isobaric', value:'isobaric'},
        {key: 'isochoric', text:'Isochoric', value:'isochoric'},
        {key: 'isothermal', text:'Isothermal', value:'isothermal'},
        {key: 'isentropic', text:'Isentropic', value:'isentropic'},
    ]

    return(
        <Form.Dropdown 
            search selection 
            options={dropdownOptions} 
            label='Step Type' 
            onChange={(e,data)=>{setValue(data.value)}}
            value={value}
        />
    )
}

const StepListItem = ({step,index,setStep}) => {

    const stepUpdateFunction = (param) =>{
        for (const key in param){
            if (key !== 'type'){
                param[key] = parseFloat(param[key])
                if ( isNaN(param[key])){return null}
            }
        }
        setStep(index,param)
    }

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
                            updateValue={stepUpdateFunction}
                            updateKey={item.key}
                        />
                    )})}
                </div>
                <div className='fields'>
                    <div className='step-list-dropdown-wrapper'>
                        <DropDown 
                            value={step.type}
                            setValue={(value)=>{stepUpdateFunction({type: value})}}
                        />
                    </div>
                    <ParameterField
                        label='Entropy Change'
                        value={step.entropyChange}
                        key='entropyChange'
                        readOnly={true}
                    />
                </div>
            </div>
        </div>
    )
}

export default StepListItem
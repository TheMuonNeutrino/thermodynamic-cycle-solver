import React from 'react';
import ParameterField from './ParameterField';



const StepListItem = () => {

    const pointUpdateFunction = () =>{

    }

    const point = [
        {
            label: 'Pressure',
            value: 10000,
            readOnly: false,
        },{
            label: 'Volume',
            value: 1,
            readOnly: false,
        },{
            label: 'Temperature',
            value: 100,
            readOnly: false
        },{
            label: 'Entropy',
            value: 1,
            readOnly: true
        }
    ]

    return(
        <div className='ui container'>
            <div className='ui large form'>
                <div className='four fields'>
                    {point.map((item)=>{return(
                        <ParameterField 
                            label={item.label}
                            value={item.value}
                            key={item.label}
                            readOnly={item.readOnly}
                            updateValue={pointUpdateFunction}
                        />
                    )})}
                </div>
            </div>
        </div>
    )
}

export default StepListItem
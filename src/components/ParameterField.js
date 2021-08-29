import React from 'react';
import './ParameterField.css';

const ParameterField = ({label,value,readOnly,updateValue,updateKey}) =>{
    var onChangeParam = ()=>{}
    if (!readOnly){
        onChangeParam = (event) => {
            var pointChanges = {}
            pointChanges[updateKey] = event.target.value
            updateValue(pointChanges)
        }
    }

    var [localValue, setLocalValue] = React.useState(value)

    const updateLocalValue = (value) => {
        if (value === ''){
            setLocalValue('')
        }else{
            setLocalValue(parseFloat(localValue))
        }
    }

    return(
        <div className='field parameter-field'>
            <label className='parameter-field-label'>{label}</label>
            <input 
                type='text'
                className='parameter-field-value' 
                value={localValue} 
                readOnly={readOnly}
                onBlur={onChangeParam}
                onChange={(e)=>{updateLocalValue(e.target.value)}}
            />
        </div>
    )
}

export default ParameterField
import React from 'react';
import './ParameterField.css';

const ParameterField = ({label,value,readOnly,updateValue}) =>{
    var onChangeParam = ''
    if (!readOnly){
        onChangeParam = (event) => {
            
        }
    }

    return(
        <div className='field parameter-field'>
            <label className='parameter-field-label'>{label}</label>
            <input 
                className='parameter-field-value' 
                value={value} 
                readOnly={readOnly}
                onChange={onChangeParam}
            />
        </div>
    )
}

export default ParameterField
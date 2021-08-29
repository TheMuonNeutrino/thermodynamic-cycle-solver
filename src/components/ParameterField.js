import React, { useCallback, useEffect } from 'react';
import './ParameterField.css';

const ParameterField = ({label,value,readOnly,updateValue,updateKey}) =>{

    var [localValue, setLocalValue] = React.useState(value)

    var updateLocalValue = () => {}
    if (!readOnly){
        updateLocalValue = (value) => {
            if (value === ''){
                setLocalValue('')
            }else{
                const newVal = parseFloat(value)
                if (!isNaN(newVal)){
                    setLocalValue(newVal)
                }
            }
        }
    }

    const onChangeParam = useCallback(() => {
        if (localValue !== '' && localValue !== value){
            var pointChanges = {}
            pointChanges[updateKey] = localValue
            updateValue(pointChanges)
        }
    },[localValue,updateValue,updateKey,value])

    useEffect(()=>{
        setLocalValue(value)
    },[value])

    useEffect(()=>{
        var timeoutRef = setTimeout(()=>{
            onChangeParam()
        },200)
        return(()=>{
            clearTimeout(timeoutRef)
        })
    },[localValue,onChangeParam])

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
                disabled={readOnly}
            />
        </div>
    )
}

export default ParameterField
import React, { useCallback, useEffect } from 'react';
import './ParameterField.css';

const ParameterField = ({label,value,readOnly,updateValue,updateKey,text}) =>{

    var [localValue, setLocalValue] = React.useState(value)

    var updateLocalValue = () => {}
    if (!readOnly){
        updateLocalValue = (value) => {
            if (value === ''){
                setLocalValue('')
            }else{
                setLocalValue(value)
            }
        }
    }

    const onChangeParam = useCallback(() => {
        if (localValue !== '' && localValue !== value){
            var newVal = parseFloat(localValue)
            var pointChanges = {}
            pointChanges[updateKey] = newVal
            const zeroCheck = (
                ['pressure','volume','temperature','moles'].includes(updateKey) && newVal === 0
            )
            if (!isNaN(newVal) && !zeroCheck){
                updateValue(pointChanges)
            }else{
                setLocalValue(value)
            }
            
        }
    },[localValue,updateValue,updateKey,value])

    useEffect(()=>{
        setLocalValue(value)
    },[value])

    useEffect(()=>{
        var timeoutRef = setTimeout(()=>{
            onChangeParam()
        },500)
        return(()=>{
            clearTimeout(timeoutRef)
        })
    },[localValue,onChangeParam])

    return(
        <div className='field parameter-field'>
            <label className='parameter-field-label'>{label}</label>
            <input 
                type='text'
                className={`parameter-field-value no-drag parameter-${updateKey}`} 
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
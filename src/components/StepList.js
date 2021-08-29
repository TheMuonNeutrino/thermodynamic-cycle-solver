import React from 'react';
import {connect} from 'react-redux';
import { Button } from 'semantic-ui-react';
import { steps_updateProperties,steps_add } from '../actions';
import StepListItem from './StepListItem'
import { ReactSortable } from 'react-sortablejs';

const StepList = ({steps,steps_updateProperties,steps_add}) => {
    const lastStep = steps[steps.length - 1]

    const addStep = () => {
        steps_add(
            -1,{
                pressure: lastStep.pressure + 100, 
                volume: lastStep.volume + 0.2,
                temperature: undefined,
                type: 'none'
            }
        )
    }

    return(
        <div>
            <div className='ui list'>
                {steps.map((step,index)=>{
                    return(
                        <div className='item' key={index}>
                            <StepListItem step={step} index={index} setStep={steps_updateProperties}></StepListItem>
                        </div>
                    )
                })}
            </div>
            <Button label='Add Step' onClick={addStep}></Button>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {steps: state.steps}
}

export default connect(mapStateToProps,{steps_updateProperties,steps_add})(StepList)
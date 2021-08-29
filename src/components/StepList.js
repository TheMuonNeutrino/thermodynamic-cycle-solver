import React from 'react';
import {connect} from 'react-redux';
import { steps_updateProperties } from '../actions';
import StepListItem from './StepListItem'

const StepList = ({steps,steps_updateProperties}) => {
    console.log(steps)
    return(
        <div>
            {steps.map((step,index)=>{
                return(
                    <div className='item' key={index}>
                        <StepListItem step={step} index={index} setStep={steps_updateProperties}></StepListItem>
                    </div>
                )
            })}
        </div>
    )
}

const mapStateToProps = (state) => {
    return {steps: state.steps}
}

export default connect(mapStateToProps,{steps_updateProperties})(StepList)
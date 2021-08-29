import React from 'react';
import {connect} from 'react-redux';
import { Button } from 'semantic-ui-react';
import { steps_updateProperties,steps_add,steps_reorder,steps_delete } from '../actions';
import StepListItem from './StepListItem'
import { ReactSortable } from 'react-sortablejs';
import './StepListItem.css';

const StepList = ({steps,steps_updateProperties,steps_add,steps_reorder,steps_delete}) => {
    const lastStep = steps[steps.length - 1]

    const disableDelete = steps.length > 1 ? false : true
    if (disableDelete){steps_delete=()=>{}}

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
            <ReactSortable 
                list={steps} 
                setList={steps_reorder}
                filter='.no-drag'
                handle='.container'
                preventOnFilter={false}
                chosenClass='selected-list-item'
            >
                {steps.map((step,index)=>{
                    return(
                        <div className='item' key={index}>
                            <StepListItem 
                                step={step} 
                                index={index} 
                                setStep={steps_updateProperties}
                                deleteStep={steps_delete}
                                deleteDisabled={disableDelete}
                            ></StepListItem>
                        </div>
                    )
                })}
            </ReactSortable>
            <div className='ui container'>
                <Button primary onClick={addStep}>Add step</Button>
            </div>
            
        </div>
    )
}

const mapStateToProps = (state) => {
    return {steps: state.steps}
}

export default connect(mapStateToProps,{steps_updateProperties,steps_add,steps_reorder,steps_delete})(StepList)
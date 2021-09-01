import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import { Button, Form, Table, Icon } from 'semantic-ui-react';
import { steps_updateProperties,steps_add,steps_reorder,steps_delete, steps_reverse, system_setParams } from '../actions';
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import { setPreset } from '../actions/setPreset';
import StepListItem from './StepListItem'
import { ReactSortable } from 'react-sortablejs';
import './StepListItem.css';
import ParameterField from './ParameterField';
import Thermodynamics from '../Thermodynamics';

const SystemStatsTable = ({system}) => {
    const refrigerationEfficiency = (system.refrigerationCOP*100).toFixed(2)
    const heatingEfficiency = (system.heatingCOP*100).toFixed(2)
    const thermalEfficiency = (system.thermalEfficiency * 100).toFixed(2)

    return(
        <Table collapsing size='large'>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Heat In</Table.Cell>
                            <Table.Cell>{system.heatIn.toFixed(2)} J</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Heat Out</Table.Cell>
                            <Table.Cell>{system.heatOut.toFixed(2)} J</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Net Work</Table.Cell>
                            <Table.Cell>{system.workNet.toFixed(2)} J</Table.Cell>
                        </Table.Row>
                        {refrigerationEfficiency > 0 ?
                            <Table.Row>
                                <Table.Cell>Refrigeration efficiency</Table.Cell>
                                <Table.Cell>{refrigerationEfficiency} %</Table.Cell>
                            </Table.Row>
                        :null}
                        {heatingEfficiency > 0 ?
                            <Table.Row>
                                <Table.Cell>Heating efficiency (heat pump)</Table.Cell>
                                <Table.Cell>{heatingEfficiency} %</Table.Cell>
                            </Table.Row>
                        :null}
                        {thermalEfficiency > 0 ?   
                            <Table.Row>
                                <Table.Cell>Thermal efficiency (engine)</Table.Cell>
                                <Table.Cell>{thermalEfficiency} %</Table.Cell>
                            </Table.Row>
                        :null}
                    </Table.Body>
                </Table>
    )
}

const StepList = ({
    steps,system,
    steps_updateProperties,steps_add,steps_reorder,steps_delete,setPreset,steps_reverse,system_setParams,
    canUndo,canRedo,onUndo,onRedo
}) => {
    const [presetValue, setPresetValue] = React.useState('')

    const presetOptions = [
        {
            text: '',
            value: '',
            id: 'none'
        },{
            text: 'Carnot Cycle',
            value: 'carnotCycle',
            id: 'carnotCycle'
        },{
            text: 'Isobaric & Isochoric',
            value: 'isobaricIsochoric',
            id: 'isobaricIsochoric'
        }
    ]

    useEffect(()=>{
        if (presetValue !== ''){
            setPreset(presetValue)
            setPresetValue('')
        }
    },[presetValue,setPreset])

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

    document.body.addEventListener('keydown',(e)=>{
        if (e.key === 'z' && e.ctrlKey === true){
            onUndo()
        }
        if (e.key === 'y' && e.ctrlKey === true){
            onRedo()
        }
    })

    return(
        <div>
            <div className='ui container'>
                <div className='ui large form'>
                    <div className='fields'>
                        <div className='field'>
                            <Form.Dropdown
                                search selection
                                options={presetOptions}
                                placeholder='Select a preset'
                                onChange={(e,data)=>{setPresetValue(data.value)}}
                                value={presetValue}
                                className=''
                            />
                        </div>
                        <div className='field'>
                            <Button 
                                primary onClick={()=>{steps_reverse(steps)}}
                                className='button-fill-height'
                            >
                                Reverse Cycle
                            </Button>
                        </div>
                        <div className='field'>
                            <Button icon labelPosition='right' disabled={!canUndo} 
                                onClick={onUndo} className='button-fill-height'
                            >
                                Undo
                                <Icon name='undo'/>
                            </Button>
                            <Button icon labelPosition='right' disabled={!canRedo} 
                                onClick={onRedo} className='button-fill-height'
                            >
                                Redo
                                <Icon name='redo'/>
                            </Button>
                        </div>
                    </div>
                    <div className='fields'>
                        <ParameterField 
                            label= 'Moles of gas (mol)'
                            value={system.moles}
                            key='moles'
                            updateKey='moles'
                            updateValue={system_setParams}
                        />
                        <ParameterField 
                            label= 'Isochoric heat capacity (J/K)'
                            value={system.isochoricHeatCapacity}
                            key='isochoricHeatCapacity'
                            updateKey='isochoricHeatCapacity'
                            updateValue={system_setParams}
                        />
                        <ParameterField 
                            label= 'Isochoric heat capacity (R)'
                            value={system.isochoricHeatCapacity/Thermodynamics.R}
                            key='isochoricHeatCapacityR'
                            updateKey='isochoricHeatCapacityR'
                            updateValue={system_setParams}
                        />
                    </div>
                </div>
                <SystemStatsTable system={system}/>
                <hr/>
            </div>
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
    return {...state.present, canUndo: state.past.length > 0, canRedo: state.future.length > 0}
}

export default connect(mapStateToProps,{
    steps_updateProperties,steps_add,steps_reorder,steps_delete,steps_reverse,setPreset,system_setParams,
    onUndo: UndoActionCreators.undo,
    onRedo: UndoActionCreators.redo
})(StepList)
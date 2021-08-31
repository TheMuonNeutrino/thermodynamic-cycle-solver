import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { steps_updateProperties } from '../actions';
import {VictoryLine,VictoryChart,VictoryScatter, VictoryCursorContainer, VictoryLabel, VictoryAxis} from 'victory';
import { generatePlotLineDataPV } from '../generatePlotLineData';
import { numToSSColumn } from '../Utils';

const DraggablePoint = (params) =>{

    var canvasDraggable = params.datum.canvasDraggable
    var mouseLoc = params.datum.mouseLoc
    var posSetter = params.datum.posSetter

    var [draggable, setDraggable] = React.useState(false)
    var [hover, setHover] = React.useState(false)

    useEffect(()=>{
        if (!canvasDraggable && draggable){
            setDraggable(false)
        }
    },[canvasDraggable,draggable])

    useEffect(()=>{
        if (draggable){
            posSetter(mouseLoc.x, mouseLoc.y)
        }
    },[mouseLoc,draggable,posSetter])

    return(
        <circle
            cx={params.x}
            cy={params.y}
            r={4}
            fill={(draggable || hover) ? 'gold':"#c43a31"}
            onMouseDown={(e)=>{setDraggable(true)}}
            onMouseOver={()=>{setHover(true)}}
            onMouseOut={()=>{setHover(false)}}
        />
    )
}

const Plot = ({steps,system,steps_updateProperties}) =>{

    const [canvasDraggable,setCanvasDraggable] = React.useState(false)
    const [mouseLoc, setMouseLoc] = React.useState({x: null, y: null})

    const [maxX, setMaxX] = React.useState(0.1)
    const [maxY, setMaxY] = React.useState(500000)

    const posSetter = (index) => {
        return (x,y)=>{
            steps_updateProperties(index,{pressure: y, volume: x})
        }
    }
    
    var dataLines = generatePlotLineDataPV(steps,system)

    var dataPoints = steps.map((step,index)=>{
        return {
            x:step.volume,
            y:step.pressure,
            posSetter: posSetter(index), 
            canvasDraggable: canvasDraggable,
            mouseLoc: mouseLoc,
            index: index,
        }
    })

    useEffect(()=>{
        const getMaxX = () => {return Math.max(...steps.map((step)=>{return step.volume}))}
        const getMaxY = () => {return Math.max(...steps.map((step)=>{return step.pressure}))}
        if (!canvasDraggable){
            setMaxX(getMaxX())
            setMaxY(getMaxY())
        }
        if (canvasDraggable && mouseLoc.x > maxX*1.06){
            setMaxX(getMaxX())
        }
        if (canvasDraggable && mouseLoc.y > maxY*1.06){
            setMaxY(getMaxY())
        }
    },[steps,canvasDraggable,mouseLoc,maxX,maxY])

    return(
        <div {...{style: {width: '500px', height: '500px'}}}>
            <VictoryChart 
                height={500}
                width={500}
                padding={{top: 20, bottom: 60, left: 100, right: 20}}
                minDomain = {{x:0, y:0}}
                maxDomain = {{x: maxX*1.1, y: maxY*1.1}}
                events={[{
                    target: 'parent',
                    eventHandlers: {
                        onMouseDown: ()=>{setCanvasDraggable(true)},
                        onMouseUp: ()=>{setCanvasDraggable(false)},
                    }
                }]}
                containerComponent={
                    <VictoryCursorContainer
                        onCursorChange={(value,props) => {
                            if (value !== null){
                                setMouseLoc({x:value.x,y:value.y})
                            }
                        }}
                        cursorComponent={<div></div>}
                    />
                }
            >
                {dataLines.map((line)=>{
                    return (<VictoryLine
                        interpolation={'linear'} 
                        data={line}
                        style={{ data: { stroke: "#c43a31" } }}
                        key={line[0]}
                    />)
                })}
                
                <VictoryScatter 
                    data={dataPoints}
                    dataComponent={
                        <DraggablePoint />
                    }
                    labels={[]}
                    labelComponent={
                        <VictoryLabel
                            text={({datum})=>{
                                if (datum !== undefined){
                                    return numToSSColumn(datum.index+1)
                                }
                            }}
                            dx={10}
                            textAnchor='middle'
                            verticalAnchor = 'middle'
                        />
                    }
                />
                <VictoryAxis 
                    label='Volume (m^3)'
                    style = {{axisLabel: {padding: 33}}}
                />
                <VictoryAxis 
                    dependentAxis
                    label='Pressure (Pa)'
                    style = {{axisLabel: {padding: 78}}}
                />
            </VictoryChart>
        </div>
    )
}

var mapStateToProps = (state)=>{
    return(state)
}

export default connect(mapStateToProps,{steps_updateProperties})(Plot)
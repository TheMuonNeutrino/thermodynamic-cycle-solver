import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { steps_updateProperties } from '../actions';
import {VictoryLine,VictoryChart,VictoryScatter, VictoryCursorContainer, VictoryLabel, VictoryAxis} from 'victory';
import { hasDefinedKey, numToSSColumn } from '../Utils';

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

const Plot = ({
    steps,system,steps_updateProperties,
    xkey,ykey,xlabel,ylabel,
    dataPointsGenerator
}) =>{

    for (var i=0; i<steps.length; i++){
        if (hasDefinedKey(steps[i],'staticEntropy')){
            steps[i].entropy = steps[i].staticEntropy
        }
    }

    const [canvasDraggable,setCanvasDraggable] = React.useState(false)
    const [mouseLoc, setMouseLoc] = React.useState({x: null, y: null})

    const [minX, setMinX] = React.useState(0)
    const [maxX, setMaxX] = React.useState(0.1)
    const [maxY, setMaxY] = React.useState(500000)

    const posSetter = (index) => {
        return (x,y)=>{
            var update = {}
            if (xkey === 'entropy'){
                if (hasDefinedKey(steps[index],'staticEntropy')){
                    update.staticEntropy = x
                }
            }
            update[xkey] = x
            update[ykey] = y
            var dragPointGroup = {index: index, xkey: xkey}
            steps_updateProperties(index,update,dragPointGroup)
        }
    }
    
    var dataLines = dataPointsGenerator(steps,system)

    var dataPoints = steps.map((step,index)=>{
        return {
            x:step[xkey],
            y:step[ykey],
            posSetter: posSetter(index), 
            canvasDraggable: canvasDraggable,
            mouseLoc: mouseLoc,
            index: index,
        }
    })

    var minDomain
    if (xkey === 'entropy'){
        minDomain = {x:minX-(0.1*(maxX-minX)), y:0}
    }else{
        minDomain = {x: 0, y: 0}
    }
    var maxDomain = {x: maxX+(0.1*(maxX-minX)), y: maxY*1.1}

    useEffect(()=>{
        const getArrayX = () => {return steps.map((step)=>{return step[xkey]})}
        const getMaxY = () => {return Math.max(...steps.map((step)=>{return step[ykey]}))}
        const arrayX = getArrayX()
        if (xkey === 'entropy'){
            if (!canvasDraggable){
                setMinX(Math.min(...arrayX))
            }
            if (canvasDraggable && mouseLoc.x < minX*1.06){
                setMinX(Math.min(...arrayX))
            }
        }
        if (!canvasDraggable){
            setMaxX(Math.max(...arrayX))
            setMaxY(getMaxY())
        }
        if (canvasDraggable && mouseLoc.x > maxX*1.06){
            setMaxX(Math.max(...arrayX))
        }
        if (canvasDraggable && mouseLoc.y > maxY*1.06){
            setMaxY(getMaxY())
        }
    },[steps,canvasDraggable,mouseLoc,maxX,maxY,minX,xkey,ykey])

    return(
        <div {...{style: {width: '100%', height: '100%'}}}>
            <VictoryChart 
                height={500}
                width={500}
                padding={{top: 20, bottom: 60, left: 100, right: 20}}
                minDomain = {minDomain}
                maxDomain = {maxDomain}
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
                    label={xlabel}
                    style = {{axisLabel: {padding: 33}}}
                />
                <VictoryAxis 
                    dependentAxis
                    label={ylabel}
                    style = {{axisLabel: {padding: 78}}}
                />
            </VictoryChart>
        </div>
    )
}

var mapStateToProps = (state)=>{
    return(state.present)
}

export default connect(mapStateToProps,{steps_updateProperties})(Plot)
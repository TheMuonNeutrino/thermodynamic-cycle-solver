import React from 'react';
import { generatePlotLineDataPV, generatePlotLineDataST } from '../generatePlotLineData';
import StepList from './StepList';
import ThermodynamicsPlot from './ThermodynamicsPlot';
import './App.css'

const App = () => {
    
    return(
        <div className='grid-container'>
            <div className='grid-itemA'>
                <ThermodynamicsPlot 
                    xkey='volume'
                    ykey='pressure'
                    xlabel='Volume (m^3)'
                    ylabel='Pressure (Pa)'
                    dataPointsGenerator={generatePlotLineDataPV}
                />
            </div>
            <div className='grid-itemB'>
                <ThermodynamicsPlot 
                    xkey='entropy'
                    ykey='temperature'
                    xlabel='Entropy (J/K)'
                    ylabel='Temperature (K)'
                    dataPointsGenerator={generatePlotLineDataST}
                />
            </div>
            <div className='grid-itemMain'>
                <StepList />
            </div>
        </div>
    )
}

export default App
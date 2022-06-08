import React from 'react';
import { generatePlotLineDataPV, generatePlotLineDataST } from '../generatePlotLineData';
import StepList from './StepList';
import ThermodynamicsPlot from './ThermodynamicsPlot';
import './App.css'
import { Button, Icon, Header, Menu, Image, Popup } from 'semantic-ui-react';
import logo from '../assets/logo512.png'
import MathJax from 'react-mathjax'

const App = () => {

    const [showHelp, setShowHelp] = React.useState(false)
    const [showAbout, setShowAbout] = React.useState(false)
    
    return(
        <div>
            <div className='ui container'>
                <div id="header-container">
                    <Header size='huge'>
                        <Image circular src={logo}/>
                        Thermodynamic Cycle Solver
                        <Button floated='right' as='a' href='https://github.com/TheMuonNeutrino/thermodynamic-cycle-solver'>
                            <Icon name='github'/> GitHub
                        </Button>
                        <Button floated='right'
                            onClick = {()=>{setShowAbout(!showAbout);setShowHelp(false)}}
                        >
                            About
                        </Button>
                        <Popup
                            on='click'
                            trigger={
                                <Button floated='right'>
                                    <Icon name='question'/> Help
                                </Button>
                            }
                            content={<p>Keyboard shortcuts: <br/>Ctrl+Z to undo <br/> Ctrl + Y to redo</p>}
                            onOpen={()=>{setShowHelp(true);setShowAbout(false)}}
                            onClose={()=>{setShowHelp(false)}}
                            size='large'
                        />
                        <br/>
                    </Header>                
                </div>
            </div>
            {showAbout ?
                <MathJax.Provider>
                    <div className='ui container' style={{fontSize: 'large'}}>
                        <p>
                            This app is designed to provide insight into various thermodynamic cycles, providing
                            an interactive interface within which to explore these. The thermodynamic model used
                            applies specifically to ideal gases.
                        <br/>
                            Most central to this are the pair of contraint equations used in computing the position
                            of the points:
                        </p>
                        <MathJax.Node formula='PV=nRT'/>
                        <MathJax.Node 
                            formula={`exp(\\frac{\\Delta S}{n}) = \\left(  \\frac{T_2}{T_1}  \\right)^{C_v}
                            \\left(  \\frac{V_2}{V_1}  \\right)^R = \\left(  \\frac{P_2}{P_1}  \\right)^{C_V} 
                            \\left(  \\frac{V_2}{V_1}  \\right)^{(C_V + R)}`}
                        />
                        <p>
                            where <MathJax.Node inline formula='P'/> is pressure, <MathJax.Node inline formula='V'/> is
                            volume, <MathJax.Node inline formula='T'/> is temperature, <MathJax.Node inline formula='n'/> is
                            the number of moles in the system, <MathJax.Node inline formula='R'/> is the gas constant, &nbsp;
                            <MathJax.Node inline formula='\Delta S'/> is the entropy change for the step and &nbsp;
                            <MathJax.Node inline formula='C_v' /> is the isochoric heat capacity of the system.
                        </p>
                        <p>
                            Additionally, constraints must be applied to each step which correspond to its type and
                            take the form of a conserved quantity: pressure for isobaric steps, volume for isochoric steps,
                            temperature for isothermal steps and entropy for isentropic steps. When updating a particular
                            point, only its neighbours are repositioned. To compute the new position of the neighbouring
                            point, two parameters of the set <MathJax.Node inline formula='\{P,V,T,S\}'/> must be computed for
                            the point. One of these will be contributed by the conserved quantity from the prior step and
                            the other by the conserved quantity for the subsequent step.
                        </p>
                        <p>
                            Consider for example: A &#8594; B is an isobaric step, B &#8594; C is an isentropic step. When A is
                            repositioned, the pressure at B will be set equal to the pressure at A, while the entropy
                            change between B and C will be set to zero. The second equation above will then be used to
                            compute the volume and temperature at B, populating <MathJax.Node inline formula='P_2'/>,
                            <MathJax.Node inline formula='V_2'/> and <MathJax.Node inline formula='T_2'/>
                            with the values at point C.
                        </p>
                        <p>
                            This project is built in ReactJS. Notably, the following libraries were used: react-redux,
                            react-mathjax, semantic-ui-react, react-sortablejs and victory (charting and data visualisation).
                            <br/>
                            Copyright &#169; Marek Cottingham 2021. 
                            <br/>Licensed under GNU GPL-3.0-or-later.
                        </p>

                    </div>
                </MathJax.Provider>
            :null}
            <div className='grid-container'>
                <div className='grid-itemA'>
                    <Popup
                        trigger={
                            <ThermodynamicsPlot 
                                xkey='volume'
                                ykey='pressure'
                                xlabel='Volume (m^3)'
                                ylabel='Pressure (Pa)'
                                dataPointsGenerator={generatePlotLineDataPV}
                            />

                        }
                        content={
                            <p>
                                Drag and drop points on either graph in order to modify the cycle
                                <br/>
                                <b>Close the help screen first</b>
                            </p>
                        }
                        open={showHelp}
                        position='left center'
                        size='large'
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
                    <StepList
                        showHelp={showHelp}
                        setShowHelp={setShowHelp}
                    />
                </div>
            </div>
        </div>
    )
}

export default App
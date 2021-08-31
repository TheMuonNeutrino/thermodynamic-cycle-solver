import React from 'react';
import StepList from './StepList';
import ThermodynamicsPlot from './ThermodynamicsPlot';

const App = () => {
    
    return(
        <div className=''>
            <div>
                <ThermodynamicsPlot />
            </div>
            <StepList />
        </div>
    )
}

export default App
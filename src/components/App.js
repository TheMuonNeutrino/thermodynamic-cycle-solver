import React from 'react';
import StepList from './StepList';

const App = () => {
    
    return(
        <div className=''>
            <div>
                <canvas className='pv diagram'>

                </canvas>
                <canvas className='st diagram'>

                </canvas>
            </div>
            <StepList />
        </div>
    )
}

export default App
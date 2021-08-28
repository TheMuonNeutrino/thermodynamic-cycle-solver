import React from 'react';
import StepListItem from './StepListItem';

const App = () => {
    
    return(
        <div className=''>
            <div>
                <canvas className='pv diagram'>

                </canvas>
                <canvas className='st diagram'>

                </canvas>
            </div>
            <StepListItem />
        </div>
    )
}

export default App
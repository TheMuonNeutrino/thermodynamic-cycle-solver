import React from 'react';

class App extends React.Component{
    constructor(props){
        super(props)
        this.state = {steps: []}
    }
    render(){
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
}

export default App
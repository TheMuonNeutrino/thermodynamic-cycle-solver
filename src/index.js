import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.js'
import {Provider} from 'react-redux'
import {createStore} from 'redux'
import thermodynamicSystemReducer from './reducers'

ReactDOM.render(
  <Provider store={createStore(thermodynamicSystemReducer)}>
    <App />
  </Provider>
    ,
  document.getElementById('root')
);
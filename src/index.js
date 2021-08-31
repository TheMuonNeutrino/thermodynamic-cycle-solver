import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.js'
import {Provider} from 'react-redux'
import {createStore} from 'redux'
import thermodynamicSystemReducer from './reducers'
import { setPreset } from './actions/setPreset.js';

const store = createStore(thermodynamicSystemReducer)
store.dispatch(setPreset('carnotCycle'))

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
    ,
  document.getElementById('root')
);
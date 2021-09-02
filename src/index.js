import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.js'
import {Provider} from 'react-redux'
import {createStore} from 'redux'
import thermodynamicSystemReducer from './reducers'
import { setPreset } from './actions/setPreset.js';
import undoable, { ActionCreators as UndoActionCreators } from 'redux-undo';
import { hasDefinedKey } from './Utils.js';

const store = createStore(undoable(thermodynamicSystemReducer,{groupBy: (action,currentState,previousHistory)=>{
  if (hasDefinedKey(action,'groupBy')){
    if (action.groupBy === null){return null}
    return `${action.groupBy.index}-${action.groupBy.xkey}`
  }
  return null
}}))
store.dispatch(setPreset('carnotCycle'))
store.dispatch(UndoActionCreators.clearHistory())
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
  ,
  document.getElementById('root')
);
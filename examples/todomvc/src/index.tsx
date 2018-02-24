import React from 'react';
import ReactDOM from 'react-dom';
import 'todomvc-app-css/index.css';
import App from './App';
import RootCycle from './RootCycle';

ReactDOM.render(
  (
    <RootCycle>
      <App />
    </RootCycle>
  ),
  document.getElementById('root') as HTMLElement
);

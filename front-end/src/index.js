// Bar and Line Composite Chart component for the front end application
// COMP90024 Assignment 2 2020
//
// Jock Harkness 758158
// Thomas Minuzzo 638958
// Cameron Dempsey 759026
// Emily Marshall 587580
// Hoang Viet Mai 813361
//
// Renders the root App.js component

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import "leaflet/dist/leaflet.css";
import "./styles.css";

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();

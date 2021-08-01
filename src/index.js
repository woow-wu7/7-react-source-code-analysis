// import React from 'react';
// import ReactDOM from 'react-dom';
import * as React from 'react'; // 这里能够引用到，是因为在webpack.config.js中的resolve.alias中指定了别名的引用路径
import * as ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
    <div>App</div>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

var React = require('react');
global.React = React;
var ReactDom = require('react-dom');

var TodoApp = require('./components/todo_app');

ReactDom.render(<TodoApp />, document.getElementById('todoapp'));

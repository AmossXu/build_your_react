import './index.css'
import Chaos from './Chaos'

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// )
// const element = Chaos.createElement(
//   'div',
//   { id: 'foo' },
//   Chaos.createElement("a", null, "bar"),
//   Chaos.createElement("b")
// )

/** @jsx Chaos.createElement */
// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// )

/** @jsx Chaos.createElement */
function App(props) {
  return <h1>Hello {props.name}</h1>
}

const element = <App name='amos' />
const container = document.getElementById('root')

Chaos.render(element, container)
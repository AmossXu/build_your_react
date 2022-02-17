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
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById('root')

Chaos.render(element, container)
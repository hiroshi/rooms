import React, { Component } from 'react'
import ActionCable from 'actioncable'
import logo from './logo.svg'
import './App.css'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {}
    fetch('/health')
      .then((res) => {
        return res.text()
      })
      .then((text) => {
        this.setState({health: text})
      })
      .catch((err) => {
        this.setState({health: err.message})
      })

    this.cable = ActionCable.createConsumer()
    this.subscription = this.cable.subscriptions.create(
      'ChatChannel',
      {
        connected: (data) => {
          console.log(data)
        }
      })
  }

  push = () => {
    this.subscription.perform('hoge', {fuga: this.input.value})
  }

  render () {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <p>health: { this.state.health }</p>
        <div>
          <input type='text' ref={(x) => {this.input = x}} />
          <button onClick={this.push}>push</button>
        </div>
      </div>
    )
  }
}

export default App

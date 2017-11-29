import React, { Component } from 'react'
import ActionCable from 'actioncable'
import logo from './logo.svg'
import './App.css'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {messages:[]}
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
      'MessageChannel',
      {
        connected: (data) => {
          console.log('connected: ' + data)
        },
        received: (message) => {
          console.log('received:', message)
          this.state.messages.push(message)
          this.setState({messages: this.state.messages})
        }
      })
  }

  push = () => {
    this.subscription.perform('push', {content: this.input.value})
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
        <ul>
          {
            this.state.messages.map((message) => {
              return <li key={message.id}>{message.content}</li>
            })
          }
        </ul>
      </div>
    )
  }
}

export default App

import React, { Component } from 'react'
import ActionCable from 'actioncable'
import logo from './logo.svg'
import './App.css'

class Messages extends Component {
  constructor (props) {
    super(props)
    this.state = {messages: []}
    this.subscription = this.props.cable.subscriptions.create(
      'MessageChannel',
      {
        connected: (data) => {
          console.log('connected: ' + data)
        },
        received: (messages) => {
          // console.log('received:', messages)
          this.setState({messages: messages})
        }
      })
  }

  push = () => {
    this.subscription.perform('push', {content: this.input.value})
  }

  render () {
    return (
      <div>
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
        <Messages cable={this.cable} />
      </div>
    )
  }
}

export default App

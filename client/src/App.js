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
      <div className='tile is-child box'>
        <div className='field has-addons'>
          <div className='control is-expanded'>
            <input type='text' ref={(x) => {this.input = x} } className='input' />
          </div>
          <div className='control'>
            <button onClick={this.push} className='button is-primary'>push</button>
          </div>
        </div>
        <div>
          {
            this.state.messages.map((message) => {
              return (
                <div key={message.id} className='card'>
                  <div className='card-content'>
                    <p>{message.content}</p>
                    <div className='tags'>
                      <span className='tag'>done</span>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
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
      <div>
        <p>health: { this.state.health }</p>
        <div className='tile is-ancestor'>
          <div className='tile is-4 is-vertical is-parent'>
            <Messages cable={this.cable} />
          </div>
        </div>
      </div>
    )
  }
}

export default App

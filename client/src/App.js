import React, { Component } from 'react'
import ActionCable from 'actioncable'
// import logo from './logo.svg'
import './App.css'

class MessageEdit extends Component {
  constructor (props) {
    super(props)
    this.subscription = this.props.cable.subscriptions.create(
      {channel: 'MessageChannel', id: this.props.message.id}
    )
  }

  save = () => {
    console.log(this.textarea.value)
    this.subscription.perform('save', {id: this.props.message.id, content: this.textarea.value})
  }

  render () {
    let message = this.props.message
    return (
      <div key={message.id} className='card'>
        <textarea className='textarea' defaultValue={message.content} ref={x => this.textarea = x} />
        <button className='button is-primary' onClick={this.save}>Save</button>
      </div>
    )
  }
}

class Messages extends Component {
  constructor (props) {
    super(props)
    this.state = {messages: []}
    this.subscription = this.props.cable.subscriptions.create(
      'MessagesChannel',
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
            <input type='text' ref={x => this.input = x} className='input' />
          </div>
          <div className='control'>
            <button onClick={this.push} className='button is-primary'>push</button>
          </div>
        </div>
        <div>
          {
            this.state.messages.map((message) => {
              return (
                <div key={message.id} className='card' onClick={ () => this.props.editMessage(message) }>
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

  editMessage = (message) => {
    this.setState({message: message})
  }

  render () {
    return (
      <div>
        <p>health: { this.state.health }</p>
        <div className='tile is-ancestor'>
          <div className='tile is-4 is-vertical is-parent'>
            <Messages cable={this.cable} editMessage={this.editMessage} />
          </div>
          <div className='tile is-4 is-vertical is-parent'>
            { this.state.message && <MessageEdit cable={this.cable} message={this.state.message} /> }
          </div>
        </div>
      </div>
    )
  }
}

export default App

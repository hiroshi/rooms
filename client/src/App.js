import React, { Component } from 'react'
import ActionCable from 'actioncable'
import './App.css'

class InputButton extends Component {
  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.push()
    }
  }

  push = () => {
    this.props.action(this.input.value)
  }

  render () {
    return (
      <div className='field has-addons'>
        <div className='control is-expanded'>
          <input
            type='text'
            placeholder={this.props.placeholder}
            ref={x => this.input = x}
            onKeyPress={this.handleKeyPress}
            className='input' />
        </div>
        <div className='control'>
          <button onClick={this.push} className='button is-primary'>{this.props.buttonText}</button>
        </div>
      </div>
    )
  }
}

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
        <textarea className='textarea' defaultValue={message.content} ref={x => this.textarea = x}></textarea>
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
        received: (info) => {
          if (info.refresh) {
            this.subscription.perform('query', {query: this.state.query})
          }
          if (info.messages) {
            this.setState({messages: info.messages})
          }
        }
      })
  }

  query = (value) => {
    this.setState({query: value})
    this.subscription.perform('query', {query: value})
  }

  push = (value) => {
    this.subscription.perform('push', {content: value})
  }

  render () {
    return (
      <div className='tile is-child box'>
        <InputButton buttonText='query' action={this.query} />
        <InputButton buttonText='new' action={this.push} />
        <div>
          {
            this.state.messages.map((message) => {
              return (
                <div key={message.id} className='card' onClick={ () => this.props.editMessage(message) }>
                  <div className='card-content'>
                    <p>{message.content}</p>
                    <div className='tags'>
                      {
                        message.meta.tags && message.meta.tags.map((tag) => {
                          return <span key={tag} className='tag is-info'>{tag}</span>
                        })
                      }
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

import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import ActionCable from 'actioncable'
import './App.css'

class InputButton extends Component {
  constructor (props) {
    super(props)
    this.state = {value: props.value}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({value: nextProps.value})
  }

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.push()
    }
  }

  push = () => {
    this.props.action(this.input.value)
    if (this.props.clearAfterAction) {
      this.input.value = ''
    }
  }

  onChange = (e) => {
    this.setState({value: e.target.value})
  }

  render () {
    return (
      <div className='field has-addons'>
        <div className='control is-expanded'>
          <input
            type='text'
            value={this.state.value}
            placeholder={this.props.placeholder}
            ref={x => this.input = x}
            onKeyPress={this.handleKeyPress}
            onChange={this.onChange}
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
    let query = props.location.hash.substring(1)
    // console.log("initialQuery: " + query)
    this.state = {messages: [], query: query}
    this.subscription = this.props.cable.subscriptions.create(
      {channel: 'MessagesChannel', query: query},
      {
        connected: (data) => {
          // console.log('connected: ' + data)
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

  componentWillReceiveProps(nextProps) {
    let nextQuery = nextProps.location.hash.substring(1)
    // console.log("nextQuery; " + nextQuery)
    if (this.state.query !== nextQuery) {
      this.setState({query: nextQuery})
      this.subscription.perform('query', {query: nextQuery})
    }
  }

  // shouldComponentUpdate(nextProps, nextState) {
    // let nextQuery = nextProps.location.hash.substring(1)
    // if (nextQuery !== nextState.query) {
    //   // this.query(nextQuery)
    //   console.log(nextQuery)
    //   this.setState({query: nextQuery})
    //   this.subscription.perform('query', {query: nextQuery})
    //   return true
    // }
  // }

  query = (value) => {
    this.setState({query: value})
    this.props.history.push({hash: value})
    this.subscription.perform('query', {query: value})
  }

  push = (value) => {
    this.subscription.perform('push', {content: value})
  }

  render () {
    return (
      <div className='tile is-child box'>
        <InputButton buttonText='query' placeholder='!done todo' value={this.state.query} action={this.query} />
        <InputButton buttonText='new' action={this.push} clearAfterAction={true} />
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
      <Router>
        <div>
          <p>health: { this.state.health }</p>
          <div className='tile is-ancestor'>
            <div className='tile is-6 is-vertical is-parent'>
              <Route path='/' render={props => {
                  return <Messages {...props} cable={this.cable} editMessage={this.editMessage} />
                }}/>
            </div>
            <div className='tile is-6 is-vertical is-parent'>
              { this.state.message && <MessageEdit cable={this.cable} message={this.state.message} /> }
            </div>
          </div>
        </div>
      </Router>
    )
  }
}

export default App

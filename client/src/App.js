import React, { Component } from 'react'
// import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
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
    // console.log(this.textarea.value)
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
    let query = this.getQueryFromLocation(props.location)
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
    let nextQuery = this.getQueryFromLocation(nextProps.location)
    if (this.state.query !== nextQuery) {
      this.setState({query: nextQuery})
      this.subscription.perform('query', {query: nextQuery})
    }
  }

  getQueryFromLocation(location) {
    let params = new URLSearchParams(location.search)
    return params.get('q') || ''
  }

  query = (value) => {
    this.setState({query: value})
    let params = new URLSearchParams({q: value})
    this.props.history.push({search: params.toString()})
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

    this.subscription = this.cable.subscriptions.create(
      {channel: 'CurrentUserChannel'},
      {
        connected: (data) => {
          console.log("current_user connected: " + data)
        },
        received: (data) => {
          console.log("current_user received: " + JSON.stringify(data))
          this.setState({current_user_id: data.id})
        }
      }
    )
  }

  editMessage = (message) => {
    this.setState({message: message})
  }

  render () {
    let user = this.state.current_user_id
        ? <p>current_user: {this.state.current_user_id}</p>
        : <p><a href='/auth/github'>login</a></p>
    return (
      <Router>
        <div>
          <p>health: { this.state.health }</p>
          { user }
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

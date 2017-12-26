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
    let params = this.getQueryParamsFromLocation(props.location)
    this.state = {messages: [], params: params}
    this.subscription = this.props.cable.subscriptions.create(
      Object.assign({channel: 'MessagesChannel'}, params),
      {
        connected: (data) => {
          // console.log('connected: ' + data)
        },
        received: (info) => {
          if (info.refresh) {
            this.subscription.perform('query', this.state.params)
          }
          if (info.messages) {
            this.setState({messages: info.messages})
          }
        }
      })
  }

  componentWillReceiveProps(nextProps) {
    let nextParams = this.getQueryParamsFromLocation(nextProps.location)
    if (JSON.stringify(this.state.params) !== JSON.stringify(nextParams)) {
      this.setState({params: nextParams})
      this.subscription.perform('query', nextParams)
    }
  }

  getQueryParamsFromLocation(location) {
    let params = {}
    for (let pair of new URLSearchParams(location.search)) {
      params[pair[0]] = pair[1]
    }
    return params
  }

  query = (value) => {
    let params = this.state.params
    params.q = value
    this.setState({params: params})
    let urlParams = new URLSearchParams(this.props.location.search)
    urlParams.set('q', value)
    this.props.history.push({search: urlParams.toString()})
    this.subscription.perform('query', params)
  }

  push = (value) => {
    this.subscription.perform('push', {content: value})
  }

  render () {
    return (
      <div className='tile is-child box'>
        <InputButton buttonText='query' placeholder='!done todo' value={this.state.params.q} action={this.query} />
        <InputButton buttonText='new' action={this.push} clearAfterAction={true} />
        <div>
          {
            this.state.messages.map((message) => {
              return (
                <div key={message.id} className='card' onClick={ () => this.props.editMessage(message) }>
                  <div className='card-content'>
                    <p>{message.content}</p>
                    <div className='tags'>
                      <span key='@user' className="tag is-dark">@{ message.user.name }</span>
                      {
                        message.meta.tags && message.meta.tags.map((tag) => {
                          return <span key={tag} className='tag is-info'>#{tag}</span>
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
        received: (user) => {
          console.log("current_user received: " + JSON.stringify(user))
          this.setState({current_user: user})
        }
      }
    )
  }

  editMessage = (message) => {
    this.setState({message: message})
  }

  render () {
    let user = this.state.current_user
        ? <p>current_user: {this.state.current_user.name}</p>
        : <p><a href='/auth/github'>login</a></p>
    return (
      <Router>
        <div>
          <p>api health: { this.state.health }</p>
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

import React, { Component } from 'react'
import classNames from 'classnames'
// import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import ActionCable from 'actioncable'
import moment from 'moment'
import './App.css'


function getQueryParamsFromLocation(location) {
  let params = {}
  for (let pair of new URLSearchParams(location.search)) {
    params[pair[0]] = pair[1]
  }
  return params
}


class InputButton extends Component {
  constructor (props) {
    super(props)
    this.state = {value: props.value || ''}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({value: nextProps.value || ''})
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.input.setSelectionRange(0, 0)
    }
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

  toggleFocus = (focus) => {
    this.props.toggleFocus && this.props.toggleFocus(focus)
  }

  render () {
    return (
      <div className='field has-addons'>
        <div className='control is-expanded'>
          <input
            type='text'
            autoCapitalize='off'
            autoFocus={this.props.autoFocus}
            value={this.state.value}
            placeholder={this.props.placeholder}
            ref={x => this.input = x}
            onKeyPress={this.handleKeyPress}
            onChange={this.onChange}
            onFocus={() => this.toggleFocus(true)}
            onBlur={() => this.toggleFocus(false)}
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
    this._subscribe(props)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.message.id !== nextProps.message.id) {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
      this._subscribe(nextProps)
    }
  }

  _subscribe (props) {
    this.subscription = props.cable.subscriptions.create(
      {channel: 'MessageChannel', id: props.message.id}
    )
  }

  save = () => {
    // console.log(this.textarea.value)
    this.subscription.perform('update', {id: this.props.message.id, content: this.textarea.value})
  }

  render () {
    let message = this.props.message
    return (
      <div className='box'>
        <div key={message.id} className='card field'>
          <textarea className='textarea' defaultValue={message.content} ref={x => this.textarea = x}></textarea>
          <button className='button is-primary' onClick={this.save}>Save</button>
        </div>
        <Messages cable={this.props.cable} params={{room: this.props.message.room_id, q: '/p' + message.id}} />
      </div>
    )
  }
}

class Message extends Component {
  render () {
    let message = this.props.message
    return (
      <div className='card' onClick={ () => this.props.onSelect(message) }>
        <div className='card-content break-word'>
          <p>{message.content.split("\n")[0]}</p>
          <ul>
            {
              message.meta.urls && message.meta.urls.map((url) => {
                return <li key={url}><a target='_blank' href={url}>{url}</a></li>
              })
            }
          </ul>
          <div className='tags'>
            <span key='@user' className="tag">@{ message.user.name }</span>
            <span key='_created_at' className="tag" title={message.created_at} >{ moment(message.created_at).fromNow() }</span>
            {
              message.ancestors.length > 0 &&
                <span key='ancestor' className='tag is-warning'>{message.ancestors.length} ancestors</span>
            }
            {
              message.descendants.length > 0 &&
                  <span key='descendants' className='tag is-warning'>{message.descendants.length} children</span>
            }
            {
              message.meta.tags && message.meta.tags.map((tag, n) => {
                return <span key={tag + '-' + n} className='tag is-info'>#{tag}</span>
              })
            }
            {
              this.props.noTags.map((tag) => {
                return <span key={tag} className='tag button is-primary' onClick={(e) => {e.stopPropagation(); this.props.addTag(message.id, tag)}}>{tag}</span>
              })
            }
          </div>
        </div>
      </div>
    )
  }
}

class Messages extends Component {
  constructor (props) {
    super(props)
    this.state = {messages: []}
    this._subscribe(props)
  }

  componentWillReceiveProps (nextProps) {
    if (this.subscription && nextProps.params.q === this.props.params.q) {
      return
    }
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this._subscribe(nextProps)
  }

  _subscribe (props) {
    if (!props.params.room) {
      return
    }
    this.subscription = props.cable.subscriptions.create(
      Object.assign({channel: 'MessagesChannel'}, props.params),
      {
        connected: (data) => {
          console.log('messages connected: params' + JSON.stringify(props.params))
        },
        rejected: (data) => {
          console.log('messages rejected: ' + JSON.stringify(props.params))
        },
        received: (info) => {
          if (info.refresh) {
            this.subscription.perform('query', props.params)
          }
          if (info.messages) {
            this.setState(info)
          }
        }
      })
  }

  componentWillUnmount () {
    this.subscription.unsubscribe()
  }

  addTag = (id, tag) => {
    this.subscription.perform('add_tag', {id: id, tag: tag})
  }

  openNewMessage = () => {
    this.setState({newMessage: true})
  }

  push = (value) => {
    this.subscription.perform('create', {content: value, parent_id: this.state.query.parent_ids[0]})
    this.setState({newMessage: false})
  }

  render () {
    return (
      <div>
        <div className='field is-grouped is-grouped-multiline'>
          <div className='control'>
            <div className='tags has-addons'>
              <span className="tag">count</span>
              <span className="tag is-info">{this.state.count}</span>
            </div>
          </div>
          {
            this.state.newMessage
              ? <span className="tag button is-warning" onClick={() => this.setState({newMessage: false})}>cancel new message</span>
              : <span className="tag button is-primary" onClick={this.openNewMessage}>new message</span>
          }
        </div>
        {
          this.state.newMessage &&
            <InputButton buttonText='new' action={this.push} clearAfterAction={true} autoFocus={true} value={this.state.query.tags.map((t) => " #" + t)} />
        }
        {
          this.state.messages.map((message) => {
            return <Message key={message.id} message={message} noTags={this.state.query.no_tags} addTag={this.addTag} onSelect={this.props.onSelect}/>
          })
        }
      </div>
    )
  }
}

class MessagesFilter extends Component {
  constructor (props) {
    super(props)
    let params = getQueryParamsFromLocation(props.location)
    this.state = {params: params, histories: []}
  }

  componentWillReceiveProps(nextProps) {
    let nextParams = getQueryParamsFromLocation(nextProps.location)
    if (JSON.stringify(this.state.params) !== JSON.stringify(nextParams)) {
      this.setState({params: nextParams})
      // this.subscription.perform('query', nextParams)
    }
  }

  query = (q) => {
    let params = Object.assign({}, this.state.params)
    params.q = q
    this.setState({params: params})
    let urlParams = new URLSearchParams(this.props.location.search)
    urlParams.set('q', q)
    this.props.history.push({search: urlParams.toString()})
    // this.subscription.perform('query', params)
  }

  title () {
    let title = this.state.params.q
    if (title !== '') {
      title += ' - '
    }
    title += 'room/' + this.state.params.room
    return title
  }

  toggleFocus = (focus) => {
    if (focus) {
      this.subscription = this.props.cable.subscriptions.create(
        Object.assign({channel: 'QueryHistoriesChannel'}, this.state.params),
        {
          received: (info) => {
            this.setState(info)
          }
        }
      )
    } else {
      this.subscription.unsubscribe()
      // this.setState({histories: []})
    }
    setTimeout(() => this.setState({focus: focus}), 100)
  }

  render () {
    document.title = this.title()
    let dropdownClassNames = classNames({
      dropdown: true,
      'is-block': true,
      'is-active': this.state.focus
    })
    return (
      <div className='tile is-child box'>
        <div className={ dropdownClassNames }>
          <InputButton buttonText='query' placeholder='todo !done' value={this.state.params.q} action={this.query} toggleFocus={this.toggleFocus} />
          <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
              {
                this.state.histories.map((message) => {
                  let q = message.first_line
                  let urlParams = new URLSearchParams(this.props.location.search)
                  urlParams.set('q', q)
                  return (
                    <a key={message.id} href={'?' + urlParams.toString()} onClick={(e) => {e.preventDefault(); this.query(q)}} className="dropdown-item">
                      {message.first_line}
                    </a>
                  )
                })
              }
            </div>
          </div>
        </div>
        <Messages cable={this.props.cable} params={Object.assign({save: true}, this.state.params)} onSelect={this.props.editMessage} />
      </div>
    )
  }
}

class Rooms extends Component {
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
          let urlParams = new URLSearchParams(this.props.location.search)
          if (!urlParams.get('room')) {
            urlParams.set('room', user.rooms[0].id)
            this.props.history.replace({search: urlParams.toString()})
          }
          console.log("current_user received: " + JSON.stringify(user))
          this.setState({current_user: user})
        }
      }
    )
  }

  editMessage = (message) => {
    this.setState({message: message})
  }

  user () {
    if (this.state.current_user) {
      return (
         <div className='tags has-addons'>
           <span className="tag">user</span>
           <span className="tag is-info">{this.state.current_user.name}</span>
         </div>
      )
    } else {
      return <a className='button' href='/auth/github'>login</a>
    }
  }

  render () {
    return (
      <div>
        <p>api health: { this.state.health }</p>
        <div className='tile is-parent'>
          <div className='tile is-child is-3'>
            { this.user() }
          </div>
        </div>
        <div className='tile is-ancestor'>
          <div className='tile is-parent'>
            <MessagesFilter {...this.props} cable={this.cable} editMessage={this.editMessage} />
          </div>
          <div className='tile is-vertical is-parent'>
            {
              this.state.message &&
                <MessageEdit cable={this.cable} message={this.state.message} />
            }
          </div>
        </div>
      </div>
    )
  }
}

const App = () => (
  <Router>
    <Route path='/' component={Rooms} />
  </Router>
)

export default App

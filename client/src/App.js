import React, { Component } from 'react'
import classNames from 'classnames'
// import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import ActionCable from 'actioncable'
import moment from 'moment'
import bowser from 'bowser'
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
          <textarea
            rows='2'
            autoCapitalize='off'
            autoFocus={this.props.autoFocus}
            value={this.state.value}
            placeholder={this.props.placeholder}
            ref={x => this.input = x}
            onKeyPress={this.handleKeyPress}
            onChange={this.onChange}
            onFocus={() => this.toggleFocus(true)}
            onBlur={() => this.toggleFocus(false)}
            className='textarea' />
        </div>
        <div className='control'>
          <button onClick={this.push} className='button is-primary'>{this.props.buttonText}</button>
        </div>
      </div>
    )
  }
}

class MessageEditModal extends Component {
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
    this.subscription.perform('update', {id: this.props.message.id, content: this.textarea.value})
    this.props.close()
  }

  tag = (tag) => {
    this.textarea.focus()
    let value = this.textarea.value + ' #' + (tag || '')
    this.textarea.value = value
    let len = value.length
    this.textarea.setSelectionRange(len, len)
  }

  render () {
    let message = this.props.message
    return (
      <div className='modal is-active'>
        <div className='modal-background' onClick={this.props.close}></div>
        <div className='modal-content'>
          <div className='box'>
            <div key={message.id} className='card field'>
              <textarea className='textarea' defaultValue={message.content} ref={x => this.textarea = x}></textarea>
              <button className='button is-primary' onClick={this.save}>Save</button>
            </div>
            <div className='field is-grouped is-grouped-multiline'>
              <div className='control'>
                <div className='tags has-addons'>
                  <span className="tag is-info">#todo</span>
                  <button className="tag is-delete"></button>
                </div>
              </div>
              <div className='control'>
                <span className='tag button is-primary' onClick={(e) => this.tag()}>#</span>
              </div>
            </div>
          </div>
        </div>
        <button className='modal-close is-large' aria-label='close' onClick={this.props.close}></button>
      </div>
    )
  }
}

// https://reactjs.org/docs/higher-order-components.html
function openMessageEditModal(cable, message, renderTrigger) {
  return class extends React.Component {
    constructor (props) {
      super(props)
      this.state = {}
    }

    toggle = (show) => {
      this.setState({show: show})
      if (bowser.ios) {
        if (show) {
          document.body.classList.add('ios-modal-fix')
        } else {
          document.body.classList.remove('ios-modal-fix')
        }
      }
    }

    render () {
      let modal = this.state.show && (
        <MessageEditModal key='modal' cable={cable} message={message} close={() => this.toggle(false)} />
      )
      return [
        renderTrigger(() => this.toggle(true)),
        modal
      ]
    }
  }
}

class Message extends Component {
  constructor (props) {
    super(props)
    this.state = {}
    this.hoverable = !bowser.mobile && !bowser.tablet
    let topRightButtonsClassNames = classNames({
      button: true,
      'is-small': true,
      'top-right': true,
      'hover-appear': this.hoverable
    })
    this.TopRightButtons = openMessageEditModal(props.cable, props.message, (showModal) => (
      <button key='trigger' className={topRightButtonsClassNames} onClick={showModal}>edit</button>
    ))
  }

  toggleEdit = (edit) => {
    this.setState({edit: edit})
    if (bowser.ios) {
      if (edit) {
        document.body.classList.add('ios-modal-fix')
      } else {
        document.body.classList.remove('ios-modal-fix')
      }
    }
  }

  render () {
    let message = this.props.message
    // NOTE: The do-nothing onClick handler make mobile safari hover the div
    let cardClassNames = classNames({card: true, hover: this.hoverable})
    let topRightButtons = (this.hoverable || this.props.selected) && <this.TopRightButtons />
    return (
      <div className={cardClassNames} onClick={this.props.select}>
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
        { topRightButtons }
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
            if (this.props.onQuery) {
              this.props.onQuery(info)
            }
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
            <InputButton buttonText='new' action={this.push} clearAfterAction={true} autoFocus={true} value={this.state.query.tags.map((t) => " #" + t).join('')} />
        }
        {
          this.state.messages.map((message) => {
            return <Message
                       key={message.id}
                       cable={this.props.cable}
                       message={message}
                       noTags={this.state.query.no_tags}
                       addTag={this.addTag}
                       selected={this.state.selectedMessageId === message.id}
                       select={() => this.setState({selectedMessageId: message.id})}
                       />
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

  onQuery = (info) => {
    // console.log(info)
    this.setState({room: info.room})
  }

  render () {
    document.title = this.title()
    let dropdownClassNames = classNames({
      dropdown: true,
      'is-block': true,
      'is-active': this.state.focus
    })
    let histories = this.state.histories.map((message) => {
      let q = message.first_line
      let urlParams = new URLSearchParams(this.props.location.search)
      urlParams.set('q', q)
      return (
        <a key={message.id} href={'?' + urlParams.toString()} onClick={(e) => {e.preventDefault(); this.query(q)}} className="dropdown-item">
          {message.first_line}&nbsp;
        </a>
      )
    })
    let room = this.state.room && (
          <div className='field'>
            <div className='tags has-addons'>
              <span className="tag">room</span>
              <span className="tag is-info">{this.state.room.name}</span>
            </div>
          </div>
    )

    return (
      <div className='tile is-child box'>
        { room }
        <div className={ dropdownClassNames }>
          <InputButton buttonText='query' placeholder='todo !done' value={this.state.params.q} action={this.query} toggleFocus={this.toggleFocus} />
          <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
              { histories }
            </div>
          </div>
        </div>
        <Messages
          cable={this.props.cable}
          params={Object.assign({save: true}, this.state.params)}
          onQuery={this.onQuery}
        />
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

  messageFilter () {
    if (!this.state.current_user) {
      return
    }
    return (
      <div className='tile is-parent is-6'>
        <MessagesFilter {...this.props} cable={this.cable} />
      </div>
    )
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
          { this.messageFilter() }
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

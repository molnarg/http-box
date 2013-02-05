var http         = require('http')
  , parse_url    = require('url').parse
  , EventEmitter = require("events").EventEmitter
  , _            = require('underscore')
  , util         = require('util')

function SimpleProxy(options) {
  this.options = options || {}

  this.request = this.request.bind(this)
}

util.inherits(SimpleProxy, EventEmitter);

SimpleProxy.prototype.makeClientRequest = function(serverRequest) {
  var url = parse_url(serverRequest.url)

  //console.log('forwarding', serverRequest.url, serverRequest.headers)

  var clientOptions = {
    hostname: this.options.hostname || url.hostname,
    port: this.options.port || url.port || 80,
    method: serverRequest.method,
    path: url.path,
    headers: _.clone(serverRequest.headers)
  }

  delete clientOptions.headers['proxy-connection']

  this.emit('clientRequest', clientOptions)

  return http.request(clientOptions)
}

SimpleProxy.prototype.request = function(serverRequest, target) {
  var clientRequest = this.makeClientRequest(serverRequest)
  serverRequest.pipe(clientRequest)
  //serverRequest.on('end', function() {
  //  console.log('forwarding done', serverRequest.url, serverRequest.headers)
  //})

  this.emit('serverRequest', serverRequest)

  if (target instanceof Function) {
    clientRequest.on('response', target)
    return clientRequest
  }

  clientRequest.on('error', function(error) {
    console.log('error', error)
    target.writeHead(404, {})
    target.end()
  })

  clientRequest.on('response', function(response) {
    //console.log('response', serverRequest.url, serverRequest.headers)

    // Preparing headers
    var headers = _.clone(response.headers)
    if ('transfer-encoding' in headers || ('content-length' in headers && headers['content-length'] != 0)) {
      headers['transfer-encoding'] = 'chunked'
    }

    // response -> target
    target.writeHead(response.statusCode, headers)
    response.pipe(target)

    this.emit('response', response)
  }.bind(this))
}

SimpleProxy.middleware = function(options) {
  var proxy = new SimpleProxy(options)
  return proxy.request
}

module.exports = SimpleProxy

var fs = require('fs')
  , path = require('path')
  , connect = require('connect')

var extensions = connect.mime.extensions
extensions['application/x-javascript'] = 'js'
extensions['text/javascript'] = 'js'

module.exports = function(dir) {
  var id = 0
  function nextId() {
    var currentId = String(id)
    while (currentId.length < 3) currentId = '0' + currentId

    var reserved = fs.existsSync(path.join(dir, currentId + '.http.json'))

    id += 1

    return reserved ? nextId() : currentId
  }

  return function(req, res, next) {
    var id = nextId()

    var record = {
      begin: +new Date,
      end: undefined,

      request: {
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    }

    function open(fn) {
      return fs.createWriteStream(path.join(dir, fn))
    }

    // Testing for file upload
    if (/multipart/.test(req.headers['content-type'])) {
      var fn = id + '.bin'
      record.request.data = fn
      req.pipe(open(fn))
    }

    var response_file

    var writeHead = res.writeHead
    res.writeHead = function(statusCode, reasonPhrase, headers) {
      // reasonPhrase is optional
      if (!headers) headers = reasonPhrase

      // Response metadata
      record.response = {
        statusCode: statusCode,
        headers: headers,
        size: 0
      }

      if ('transfer-encoding' in headers || ('content-length' in headers && headers['content-length'] != 0)) {
        // The response contains data. Opening a file for it.
        var mime = /[^;]*/.exec(headers['content-type'])[0]
        var extension = extensions[mime] || 'bin'
        if (headers['content-encoding'] === 'gzip') extension += '.gz'
        if (headers['content-encoding'] === 'deflate') extension += '.deflate'
        var fn = id + '.' + extension
        record.response.data = fn
        response_file = open(fn)
      }

      return writeHead.apply(this, arguments)
    }

    var write = res.write
    res.write = function(chunk) {
      // Writing response chunk to disc
      if (response_file) response_file.write(chunk)
      record.response.size += chunk.length

      return write.apply(this, arguments)
    }

    var end = res.end
    res.end = function(chunk) {
      // Writing the final chunk of the response to disc and closing the file
      if (response_file && chunk) {
        response_file.end(chunk)
        record.response.size += chunk.length
      }

      // Writing metadata to disc
      record.end = +new Date
      open(id + '.http.json').end(JSON.stringify(record, null, 2))

      return end.apply(this, arguments)
    }

    if (next) next()
  }
}

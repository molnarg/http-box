module.exports = function prepend(buffer) {
  return function(req, res, next) {
    delete req.headers['accept-encoding']

    var writeHead = res.writeHead
    res.writeHead = function(statusCode, reasonPhrase, headers) {
      if (!headers) headers = reasonPhrase

      delete headers['content-length']

      if (!/text\/html/.test(headers['content-type'])) res.write = write

      writeHead.apply(this, arguments)
    }

    var write = res.write
    res.write = function(chunk) {
      res.write = write;

      write.call(this, buffer);
      return write.apply(this, arguments);
    }

    next()
  }
}

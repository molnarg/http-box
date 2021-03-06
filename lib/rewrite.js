var buffertools = require('buffertools');

module.exports = function rewrite(pattern, replacement) {
  return function(req, res, next) {
    var writeHead = res.writeHead
      , write = res.write
      , end = res.end
      , ready = false

    var compress = function(x) { return x }
      , decompress = function(x) { return x }

    delete req.headers['accept-encoding']

    res.writeHead = function(statusCode, reasonPhrase, headers) {
      // reasonPhrase is optional
      if (!headers) headers = reasonPhrase

      delete headers['content-length']
      if (!(/html/.test(headers['content-type']))) ready = true

      writeHead.apply(this, arguments)
    }

    res.write = function(chunk) {
      if (ready) return write.call(this, chunk)
      var begin = chunk.indexOf(pattern)
      if (begin === -1) return write.call(this, chunk)

      var before = chunk.slice(0, begin)
        , after = chunk.slice(begin + pattern.length)
        , newchunk = buffertools.concat(before, replacement, after)

      console.log('replace', chunk.length, newchunk.length)
      ready = true

      return write.call(this, newchunk)
    }

    res.end = function(chunk) {
      if (chunk) res.write(chunk)

      return end.call(this)
    }

    next()
  }
}

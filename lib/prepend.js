var buffertools = require('buffertools');

module.exports = function prepend(buffer) {
  return function(req, res, next) {
    delete req.headers['accept-encoding']

    var writeHead = res.writeHead
    res.writeHead = function(statusCode, reasonPhrase, headers) {
      if (!headers) headers = reasonPhrase

      delete headers['content-length']

      if (!/html/.test(headers['content-type'])) res.write = write

      writeHead.apply(this, arguments)
    }

    var write = res.write
    res.write = function(chunk) {
      res.write = write;

      var match = chunk.toString().match(/^(\s*<!DOCTYPE[^>]*>)?(\s*<html[^>]*>)?(\s*<head[^>]*>)?\s*</i);
      if (!match) return write.call(this, chunk);

      var insert_position = match[0].length - 1;
      if (chunk[0] === 239 && chunk[1] === 187 && chunk[2] === 191) insert_position += 2 // Unicode BOM
      var before = chunk.slice(0, insert_position)
        , after = chunk.slice(insert_position)
        , newchunk = buffertools.concat(before, buffer, after);

      return write.call(this, newchunk);
    }

    next()
  }
}

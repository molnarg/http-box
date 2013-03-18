var fs = require('fs')
  , path = require('path')
  , matchers = require('./matchers')

module.exports = function(dir, prefetch) {
  var records = fs.readdirSync(dir).filter(function(filename) {
    return /\.http\.json$/.test(filename)

  }).map(function(metadata_filename) {
    var record = JSON.parse(fs.readFileSync(path.join(dir, metadata_filename)))

    record.file = metadata_filename

    if (prefetch) {
      if (record.request.data)  record.request.data  = fs.readFileSync(path.join(dir, record.request.data ))
      if (record.response.data) {
        record.response.data = fs.readFileSync(path.join(dir, record.response.data))
        record.response.headers['content-length'] = record.response.data.length
        delete record.response.headers['transfer-encoding']
        delete record.response.headers.date
        delete record.response.headers.expires
      }
    }

    record.played = 0

    return record
  })

  var forwarded = []

  function middleware(req, res, next) {
    var matcher = matchers.url(req)
    var record = records.filter(function(record) {
      return matcher(record.request)
    })[0]

    if (!record) {
      forwarded.push(req)
      if (next) next()
      return
    }

    setTimeout(function() {
      record.played += 1

      //res.writeHead(record.response.statusCode, record.response.headers)
      res.statusCode = record.response.statusCode

      var headers = record.response.headers
      for (var name in headers) {
        if (headers.hasOwnProperty(name)) res.setHeader(name, headers[name])
      }

      if (record.response.data) {
        if (prefetch) {
          res.end(record.response.data)
        } else {
          fs.createReadStream(path.join(dir, record.response.data)).pipe(res)
        }
      } else {
        res.end()
      }
    }, record.delay || 0)
  }

  function statistics() {
    var duplicates = []
      , missed = []

    records.forEach(function(record) {
      if (record.played === 0) {
        missed.push(record)
      } else if (record.played > 1) {
        duplicates.push(record)
      }
    })

    return {
      records: records.length,
      missed: missed.length,
      missed_urls: missed.map(function(record) { return record.request.url }),
      duplicate: duplicates.length,
      duplicate_urls: duplicates.map(function(record) { return record.request.url }),
      forwarded: forwarded.length,
      forwarded_urls: forwarded.map(function(request) { return request.url })
    }
  }

  middleware.statistics = statistics
  middleware.records = records
  return middleware
}

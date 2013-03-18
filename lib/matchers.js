var url_parse = require('url').parse

function url_of_req(req) {
  var parsed = url_parse(req.url)
  return (parsed.protocol || 'http:') + '//' + (parsed.hostname || req.headers.host) + parsed.path
}
module.exports = {
  url: function(original) {
    if (!original.normalized_url) original.normalized_url = decodeURIComponent(url_of_req(original)).toLowerCase().replace(/\/$/, '')
    return function(req) {
      if (!req.normalized_url) req.normalized_url = decodeURIComponent(url_of_req(req)).toLowerCase().replace(/\/$/, '')
      return req.normalized_url === original.normalized_url
    }
  }
}

var url_parse = require('url').parse

function url_of_req(req) {
  var parsed = url_parse(req.url)
  return (parsed.protocol || 'http:') + '//' + (parsed.hostname || req.headers.host) + parsed.path
}
module.exports = {
  url: function(original) {
    var original_url = url_of_req(original)
    return function(req) {
      var actual_url = url_of_req(req)
      return decodeURIComponent(actual_url).toLowerCase().replace(/\/$/, '') ===
             decodeURIComponent(original_url).toLowerCase().replace(/\/$/, '')
    }
  }
}

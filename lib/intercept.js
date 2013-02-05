module.exports = function intercept(object, methods) {
  Object.keys(methods).forEach(function(method) {
    var original = object[method]
    object[method] = function() {
      methods[method].apply(this, arguments)
      return original.apply(this, arguments)
    }
  })
}

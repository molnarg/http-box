var fs          = require('fs')
  , url         = require('url')
  , path        = require('path')
  , connect     = require('connect')
  , program     = require('commander')
  , SimpleProxy = require('./SimpleProxy')
  , prepend     = require('./prepend')

function checkDirectory(dir) {
  if (!dir) {
    throw 'You must specify a directory.'

  } else if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)

  } else if (!fs.statSync(dir).isDirectory()) {
    throw 'The specified path is not a directory.'
  }
}

function replay(dir) {
  var replay = require('./replay')

  checkDirectory(dir)
  var port = program.port || 8080

  console.log("Replaying from", dir, 'on port', port)

  //var proxy = new SimpleProxy()

  var replayer = replay(dir, true)

  var app = connect()
  app.use(connect.logger('dev'))
  //app.use(connect.logger({immediate: true, format: 'dev'}))
  //app.use(connect.timeout(1000))
  app.use(replayer)
  //app.use(proxy.request)
  app.listen(port)

  process.on('exit', function() {
    console.log('statistics:')
    console.log(replayer.statistics())
  })
}

function record(dir) {
  var record = require('./record')

  checkDirectory(dir)
  var port = program.port || 8080

  console.log("Recording to " + dir)
  console.log("Listening on port " + port)

  var proxy_url = process.env.http_proxy
  var proxy_options = {}
  if(proxy_url){
    var parsed = url.parse(process.env.http_proxy)
    proxy_options = {
      hostname: parsed.hostname,
      port: parsed.port*1
    }
  }
  var proxy = new SimpleProxy(proxy_options)

  var app = connect()
  app.use(connect.logger('dev'))
  app.use(record(dir))
  app.use(prepend('\n<script>' + fs.readFileSync(path.join(__dirname, 'pseudo.min.js')) + '</script>\n'))
  app.use(proxy.request)
  app.listen(port)

  process.on('exit', function() {

  })
}

program.version('0.1.0')

program.option('-p, --port <port number>', 'set port to listen on (defaults to 8080)', parseInt)
       .option('-s, --spdy'              , 'use SPDY instead of HTTP')
       .option('-n, --no-proxy'          , 'do not proxy requests that are not previously recorded')
       .option('-d, --determinize'       , 'replace Math.random with a pseudo-random function and '
                                         + 'replace Date to always return the same Date'
                                         + 'in the <head> of HTML files')

program.command('record <directory>')
       .action(record)

program.command('replay <directory>')
       .action(replay)

program.parse(process.argv)

process.on('SIGINT', process.exit)
process.on('SIGKILL', process.exit)
process.on('SIGTERM', process.exit)

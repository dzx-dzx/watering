var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
///////////////////////////////
var async = require('async');
var mongoose = require('mongoose')
///////////////////////////////

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

///////////////////////////////
const server = require('http').Server(express());

var spawn = require('child_process').spawn,
  sensorProcess = spawn('python', ['../sensor/sensor.py']),
  databaseProcess = spawn('mongod', ['--dbpath','../database/']);

sensorProcess.stdout.on('data', function (data) {
  console.log(data.toString());
});
databaseProcess.stdout.on('data', function (data) {
  console.log('Database:',data.toString());
});


sensorProcess.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  var temperature, humidity;

  console.log('Server:a user connected');

  socket.on("disconnect", () => {
    console.log("Server:a user go out");
  });




  function request_data() {
    async.parallel([
      () => {
        socket.emit('request_temperature')
        socket.once("response_temperature", (data) => {
          console.log("Temperature:", data);
          temperature = data;
        })
      },
      () => {
        socket.emit('request_humidity')
        socket.once("response_humidity", (data) => {
          console.log("Humidity:", data)
          humidity = data;
        })
      },
      (temperature, humidity) => {
        ;
      },
      () => { setTimeout(request_data, 1000) },
    ])
  }

  request_data()

});

server.listen(3001);
///////////////////////////////

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

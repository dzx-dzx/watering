var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//////////////////////////
var async = require('async');
var fs = require('fs')
//////////////////////////

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var mongodb = require('mongodb')
///////////////////////////////
const server = require('http').Server(express());
fs.rmdir("../database", () => { });
fs.mkdir("../database", () => { });
var spawn = require('child_process').spawn,
  sensorProcess = spawn('python', ['../sensor/sensor.py']),
  databaseProcess = spawn('mongod', ['--dbpath', '../database/']);
var db, client = new mongodb.MongoClient('mongodb://localhost:27017')
client.connect(() => {
  console.log("Connected successfully to server");
  db = client.db('sensorData');
});

sensorProcess.stdout.on('data', function (data) {
  console.log(data.toString());
});
// databaseProcess.stdout.on('data', function (data) {
//   console.log('From Database:', data.toString());
// });

const io = require('socket.io')(server);
io.on('connection', (socket) => {
  var temperature, humidity;

  console.log('Server:a user connected');

  socket.on("disconnect", () => {
    console.log("Server:a user go out");
  });

  function request_data() {
    var temperature, humidity;
    async.series([
      (callback) => {
        console.log("Now is the time:",Date.now())
        socket.emit('request_temperature');
        socket.emit('request_humidity');
        socket.once("response_temperature", (data) => {
          temperature = data;
          console.log("From Sensor:Temperature:", temperature);
          callback(null, null)
        })
      },
      (callback) => {
        socket.once("response_humidity", (data) => {
          humidity = data;
          console.log("From Sensor:Humidity:", humidity);
          callback(null, null)
        })

      },
      (callback) => {
        console.log(`Now Storing Data ...`);
        if (db != undefined) {
          const collection = db.collection('documents');
          // Insert some documents
          collection.insertMany([
            { temperature: temperature }, { humidity: humidity }
          ], function (err, result) {
            console.log(err)
            console.log("Data Successfully Stored.");
          })
        }
        callback(null, null)
      },
      (callback) => {
        setTimeout(request_data, 5000);
        callback(null, null);
      },

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

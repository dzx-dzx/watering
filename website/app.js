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
const sensorServer = require('http').Server(express());
fs.rmdir("../database", () => { });
fs.mkdir("../database", () => { });
var spawn = require('child_process').spawn,
  sensorProcess = spawn('python', ['../sensor/sensor.py']),
  databaseProcess = spawn('mongod', ['--dbpath', '../database/']);
var db, client = new mongodb.MongoClient('mongodb://localhost:27017')
client.connect(() => {
  console.log("Connected successfully to Database");
  db = client.db('sensorData');
  // db.collection('documents').drop()
});

sensorProcess.stdout.on('data', function (data) {
  console.log(data.toString());
});
// databaseProcess.stdout.on('data', function (data) {
//   console.log('From Database:', data.toString());
// });

const sensorServerio = require('socket.io')(sensorServer);
sensorServerio.on('connection', (socket) => {

  console.log('sensorServer:a user connected');

  socket.on("disconnect", () => {
    console.log("sensorServer:a user go out");
  });

  function request_data() {
    var temperature, humidity;
    async.series([

      (callback) => {
        socket.emit('request_temperature');

        socket.once("response_temperature", (data) => {
          temperature = data;
          console.log("From Sensor:Temperature:", temperature);
          callback(null, null)
        })
      },
      (callback) => {
        socket.emit('request_humidity');
        socket.once("response_humidity", (data) => {
          humidity = data;
          console.log("From Sensor:Humidity:", humidity);
          callback(null, null)
        })

      },
      (callback) => {

        if (db != undefined) {
          console.log(`Now Storing Data ...`);
          const collection = db.collection('documents');
          var time = Date.now()
          console.log("Now is the time:", time)
          collection.insertMany([
            { type: "temperature", data: temperature, time: time }, { type: "humidity", data: humidity, time: time }
          ], function (err, result) {
            console.log("Data Successfully Stored.");
          })
        }
        callback(null, null)
      },
      (callback) => {
        setTimeout(request_data, 1000);
        callback(null, null);
      },

    ])
  }

  request_data()

});

sensorServer.listen(3001);
///////////////////////////////

/////////////////////////////////
const indexServer = require('http').Server(express());
const indexServerio = require('socket.io')(indexServer);
indexServerio.on('connection', (socket) => {
  console.log('indexServer:a user connected');

  socket.on("disconnect", () => {
    console.log("indexServer:a user go out");
  });
  socket.on("request_humidity", () => {
    if (db != undefined) {
      const collection = db.collection('documents');
      collection.findOne(
        { type: "humidity" },
        { sort: [['time', -1]] },
        (e, res) => {
          socket.emit("response_humidity", res);
          console.log("Humidity read from Database:", res)
        })
    }

  });
  socket.on("request_temperature", () => {
    if (db != undefined) {
      const collection = db.collection('documents');
      collection.findOne(
        { type: "temperature" },
        { sort: [['time', -1]] },
        (e, res) => {
          socket.emit("response_temperature", res);
          console.log("temperature read from Database:", res)
        })
    }
  });

})

indexServer.listen(3002)
/////////////////////////////////
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

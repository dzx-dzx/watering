var express = require('express');
var router = express.Router();
/////////////////////////////////////////////
var async = require('async');
var fs = require('fs')
var mongodb = require('mongodb')

var db, collection, client = new mongodb.MongoClient('mongodb://localhost:27017')
client.connect(() => {
  console.log("Connected successfully to Database");
  db = client.db('sensorData');
  collection = db.collection('documents');
});
/////////////////////////////////////////////

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/temperature', (req, res, next) => {
  collection.findOne(
    { type: "temperature" },
    { sort: [['time', -1]] },
    (e, data) => {
      res.send(data)
      console.log("Temperature read from Database:", data)
    })
})
router.get('/humidity', (req, res, next) => {
  collection.findOne(
    { type: "humidity" },
    { sort: [['time', -1]] },
    (e, data) => {
      res.send(data);
      console.log("Humidity read from Database:", data)
    })
})
module.exports = router;

var promise = require('bluebird');
var dbgeo = require('dbgeo');
var credentials = require('./credentials')

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
//var connectionString = 'postgres://' + credentials.user + ':' + credentials.password + '@'+ credentials.host + 127.0.0.1:5432/reimsdb';
var connectionString = 'postgres://' + credentials.user + ':' + credentials.password + '@' + credentials.host + ':' + credentials.port + '/' + credentials.database;
var db = pgp(connectionString);

// add query functions
function getAllProperties(req, res, next) {
  db.any('select * from stands')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL properties'
        });
    })
    .catch(function (err) {
      console.log('error')
      return next(err);
    });
}

function getAllClients(req, res, next) {
  db.any('select * from clients')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL clients'
        });
    })
    .catch(function (err) {
      console.log('error')
      return next(err);
    });
}

function getSingleClient(req, res, next) {
  //var emailAdd = parseInt(req.params.email);
  var emailAdd = req.params.email;
  db.one('select * from clients where email = $1', emailAdd)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE clients'
        });
    })
    .catch(function (err) {
      res.json({
        status: 'client not found',
        message: 'Enter the correct email address for the client'
      })
     // return next(err);
    });
}


function getAllCadastre(req, res){
  // based on https://chriswhong.com/data-visualization/introducing-postgis-preview/

  //let sql = 'SELECT t1.dsg_num, t2.name as township_name, t1.status, t3.name As city_name, t1.geom as geom FROM stands t1 INNER JOIN townships t2 ON t1.townshipid=t2.townshipid INNER JOIN cities t3 ON t2.cityid = t3.cityid' // req.query.q;
  let sql = 'SELECT t1.dsg_num, t2.name as township_name, t3.name As city_name, t1.geom as geom FROM cadastre t1 INNER JOIN townships t2 ON t1.townshipid=t2.townshipid INNER JOIN zimcities t3 ON t2.cityid = t3.cityid' // req.query.q;

  console.log("All stands: " + sql)
  //query using pg-promise
  const calculateTownshipSummary = (stands) => {
    // var townshipSummarySQL = 'SELECT  townships.name as township_name, count(1) as stands_count FROM stands INNER JOIN townships ON townships.id = stands.townshipid GROUP BY stands.townshipid, townships.name'
    var townshipSummarySQL = 'SELECT  townships.name as township_name, count(1) as stands_count FROM cadastre INNER JOIN townships ON townships.townshipid = cadastre.townshipid GROUP BY cadastre.townshipid, townships.name'
    return db.any(townshipSummarySQL)
  }

  db.any(sql)
    .then(function (stands) { //use dbgeo to convert WKB from PostGIS into topojson - reduces the size of the data considerably
      return dbGeoParse(stands)
    })
    .then(function (topojson) {
       calculateTownshipSummary().then(townshipSummary => {
         console.log(townshipSummary)
         res.status(200).send({ townshipSummary, topojson })
       })
       .catch(error => {
         throw error
       })
    })
    .catch(function (err) { //send the error message if the query didn't work
        var msg = err.message || err;
        res.send({
            error: msg
        });
    });
};

function getTownshipSummary(req, res){
  // based on https://chriswhong.com/data-visualization/introducing-postgis-preview/

  var sql = 'SELECT  townships.name as township_name, count(1) as stands_count FROM stands INNER JOIN townships ON townships.id = stands.townshipid GROUP BY stands.townshipid, townships.name'

  console.log("Township Summary: " + sql)
  //query using pg-promise
  db.any(sql)

    .then(function (data) {
        res.send(data);
    })
    .catch(function (err) { //send the error message if the query didn't work
        var msg = err.message || err;
        res.send({
            error: msg
        });
    });
};

function getAvailableStands(req, res){

  var sql = req.query.q;
console.log("executing: " + sql)
  //query using pg-promise
  db.any(sql)
    .then(function (data) { //use dbgeo to convert WKB from PostGIS into topojson - reduces the size of the data considerably
        return dbGeoParse(data);
    })
    .then(function (data) {
        res.send(data);
    })
    .catch(function (err) { //send the error message if the query didn't work
        var msg = err.message || err;
        res.send({
            error: msg
        });
    });
};

function dbGeoParse(data) {

    return new Promise(function (resolve, reject) {
       const options =  {
          outputFormat: 'topojson',
          geometryColumn: 'geom',
          geometryType: 'wkb'
        }

        dbgeo.parse(data, options, function(error, result) {
          // This will log a valid GeoJSON FeatureCollection
          if (error) return reject(error)
          resolve(result)
        });
 
    });
}

module.exports = {
  getAllClients: getAllClients,
  getSingleClient: getSingleClient,
  getAllProperties: getAllProperties,
  getAllCadastre: getAllCadastre,
  getAvailableStands: getAvailableStands,
  getTownshipSummary
  //createClient: createClient,
  //updateClient: updateClient,
 // removeClient: removeClient
};
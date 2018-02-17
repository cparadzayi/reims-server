var express = require('express');
var router = express.Router();


var db = require('../reimsqueries');

// cors stuff- important for CORS
router.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Request-Method', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE')
  if (req.method === 'OPTIONS') {
    res.status(200)
    res.end()
    return
  }
  next()
})

router.get('/api/clients', db.getAllClients);

router.get('/api/properties', db.getAllProperties);

router.get('/api/cadastre', db.getAllCadastre);

router.get('/api/available', db.getAvailableStands);
router.get('/api/townshipsummary', db.getTownshipSummary);


router.get('/api/clients/:email', db.getSingleClient);


/*
router.post('/api/clients', db.createClient);
router.put('/api/clients/:id', db.updatePuppyClient);
router.delete('/api/clients/:id', db.removeClient);
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


 
module.exports = router;

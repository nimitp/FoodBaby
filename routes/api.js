const express = require('express'),
  db = require('../db/db.js');
var router = express.Router();

const version = '0.0.1';

router.get('/', (req, res, next) => {
  res.send('API Version ' + version);
});

router.route('/listings')
  .get(db.listings.list)
  .post(db.listings.create);

router.route('/listings/recent')
  .get(db.listings.recent);

router.route('/listings/id/:listingId')
  .get(db.listings.find)
  .put(db.listings.update)
  .delete(db.listings.delete);

module.exports = router;
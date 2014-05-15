var express = require('express');
var router = express.Router();

/* GET upload page. */
router.get('/', function(req, res) {
  res.render('index');
});

/* GET download page. */
router.get('/:hash', function(req, res) {
  res.render('download', { hash: req.param('hash')});
});

module.exports = router;

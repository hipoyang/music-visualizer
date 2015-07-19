var express = require('express');
var router = express.Router();
var path = require('path');
var media = path.join(__dirname, '../public/medias');

// GET 主页
router.get('/', function(req, res, next) {
    var fs = require('fs');
    fs.readdir(media, function(error, files) {
        if (error) {
            console.log(error);
        } else {
            res.render('index', { 
                title: 'Music Visualizer',
                files: files
            });
        }
    });
});

module.exports = router;

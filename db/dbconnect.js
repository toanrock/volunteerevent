var mongoose = require('mongoose');

var user = '4257080aaa5b8f1e3cbe386ffbb87d3b';
var password = 'Volunteer';
var database = '4257080aaa5b8f1e3cbe386ffbb87d3b';
var host = '32-3a.mongo.evennode.com:27017,32-3b.mongo.evennode.com:27017';

var url =`mongodb://${user}:${password}@${host}/${database}`;
mongoose.Promise = global.Promise;
//console.log("url ="+url);
mongoose.connect(url,function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log("Connection is ok");
    }
});

module.exports = url;
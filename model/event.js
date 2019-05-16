const mongoose = require('mongoose');

var EventSchema = mongoose.Schema({
    eventname : {type:String, required:true},
    startdate : {type:String, required:true},
    enddate : {type:String, required:true},
    description : {type:String},
    owner : {type:String, required:true},
});

var evt = mongoose.model("events",EventSchema);
module.exports = evt;
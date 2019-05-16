const mongoose = require('mongoose');

var ShiftSchema = mongoose.Schema({
    eventid: {type:String, required:true},
    starttime : {type:String, required:true},
    endtime : {type:String, required:true},
    max : {type:Number, required:true},
    number : {type:Number, required:true},
    date: {type:String, required:true},
    slot: {type:Array}
});

var shift = mongoose.model("shifts",ShiftSchema);
module.exports = shift;
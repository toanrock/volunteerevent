const mongoose = require('mongoose');
const md5 = require('js-md5');
var EmployeeSchema = mongoose.Schema({
    firstName : {type:String, required:true},
    lastName : {type:String, required:true},
    username : {type:String, required:true, unique:true},
    password : {type:String, required:true},
    type : {type:String, required:true},
    address : {type:String},
    phoneNo : {type:String}
});
EmployeeSchema.methods.checkPassword = function(guess,done){
   
    var hash =  md5(guess);
    done(null,this.password===hash);
}

var emp = mongoose.model("Employees",EmployeeSchema);
module.exports = emp;


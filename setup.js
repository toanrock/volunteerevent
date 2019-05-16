// this file is setup for login
var passport=require('passport');
var Employee = require('./model/employee');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(){
    passport.serializeUser((employee,done)=>{
        done(null,employee);
    });
    passport.deserializeUser((id,done)=>{
        Employee.findById(id,(err,emp)=>{
           done(err,emp);
        })
    });
    passport.use(new LocalStrategy((user,pass, done)=>{
       Employee.findOne({username:user},(err,emp)=>{
           if(err){
               return done(err);
           }
           if(!emp){
               return done(null,false,{message:"username is not existed"});
           }
           emp.checkPassword(pass,(err,isMatch)=>{
                if(err){
                    return done(err);
                }
                if(isMatch){
                    return done(null,emp);
                }
                else{
                    return done(null,false, {message:"invalid password"});
                }
           });
       })
    }))
}
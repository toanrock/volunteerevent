var express = require('express');
var session = require('express-session');
var http = require('http');
var fs = require ('fs');
var path = require('path');
var  bodyParser = require('body-parser'),
    passport = require('passport'),
    local = require('passport-local'),
    flash = require('connect-flash');
var md5 = require('js-md5');    
//model delcare
var Employee = require('./model/employee');
var Event = require('./model/event');
var Shift = require('./model/shift');

//end model declare here
var init=require('./db/dbconnect');
var calendar = require('node-calendar');
var cookieParser = require('cookie-parser');
var JsonStore = require('express-session-json')(session);
var app = express();

var setup =require('./setup');
var utility =require('./utility');
setup();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: "MySecretKey",
    resave: true,
    saveUninitialized: true,
    store: new JsonStore()
}));

app.set("port",process.env.PORT || 3000);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.resolve(__dirname,"static")));
app.set("views",path.resolve(__dirname,"view"));
app.set("view engine","pug");

app.use(function(req,res,next){
   res.locals.currentUser = req.user;
   res.locals.errors = req.flash("error");
   res.locals.infos = req.flash("info");
   next();
} );


app.get("/", (req,res)=>{
    if(req.isAuthenticated()){
         res.render("main", {
            emp: req.user,
            message : "Welcome to let's talk science"
        });
    }
    else{
        res.render("home", {
            message : "Welcome to let's talk science"
        });
    }
   
});

app.get("/main", ensureAuthenticated,(req,res,next)=>{
        var emp = req.user;
        res.render("main", {
            emp : emp    
    });
});
//need login to access, calendar page
app.get("/calendar", ensureAuthenticated,(req,res,next)=>{
        var emp = req.user;
        var year,month;
        if(req.query.year && req.query.month){
            year = parseInt(req.query.year);
            month = parseInt(req.query.month);
            if(month===0){
                console.log(month);
                month=12;
                year--;
            }
            if(month===13){
                month=1;
                year++;
            }
        }
        else{
            year = new Date().getFullYear();
            month = new Date().getMonth()+1;
        }
        var monthday =  utility.getDayMonth(new calendar.Calendar(1).monthdays2calendar(year,month));         
            Event.find({}).lean().sort({startdate:1}).exec((err,list)=>{
                if(err)
                    return next(err);
                 var eventInMonth = utility.getListEventInMonth(monthday,list,year,month);
                // console.log(list);
                    res.render("calendar", {
                    emp : emp,
                    year: year,
                    monthName: calendar.month_abbr[month],
                    month: month,
                    monthday: monthday,
                    events: eventInMonth
                });
            });
        
});
//end of calendar page
//need login to access , go to volunteer page
app.get("/volunteer", ensureAuthenticated,(req,res,next)=>{
         var emp = req.user;
         if(req.session.listEvent){
               //console.log("use session");
                var eventList = req.session.listEvent;
                res.render("volunteer", {
                            emp:emp,
                            eventList: eventList
                });
         }
         else{
            //console.log("dont use session");
            if(emp.type=="Organization"){ 
                Event.find({owner:emp.username}).sort({startdate:1}).lean().exec((err,eventList)=>{
                    if(err)
                    return next(err);
                    else{ 
                        req.session.listEvent = eventList;
                        res.render("volunteer", {
                            emp:emp,
                            eventList: eventList
                        });
                    }
                });
            }
            else{ // if user is volunteer,show all event
                Event.find({}).sort({startdate:1}).lean().exec((err,eventList)=>{
                    if(err)
                    return next(err);
                    else{ 
                        req.session.listEvent = eventList;
                        res.render("volunteer", {
                            emp:emp,
                            eventList: eventList
                        });
                    }
                });
            }     
         }  
});
// end of volunteer page

//need login to access, profile page
app.get("/profile", ensureAuthenticated,(req,res,next)=>{
         var emp = req.user;
        res.render("profile", {
            emp:emp
        });
});
// end of profile page
// update user profile
app.post("/updateprofile", ensureAuthenticated,(req,res,next)=>{
            var emp = req.user;
            var newpass = req.body.password;
            if(newpass!=emp.password) // if password change
                newpass=md5(req.body.password); // hash new password 
            var empupdate = new Employee({
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                username:req.user.username, // get username from emp because we dont pass username from update profile
                password: newpass,
                type: req.body.type,
                address: req.body.address,
                phoneNo: req.body.phoneNo
            }); 
            Employee.update({username: emp.username},
                {$set:
                    {password:newpass,
                    firstName: req.body.firstname,
                    lastName: req.body.lastname,
                    type: req.body.type,
                    address: req.body.address,
                    phoneNo: req.body.phoneNo 
                }}).exec((err)=>{
                    if(err){
                         res.render("profile", {
                            message: "something wrong! can not update the profile"
                        });
                    }
                    else{
                        res.render("profile", {
                             message: "Update Sucessfull",
                            emp:empupdate
                        });
                    }
                });   
});
//end of update user profile

//need login to access , move to addevent page
app.get("/addEvent", ensureAuthenticated,(req,res,next)=>{
        var emp = req.user;
        var start;
        if(req.query.start)
        {
            start= new Date(req.query.start).toISOString().substring(0,10); // format string to fit the input type date
        }
        else
            start = "";
        
        res.render("addevent", {
            owner:emp.username,
            startd: start
        });
  
});
//end of addevent page
//need login to access , process addevent and store to DB
app.get("/addNewEvent", ensureAuthenticated,(req,res,next)=>{
     var emp = req.user;
        var des,evtname,start,end,own;
       if((req.query.eventname) && (req.query.startdate) && (req.query.enddate) && (req.query.owner==emp.username)){
            evtname = req.query.eventname;
            start = req.query.startdate;
            end = req.query.enddate;
            own = req.query.owner;
       }
       else{
            res.render("main",{
                    emp: emp,
                    message: "something wrong! cannot add new event!Please try again",
                });
       }
       if(req.query.description){
            des =req.query.description;
       }
        else{
            des="";
        }
       var event = new Event({
            eventname: evtname,
            description: des,
            startdate: start,
            enddate: end,
            owner: own
       });
       event.save((err,event)=>{
            if(err){
                res.render("addevent",{
                    message: "something wrong! cannot add new event!Please try again",
                    event: event
                });
            }
            else{
                    //new event added to DB, delete the list event in session
                    delete req.session.listEvent;
                    res.render("addevent",{
                    message: "add event Sucessfull"                   
                });
            }
       }); 
});
// end of process addevent
//need login to access, edit event page
app.get("/editevent",ensureAuthenticated,(req,res,next)=>{
      var emp = req.user;
      if(emp.type=="Organization"){
          if(req.query.eventId){
                var evtid =req.query.eventId;
                var listEvent;           
                if(req.session.listEvent){
                    listEvent= req.session.listEvent;
                   // console.log("there is event in session");
                    //console.log(listEvent);
                      var evt=null;
                    for(let i=0;i<listEvent.length;i++){
                        var e = listEvent[i];                    
                        if(e._id==evtid){
                            evt = e;
                            break;
                        }
                    }               
                    if(evt==null){
                        res.render("main",{
                            emp: emp,
                            message: "Something wrong! please try again"
                        });
                    }
                    else{
                        //console.log(evt);
                        res.render("editEvent",{
                            event: evt,
                            emp:emp,
                        });
                    }
                }
                else{ 
                    Event.find({owner:emp.username}).lean().exec((err,list)=>{
                        if(err)
                            return next(err);
                        req.session.listEvent = list;   
                        req.flash("info","Update Sucessfull");
                        return  res.redirect("/editevent?eventId="+evtid);
                    });
                }                
          }
          else{
              res.render("main",{
                emp:emp,
                message:"the event is not existed"
            });
          }
      }
      else{
            res.render("main",{
                emp:emp,
                message:"You can not access this function"
            });
      }
});
//end of edit event page
// function update event
app.get("/updateevent", ensureAuthenticated,(req,res,next)=>{
     var emp = req.user;
      if(emp.type=="Organization"){
          if((req.query.eventId) && (req.query.eventname) && (req.query.startdate) && (req.query.enddate)) {
              console.log("update event");
                Event.update({_id:req.query.eventId},
                {$set:
                    {eventname:req.query.eventname,
                     description:req.query.eventname,
                     startdate:req.query.startdate,
                     enddate:req.query.enddate                               
                    }}).exec((err,evt)=>{
                        if(err)
                            return next(err);
                        else{
                             delete req.session.listEvent;        
                             return res.redirect("/editevent?eventId="+req.query.eventId);
                        }
                    });
          }
          else{
               res.render("main",{
                emp:emp,
                message:"Some thing wrong! can not update"
            });
          }
      }
      else{
            res.render("main",{
                emp:emp,
                message:"You can not access this function"
            });
      }
});
//end of update event
//join event page
app.get("/joinevent", ensureAuthenticated,(req,res,next)=>{
    var emp= req.user;
        var evtid = req.query.eventId;
        var listEvent;
        Event.find({_id:evtid}).lean().exec((err,evt)=>{
            if(err)
                return next(err);
              Shift.find({eventid:evtid}).lean().exec((err,shiftList)=>{
            if(err){
                return next(err);
            }
            res.render("joinshift",{
                emp:emp,
                event:evt[0],
                shiftList: shiftList,
            });
            });
        });
      
     
});
//end of join event page
//delete event
app.get("/deleteevent",ensureAuthenticated,(req,res,next)=>{
    if(req.query.id){
        Event.remove({_id:req.query.id},(err)=>{
            if(err)
                return next(err);
            else{
                Shift.deleteMany({eventid:req.query.id},(err)=>{
                    if(err)
                        return next(err);  
                }); // remove all shifts of event too
                delete req.session.listEvent;
                delete req.session.eventInMonth;
                req.flash("info","delete successfull");
                return res.redirect("/volunteer");
            }
        });
    }
    else{
        req.flash("info","can not delete this event");
        return res.redirect("/volunteer");
    }
});
//end of delete event
//need login to access, list shifts of the event
app.get("/shiftlist",ensureAuthenticated,(req,res,next)=>{
        var emp= req.user;
        var evtid = req.query.eventId;
        var listEvent;
        if(req.session.listEvent){
            listEvent= req.session.listEvent;
           // console.log("there is event in session");
            //console.log(listEvent);
        }
         else{
            Event.find({owner:emp.username}).lean().exec((err,list)=>{
                if(err)
                    return next(err);
                req.session.listEvent = list;
                return res.redirect("/shiftlist?eventId="+req.query.eventId);
            });
         }

        var evt=null;
        for(let i=0;i<listEvent.length;i++){
            var e = listEvent[i];
            //console.log(e);
            if(e._id==evtid){
                evt = e;
                break;
            }
        }
        //console.log(evt);
        if(evt==null){
            res.render("main",{
                emp: emp,
                message: "Something wrong! please try again"
            });
        }
        else{
            Shift.find({eventid:evtid}).lean().exec((err,shiftList)=>{
                    if(err){
                        return next(err);
                    }
                     res.render("shiftlist",{
                        emp:emp,
                        event:evt,
                        startd:evt.startdate,
                        shiftList: shiftList
                    });
            });          
        }
});
//end of shiftlist
//need login to access, add new shift to the event
app.get("/addnewshift",ensureAuthenticated,(req,res,next)=>{
    var emp = req.user;
    var shift = null;
    if(emp.type!="Organization"){
         req.flash("info","You can not access this function");
        return res.redirect("/main");
    }
    else{
        if((req.query.eventid) && (req.query.number) && (req.query.date) && (req.query.starttime) && (req.query.endtime) && (req.query.max)){
            console.log("new shift here");
            var slot =[];
            for(let i=1;i<=req.query.max;i++){
                var sl ={
                    slot: i,
                    username:"sign-up",
                    fullname:"sign-up"
                }
                slot.push(sl);
            }
            shift= new Shift({
                eventid: req.query.eventid,
                number: req.query.number,
                date: req.query.date,
                starttime: req.query.starttime,
                endtime: req.query.endtime,
                max: req.query.max,
                slot: slot
            });
        }
        if(shift==null){
            res.render("main",{
                emp:emp,
                message: "something wrong,please try again"
            })
        }
        else{
            shift.save((err)=>{
                if(err)
                    return next(err);
                else{
                    res.redirect("/shiftlist?eventId="+req.query.eventid);
                }
            })
        }
    } 
});
// end of add new shift
// edit shift page
app.get("/editshift",ensureAuthenticated,(req,res,next)=>{
     var emp = req.user;
     if(emp.type!="Organization"){
        req.flash("info","You can not access this function");
        return res.redirect("/main");
     }
     else{
        var listEvent;
            if(req.session.listEvent){
                listEvent= req.session.listEvent;
            // console.log("there is event in session");
                //console.log(listEvent);
            }
            else{
                Event.find({owner:emp.username}).lean().exec((err,list)=>{
                    if(err)
                        return next(err);
                    req.session.listEvent = list;
                    return res.redirect("/shiftlist?eventId="+req.query.eventId);
                });
            }
        
        Shift.find({_id:req.query.shiftId}).lean().exec((err,shift)=>{
            if(err)
                return next(err);
            else{
                var evt=null;
                for(let i=0;i<listEvent.length;i++){
                    var e = listEvent[i];
                    //console.log(e);
                    if(e._id==shift[0].eventid){
                        evt = e;
                        break;
                    }
                }
                    //console.log(evt);
                    if(evt==null){
                        res.render("main",{
                            emp: emp,
                            message: "Something wrong! please try again"
                        });
                    }
                //console.log(shift[0]);
                res.render("editshift",{
                    emp:emp,
                    shift:shift[0],
                    event:evt
                });
            }
        });
     }
});
//end of edit shift page
//function process update shift
app.get("/updateshift",ensureAuthenticated,(req,res,next)=>{
    if((req.query.eventid) &&(req.query.shiftid) &&(req.query.starttime)&&(req.query.endtime) &&(req.query.date) &&(req.query.max)){
        Shift.update({_id:req.query.shiftid},
        {$set:{
            starttime: req.query.starttime,
            endtime: req.query.endtime,
            date: req.query.date,
            max: req.query.max
        }}).exec((err)=>{
            if(err)
                return next(err);
            req.flash("info","Update Sucessfull");
            return res.redirect("/editshift?shiftId="+req.query.shiftid);
        });
    }
    else{
        req.flash("info","can not update");
        res.redirect("/editshift?shiftId="+req.query.shiftid);
    }
});
//end of update shift
app.get("/deleteshift",ensureAuthenticated,(req,res,next)=>{
    var emp = req.user;
     if(req.query.id){
        Shift.find({_id:req.query.id}).lean().exec((err,sh)=>{
                var evtid = sh[0].eventid;
                console.log(evtid);
                Shift.remove({_id:req.query.id},(err)=>{
                    if(err)
                        return next(err);
                    else{
                        console.log(evtid);
                        req.flash("info","delete successfull");
                        return res.redirect("/shiftlist?eventId="+evtid);
                    }
            });
        });
       
    }
    else{
        req.flash("info","can not delete this Shift");
        return res.redirect("/volunteer");
    }
});
//process sign-up shift
app.get("/signupshift",ensureAuthenticated,(req,res,next)=>{
    var emp= req.user;
    if((req.query.shiftId) && (req.query.eventId) &&(req.query.slot)){
        Shift.find({_id:req.query.shiftId}).lean().exec((err,sh)=>{
            if(err)
                return next(err);
            var sl={
                slot:req.query.slot,
                username:emp.username,
                fullname:emp.firstName+" "+emp.lastName
            };
            var slot = sh[0].slot;    
            for(let i=0;i<slot.length;i++){
                    if(slot[i].username==sl.username){
                        req.flash("info","You already signup this shift");
                        return res.redirect("/joinevent?eventId="+req.query.eventId);
                    }
                    if(slot[i].slot==sl.slot){
                        slot[i] = sl;
                    }
                }
                Shift.updateOne({_id:req.query.shiftId},{$set:{slot:slot}}).exec((err)=>{
                    if(err)
                        return next(err);
                    return res.redirect("/joinevent?eventId="+req.query.eventId);
                });
        });
    }
    else{
        req.flash("info","Something wrong please try again");
        res.redirect("/main");
    }
});
// end of this Sign-up process
//process to un sign-up shift
app.get("/unsignupshift",ensureAuthenticated,(req,res,next)=>{
     var emp= req.user;
      if((req.query.shiftId) && (req.query.eventId) &&(req.query.slot)){
        Shift.find({_id:req.query.shiftId}).lean().exec((err,sh)=>{
            if(err)
                return next(err);
            var sl={
                slot:req.query.slot,
                username:emp.username,
                fullname:emp.firstName+" "+emp.lastName
            };
            var slot = sh[0].slot;    
            for(let i=0;i<slot.length;i++){
                    if(slot[i].username==sl.username){
                        slot[i].username="sign-up";
                        slot[i].fullname = "sign-up";
                        break;
                    } 
            }
            Shift.updateOne({_id:req.query.shiftId},{$set:{slot:slot}}).exec((err)=>{
                if(err)
                    return next(err);
                return res.redirect("/joinevent?eventId="+req.query.eventId);
            });
        });
    }
    else{
        req.flash("info","Something wrong please try again");
        res.redirect("/main");
    }
});
//end of process un sign-up

app.get("/register", (req,res)=>{
    res.render("register", {
        message: "Let's talk science register"
    });
});

app.get("/aboutus", (req,res)=>{
      if(req.isAuthenticated()){
         var emp = req.user;
            res.render("aboutUs", {
                emp:emp
            });
      }
      else{
        res.render("aboutUs", {
        
        });
      }
});
app.get("/forgetpassword", (req,res)=>{
    res.render("forgetpassword", {
        message: "under contruction"
    });
});

//register new user
app.post("/registernew", (req,res)=>{
      
    var hash =  md5(req.body.password);      
    var emp = new Employee({
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        username: req.body.username,
        password: hash,
        type: req.body.type,
        address: req.body.address,
        phoneNo: req.body.phoneNo
    });
    
    Employee.find({username: emp.username}).exec((err,employ)=>{
        if(employ.length!=0){ // if there is username existed
            res.render("register",{                
                message : "username is existed ! try another one"
            });
        }
        else{ // save employee
                emp.save((err,emp)=>{
                    if(err){ // got error
                        res.render("home", {
                            message: "something wrong! cannot register new user"
                        });
                    }
                    else{ 
                        res.render("home", {
                            message: "register Sucessfull!"
                        });
                    }
                });
            }
    }); // end of employee find
     
});
// end of register new user
app.post("/login", passport.authenticate("local",{
    successRedirect:"/main",
    failureRedirect: "/",
    failureFlash: true
}));
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
})
function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        next();
    }
    else{
        req.flash("info","You must be logged in to see this page!");
        res.redirect("/");
    }
}
app.use((req, res) => {
    res.status(404).send("Page not found");
})
app.listen(app.get("port"),"0.0.0.0");
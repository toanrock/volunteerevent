jQuery(document).ready(function(){
        $(".eventDiv").click(function(event){
            //console.log(event.bubble);
            event.stopPropagation();
        });
});
function validatePasswordMatch(){
        var password = document.getElementById("password");
        var confirm_password = document.getElementById("confirm_password");
        if(password===null || confirm_password===null)
                  return;
        if(password.value !== confirm_password.value) {
              
            document.getElementById("vString").style.visibility ="visible";
            document.getElementById("register").disabled = true;
             
        } else {
            document.getElementById("vString").style.visibility ="hidden";
            document.getElementById("register").disabled = false;
        }           
    }

  function validateUsernameValid(){
        var username = document.getElementById("username").value;
        if(username!==null){
            if(username.includes('*') || username.includes('=') || username.includes('+') || username.includes('/')){
                document.getElementById("uString").style.visibility ="visible";
                document.getElementById("register").disabled = true;
            }
            else{
                document.getElementById("uString").style.visibility ="hidden";
                document.getElementById("register").disabled = false;
                }
        }
    }
 function datevalidation(){
        var start = document.getElementById("start").value;
        var end = document.getElementById("end").value;
        var sYear,sMonth,sDay,eYear,eMonth,eDay;
        sYear = start.substring(0,4);
        sMonth = start.substring(5,7);
        sDay = start.substring(8,10);
        eYear = end.substring(0,4);
        eMonth = end.substring(5,7);
        eDay = end.substring(8,10);
        if(eYear<sYear){
            document.getElementById("datevalid").style.visibility="visible";
            document.getElementById("evtButton").disabled = true;
        }
        else if(eMonth<sMonth)
        {
                document.getElementById("datevalid").style.visibility="visible";
                document.getElementById("evtButton").disabled = true;
        }
        else if(eDay<sDay ){
            document.getElementById("datevalid").style.visibility="visible";
            document.getElementById("evtButton").disabled = true;
        }
        else{
            document.getElementById("datevalid").style.visibility="hidden";
            document.getElementById("evtButton").disabled = false;
        }
}
 function datevalidation2(){
    var start = document.getElementById("startDate").value;
    var end = document.getElementById("endDate").value;
    var date = document.getElementById("date").value;
    var sYear,sMonth,sDay,eYear,eMonth,eDay,dYear,dMonth,dDay;
    sYear = start.substring(0,4);
    sMonth = start.substring(5,7);
    sDay = start.substring(8,10);
    eYear = end.substring(0,4);
    eMonth = end.substring(5,7);
    eDay = end.substring(8,10);
    dYear = date.substring(0,4);
    dMonth = date.substring(5,7);
    dDay = date.substring(8,10);
    var title = start+" < Date must be < "+end;
    document.getElementById("date").title = title;
    if(eYear<dYear || dYear<sYear){
        lockfield();
    }
    else if(eMonth<dMonth || dMonth<sMonth)
    {
        lockfield();
    }
    else if(eDay<dDay || dDay<sDay){
            lockfield();
    }
    else{
            unlockfield();
    }
}
 function timevalidation(){
        var start = document.getElementById("start").value;
        var end = document.getElementById("end").value;
        var sH,sM,eH,eM;
        sH = start.substring(0,2);
        sM = start.substring(3,5);
        eH = end.substring(0,2);
        eM = end.substring(3,5);
        
        if(sH>eH){
            document.getElementById("lock").disabled=true;
        }
        else if(sM>eM){
            document.getElementById("lock").disabled=true;
        }
        else{
            document.getElementById("lock").disabled=false;
        }
            
}
function lockfield(){
    document.getElementById("start").disabled=true;
    document.getElementById("end").disabled=true;
    document.getElementById("max").disabled=true;
    document.getElementById("lock").disabled=true;
}
function unlockfield(){
    document.getElementById("start").disabled=false;
    document.getElementById("end").disabled=false;
    document.getElementById("max").disabled=false;
    document.getElementById("lock").disabled=false;
}

 jQuery(document).ready( function setnumber(){
                var num = 0;
                var listlabel = document.getElementsByClassName("number");
                console.log(listlabel);
                for(var i=0;i<listlabel.length;i++){
                    console.log(listlabel[i].innerHTML);
                    var real = parseInt(listlabel[i].innerHTML);
                    if(real>=num)
                       num= real;
                }
                    
                    if(document.getElementById("number"))
                        document.getElementById("number").value=(num + 1);
                    if(document.getElementById("num"))
                        document.getElementById("num").innerHTML = (num + 1);
});

function confirmDelete(type,id){
    var confirmDel = confirm("Do you want to delete this "+type+" !");
    if(confirmDel==true){
        window.open("/delete"+type+"?id="+id,"_self");
    }
    else
        return;
}

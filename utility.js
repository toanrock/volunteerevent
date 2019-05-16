var uti=(function(){
     var api = {
        getDayMonth: getDayMonth,
        dayWithin: dayWithin,
        getListEventInMonth: getListEventInMonth
    };
    return api;
    function getDayMonth(monthday){
        var result =[];
        var week = [0,0,0,0,0,0,0];
       
        monthday.forEach(function(element) {   
        element.forEach(function(e){
                var weekday = e[1];
                var day = e[0];
                if(weekday==0){
                    result.push(week);
                    week = [0,0,0,0,0,0,0];
                }
                week[weekday] =day;
            },this);     
        }, this);
        return result;
    }
    function dayWithin(from,to,date){
        var fmonth,fday,fyear,tmonth,tday,tyear,dmonth,dday,dyear;
        fyear = parseInt(from.substring(0,4));
        fmonth = parseInt(from.substring(5,7));
        fday = parseInt(from.substring(8,10));
        tyear = parseInt(to.substring(0,4));
        tmonth = parseInt(to.substring(5,7));
        tday = parseInt(to.substring(8,10));
        dyear = parseInt(date.substring(0,4));
        dmonth = parseInt(date.substring(5,7));
        dday = parseInt(date.substring(8,10));
        if(dyear<fyear || dyear> tyear)
            return false;
        else if(dmonth<fmonth || dmonth>tmonth)
            return false;
        else if(dday<fday || dday>tday)
            return false;
        else
            return true;                        
    }
    function getListEventInMonth(monthday,list,year,month){
         var arrEvent =[];
        // console.log(list);
        for(let i=0;i<monthday.length;i++){
            var week = monthday[i];
            for(let j=0;j<week.length;j++){
                var day = week[j];
                if(day==0)
                    continue;
                else{
                    if(day<10)
                        day="0"+day;
                    var d;
                    if(month<10)
                        d =year+"-0"+month+"-"+day;
                    else
                         d =year+"-"+month+"-"+day;
                    //console.log(d);
                    var count=0;
                    for(let k=0;k<list.length;k++){
                        var event = list[k];
                        if(dayWithin(event.startdate,event.enddate,d)){
                            arrEvent.push({
                                keyday: parseInt(day),
                                id: event._id,
                                eventname: event.eventname
                            });
                            
                        }
                    }
                }
            }
        }
       return arrEvent;
    }
})();
module.exports = uti;
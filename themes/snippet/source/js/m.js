

function DateDiff(sDate1, sDate2) {  
	var obj = new Object();

    var aDate, oDate1, oDate2, iDays,iWeek;
    aDate = sDate1.split("-");
    oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);  //转换为yyyy-MM-dd格式
    aDate = sDate2.split("-");
    oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);
   // iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 / 24);
    
    iDays = parseInt((oDate1 - oDate2) / 1000 / 60 / 60 / 24); 
    console.log("iDays:"+iDays);
    iWeek = parseInt(Math.abs(iDays)/7);
    var day = iDays - iWeek*7;
    obj.days = iDays;
    if (iWeek>0)
    {
    	obj.week = iWeek+"周";
    	if(day!=0)
    		obj.week = obj.week+"零"+day+"天";
    }	
    else
    {
    	obj.week = iDays+"天";
    }
    console.log(obj);
    return obj;  
}

function GetCurday()
{
	var td = $("#rili").find(".select_day");
	if($(td).length==0)
	{
		td = $("#rili").find(".today");
	}
	var year = $(td).attr("year");
	var month = parseInt($(td).attr("month"))+1;
	var day = $(td).find("i").html();
	return year+"-"+month+"-"+day;
}

function ParseRecord()
{
	var day0 = GetCurday();
	

	console.log(g_records);


	var i,j;
	var item="";
	for(i=0;i<g_records.length;i++)
	{
		switch(g_records[i].type)
		{
			case 1:
				for(j=0;j<g_records[i].dates.length;j++)
				{
					var date = g_records[i].dates[j].date;
					console.log(date);
					console.log(day0);
					var obj = DateDiff(day0,date);
					if(obj.days<=0)
						break;

				    item = item + '<div class="recod_item"> \
					<img src="./images/j.png"> \
					<div style="display: inline-block;"> \
					<div class="r_msg"> \
					<span id="r_i_title">'+ g_records[i].title +'</span>&nbsp;·&nbsp;\
					<span id="r_i_msg">'+obj.week+'</span>\
					</div> \
					<div class="r_date">\
					<span>纪念日|'+date+'</span> \
					</div> \
					</div> \
					</div>';
					console.log(item);
					
				}
				break;
			case 2:
				break;
		}
	}
	$(recods).html(item);
}


jQuery.support.cors = true;
$(function() {
	
	//ParseRecord(eval(htmlobj.responseText));
	GetCurday();
});

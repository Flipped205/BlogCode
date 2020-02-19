

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
    obj.w = iWeek;
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

function GetToDay()
{
	var today=new Date();
	var today_year = today.getFullYear();
	var today_month = parseInt(today.getMonth())+1;
	var today_day = today.getDate();

	return today_year+"-"+today_month+"-"+today_day;

}



function ChangeDate(day)
{
	var today = GetToDay();
	var d = day.split("-");

	var s =  d[0]+"年"+parseInt(d[1])+"月"+parseInt(d[2])+"日";

	if(today == day)
		s="至今";
	return s;

}



function HandleJD(data)
{
	var day0 = GetCurday();
	var day1=data[1];
	var html="";
	var msg = data[3];

	var obj = DateDiff(day0,day1);
	if(obj.days<=0)
		return "";

	var w_datas = data[2].split(",");

	for(var i=0;i<w_datas.length;i++)
	{
		console.log(i);
		var ds = w_datas[i].split(".");
		var w = ds[0];
		var m = ds[1];
		if(parseInt(obj.w)+1==parseInt(w))
		{
			html =  '<div class="recod_item"> \
				<img src="./img/j.png"> \
				<div style="display: inline-block;"> \
				<div class="r_msg"> \
				<span id="r_i_title">第'+ w +'周</span>&nbsp;·&nbsp;\
				<span id="r_i_msg">'+m+'</span>\
				</div> \
				<div class="r_date">\
				<span>'+msg+'&nbsp;|&nbsp;'+ChangeDate(day1)+'</span> \
				</div> \
				</div> \
				</div>';
			break;
		} 
	}
	console.log(html);
	return html;
}







function HandleSJD(data)
{
	var curDay = GetCurday();
	var toDay = GetToDay();
	console.log("toDay:"+toDay);

	var day0 = data[1];
	var day1 = data[2];
	var title = data[3];
	var msg = data[4];

	var obj = DateDiff(curDay,day0);
	if(obj.days<=0)
		return ""; 

	if(day1.length<=0)
		day1 = toDay;


	obj = DateDiff(day1,day0);
	if(obj.days<=0)
		return " ";
	html =  '<div class="recod_item"> \
	<img src="./img/r.png"> \
	<div style="display: inline-block;"> \
	<div class="r_msg"> \
	<span id="r_i_title">'+ title +'</span>&nbsp;·&nbsp;\
	<span id="r_i_msg">'+obj.days+'</span>\
	</div> \
	<div class="r_date">\
	<span>'+msg+'&nbsp;|&nbsp;'+ChangeDate(day0)+'~'+ChangeDate(day1)+'</span> \
	</div> \
	</div> \
	</div>';

	return html;
}

function HandleJNR(data)
{
	var day0 = GetCurday();
	var day = data[1];
	var title = data[2];
	var msg = data[3];
	console.log("day:"+day+",title:"+title+",msg:"+msg);



	var obj = DateDiff(day0,day);
	if(obj.days<=0)
		return "";

	html =  '<div class="recod_item"> \
	<img src="./img/j.png"> \
	<div style="display: inline-block;"> \
	<div class="r_msg"> \
	<span id="r_i_title">'+ title +'</span>&nbsp;·&nbsp;\
	<span id="r_i_msg">'+obj.week+'</span>\
	</div> \
	<div class="r_date">\
	<span>'+msg+'&nbsp;|&nbsp;'+ChangeDate(day)+'</span> \
	</div> \
	</div> \
	</div>';

	return html;
}


function ParseRecord()
{
	var day0 = GetCurday();
	
	var html=" ";
	console.log(g_records);

	var records = g_records.split(/[\s\n]/);
	console.log(records.length);
	$(recods).html(html);
	for(var i = 0;i<records.length;i++)
	{
		html="";
		var data = records[i].split(':');
		//console.log(data[0]);
		switch(parseInt(data[0]))
		{
			case 1:
				html=HandleJNR(data);
				break;
			case 2:
				html=HandleJD(data);
				break;
			case 3:
				html=HandleSJD(data);
				break;
			case 4:
				break;
			default:
				break;

		}
		//console.log(html);
		$(recods).append(html);

	}
		
}


jQuery.support.cors = true;
$(function() {
	
	//ParseRecord(eval(htmlobj.responseText));
	GetCurday();
});

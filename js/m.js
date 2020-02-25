
function TimeDiff(date1,date2)
{

	var times = new Date(date1).getTime() - new Date(date2).getTime();
	var days = Math.ceil(times/(1000*3600*24))+1;
	var weeks = parseInt(days/7);

	var obj = new Object();

	obj.days = days;
	obj.weeks = weeks;

	if(weeks>0)
	{
		obj.str1 = weeks+"周";
		if((days-weeks*7)!=0)
		{
			obj.str1 = obj.str1 + "零"+parseInt(days-weeks*7)+"天";
		}


	}
	else
	{
		obj.str1 = days+"天";
	}

//	console.log(new Date(date1).getDate());
//	console.log( new Date(date2).getDate());
	obj.str2=days+"天";
	if(parseInt(new Date(date1).getDate()) == parseInt( new Date(date2).getDate()))
	{
		
		if(days>0)
		{
			if(new Date(date1).getFullYear()==new Date(date2).getFullYear())
			{
				//console.log(parseInt(new Date(date1).getMonth()-new Date(date2).getMonth()));
				obj.str2 = parseInt(new Date(date1).getMonth()-new Date(date2).getMonth())+"月";
			}
			else
			{
				var ms = parseInt(12 - new Date(date2).getMonth() + new Date(date1).getMonth() ) + (new Date(date1).getFullYear()-new Date(date2).getFullYear()-1)*12;
			//	console.log(ms);
				if(ms>=12)
				{
					if(ms%12==0)
					{
						obj.str2  = parseInt(ms/12)+"周年";
					}
					else
					{
						obj.str2 = parseInt(ms/12)+"年零"+parseInt(ms%12)+"个月";
					}
				}
			}
		}

	}
	//console.log(obj);
	//console.log("days:"+days);
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

	var obj = TimeDiff(day0,day1);
	if(obj.days<=0)
		return "";

	var w_datas = data[2].split(",");

	for(var i=0;i<w_datas.length;i++)
	{
		var ds = w_datas[i].split(".");
		var w = ds[0];
		var m = ds[1];
		if(parseInt(obj.weeks)+1==parseInt(w))
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
	return html;
}


function HandleSJD(data) // 时间段
{
	var curDay = GetCurday();
	var toDay = GetToDay();

	var day0 = data[1];
	var day1 = data[2];
	var title = data[3];
	var msg = data[4];

	var obj = TimeDiff(curDay,day0);
	if(obj.days<=0)
		return ""; 

	if(day1.length<=0)
		day1 = toDay;


	obj = TimeDiff(day1,day0);
	if(obj.days<=0)
		return " ";
	html =  '<div class="recod_item"> \
	<img src="./img/r.png"> \
	<div style="display: inline-block;"> \
	<div class="r_msg"> \
	<span id="r_i_title">'+ title +'</span>&nbsp;·&nbsp;\
	<span id="r_i_msg">'+obj.str2+'</span>\
	</div> \
	<div class="r_date">\
	<span>'+msg+'&nbsp;|&nbsp;'+ChangeDate(day0)+'~'+ChangeDate(day1)+'</span> \
	</div> \
	</div> \
	</div>';

	return html;
}

function HadnleSR(data) 
{
	var day = data[1];
	var title = data[2];
	var flag = parseInt(data[3]);
	var msg ="";
	var s_td;
	console.log(day);
	switch(flag)
	{
		case 0:
			title = title+"的农历生日";
			s_em="em[month='"+parseInt(new Date(day).getMonth()+1)+"'][day='"+new Date(day).getDate()+"']";
			if($(s_em).length==0)
				return "";
			s_td = $(s_em).parent("td");
			msg = $(s_td).attr("year")+"年"+$(s_em).attr("monthcn")+$(s_em).html();
			break;
		case 1:
			title = title+"的生日";
			s_td = "td[month="+new Date(day).getMonth()+"][day="+new Date(day).getDate()+"]";
			if($(s_td).length==0)
				return "";
			var m = parseInt($(s_td).attr("month"))+1;
			var d = $(s_td).attr("year")+"-"+m+"-"+$(s_td).attr("day");
			msg = ChangeDate(d);
			break;
	}

	
	
	if($(s_td).length==0)
	{
		return "";
	}
	var html2 = '<i class="point"></i>';
	$(s_td).append(html2)

	var html =  '<div class="recod_item"> \
	<img src="./img/s.png"> \
	<div style="display: inline-block;"> \
	<div class="r_msg"> \
	<span id="r_i_title">'+ title +'</span>\
	</div> \
	<div class="r_date">\
	<span>'+msg+'</span> \
	</div> \
	</div> \
	</div>';

	return html;

}


function HandleJNR(data)  // 纪念日
{
	var day0 = GetCurday();
	var day = data[1];
	var title = data[2];
	var msg = data[3];
	var flag = parseInt(data[4]);
	var tmp1="";
	//console.log("day:"+day+",title:"+title+",msg:"+msg);

	var obj = TimeDiff(day0,day);

	var s = "td[year="+new Date(day).getFullYear()+"][month="+new Date(day).getMonth()+"][day="+new Date(day).getDate()+"]";

	//console.log(s);
	//console.log($(s));
	var html2 = '<i class="point"></i>';
	$(s).append(html2);

	switch(flag)
	{
		case 0:
			tmp1 = obj.str1;
			break;
		case 1:
			tmp1 = obj.str2;
			break;
	}


	if(obj.days<0)
		return "";

	html =  '<div class="recod_item"> \
	<img src="./img/j.png"> \
	<div style="display: inline-block;"> \
	<div class="r_msg"> \
	<span id="r_i_title">'+ title +'</span>&nbsp;·&nbsp;\
	<span id="r_i_msg">'+tmp1+'</span>\
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
	//console.log(g_records);

	var records = g_records.split(/[\s\n]/);
	//console.log(records.length);
	$(recods).html(html);
	for(var i = 0;i<records.length;i++)
	{
		html="";
		var data = records[i].split(':');
		//console.log(data[0]);
		switch(parseInt(data[0]))
		{
			case 1:
				html=HandleJNR(data); // 纪念日
				break;
			case 2:
				html=HandleJD(data); // 阶段
				break;
			case 3:
				html=HandleSJD(data); // 时间段
				break;
			case 5:
				html = HadnleSR(data); // 生日
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

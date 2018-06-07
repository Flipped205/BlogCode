
//是否显示导航栏
var showNavBar = true;
//是否展开导航栏
var expandNavBar = true;

$(document).ready(function(){
	var h1s = $("article").find("h1");
	var h2s = $("article").find("h2");
	var h3s = $("article").find("h3");
	var h4s = $("article").find("h4");
	var h5s = $("article").find("h5");
	var h6s = $("article").find("h6");

	var headCounts = [h1s.length, h2s.length, h3s.length, h4s.length, h5s.length, h6s.length];
	var vH1Tag = null;
	var vH2Tag = null;
	var vH3Tag = null;
	var vH4Tag = null;
	var vH5Tag = null;
	var vH6Tag = null;
	var vHTags = new Array();
	for(var i = 0; i < headCounts.length; i++)
	{
		if(headCounts[i] > 0)
		{
			vHTags[i] = 'h' + (i+1);
		}
	}
	$("div.menu").prepend('<div class="BlogAnchor">' + 
		'<p>' + 
		'<b id="AnchorContentToggle" title="展开" style="cursor:pointer;">目录▼</b>' + 
		'</p>' + 
		'<div class="AnchorContent" id="AnchorContent"> </div>' + 
		'</div>' );

	var vHIndexs = new Array(6);
	var vH1Index = 0;
	var vH2Index = 0;
	var vH3Index = 0;
	var vH4Index = 0;
	var vH5Index = 0;
	var vH6Index = 0;
	for (var i = 0; i < vHIndexs.length; i++)
	{
		vHIndexs[i] = 0;
	}
	$(".menu").parent(".post-content").find("h1,h2,h3,h4,h5,h6").each(function(i,item){
		var id = '';

		var name = '';
		var tag = $(item).get(0).tagName.toLowerCase();

		var className = '';
		for (var j = 0; j < vHTags.length; j++) {
			if(tag == vHTags[j])
			{
				if(j+1<vHTags.length)
					vHIndexs[j+1]= 0;
				var t_id = '';
				for (var k = 0; k < j; k++) {
					t_id += (vHIndexs[k])+'_';
				}
				t_id +=''+ (++vHIndexs[k]);
				id = t_id;
			}
		}

		className = 'item_' + tag;

		$(item).attr("id","wow"+id);
		$(item).addClass("wow_head");
		$("#AnchorContent").css('display','none');
		$("#AnchorContent").append('<a class="nav_item '+className+' anchor-link" onclick="return false;" href="#" link="#wow'+id+'">'+$(this).text()+'</a>');
	});

	$("#AnchorContentToggle").click(function(){
		var text = $(this).html();
		if(text=="目录▲"){
			$(this).html("目录▼");
			$(this).attr({"title":"展开"});
		}else{
			$(this).html("目录▲");
			$(this).attr({"title":"收起"});
		}
		$("#AnchorContent").toggle();
	});
	$(".anchor-link").click(function(){
		$("html,body").animate({scrollTop: $($(this).attr("link")).offset().top}, 500);
	});

	var headerNavs = $(".BlogAnchor li .nav_item");
	var headerTops = [];
	$(".wow_head").each(function(i, n){
		headerTops.push($(n).offset().top);
	});
	$(window).scroll(function(){
		var scrollTop = $(window).scrollTop();
		$.each(headerTops, function(i, n){
			var distance = n - scrollTop;
			if(distance >= 0){
				$(".BlogAnchor li .nav_item.current").removeClass('current');
				$(headerNavs[i]).addClass('current');
				return false;
			}
		});
	});
	if(!showNavBar){
		$('.BlogAnchor').hide();
	}
	if(!expandNavBar){
		$(this).html("目录▼");
		$(this).attr({"title":"展开"});
		$("#AnchorContent").hide();
	}

	$('.code .line').each(function(i,item){
		var str = $(item).html();
		var s = str.indexOf('\`')+1;
		var e = str .lastIndexOf("\`"); 
		var t = str.substring(s,e);
		if(t!=""){
			var a1 = str.substring(0,s-1);
			var a2 = str.substring(e+1,str.length);
			t = t.replace(/class=/g,"");
			var s = '<span class="comment_m">' + t +'</span>';
			$(item).html(a1+s+a2);
		}
	});
	$(".post-content img").click(function(){
		var img_src = $(this).attr("src");
		$(".box_center .box_i img").attr("src",img_src);
		var h = $(window).height();
		var w = $(window).width();
		var bl = w/h;
		var t_w = 0;
		var t_h = 0;
		var i_h = $(this).height();
		var i_w = $(this).width();
		var i_bl = i_w/i_h;
		var box_i_t = 0;

		if(bl<i_bl){
			t_w = w*0.85;
			t_h = t_w*(1/i_bl);
			box_i_t = ((1-(t_h/h))/2)*h;
		}else{
			t_h = h*0.85;
			t_w = t_h*i_bl;
			box_i_t = h*0.05;
		}
		if(t_w<i_w){
			t_w = i_w;
			t_h = i_h;
		}
		var time_i = 0;
		var time1;
		if(t_h+50>h){
			$(".box_center").height(h-100);
			$(".box_center").css("overflow-y","scroll");
		}else{
			$(".box_center").height(t_h+$(".box_close").height()+50);
			$(".box_center").css("overflow-y","hidden");
		}
		


		time_i=$(this).parent().height();
		if(time_i*i_bl>w-10)
			return ;

		$(".box_center").width(t_w+50);
		$(".box_bk").show();
		$(".box_center").show();
		$(".box_center .box_close").hide();

		time1 = setInterval(function(){
			time_i+=5;

			var h_i = time_i;
			var w_i = h_i*i_bl;
			var box_i_tt = box_i_t +(t_h - h_i)/2;
			if(box_i_tt<50)
				box_i_tt=50;
			$(".box_center").css("top",box_i_tt+"px");
			$(".box_i img").width(w_i);
			$(".box_i img").height(h_i);
			if(h_i>=t_h || w_i >= t_w){
				$(".box_center").width(w_i+30);
				//$(".box_center").height(h_i+$(".box_close").height()+10);
				$(".box_close").width(w_i);
				$(".box_close").show();
				clearInterval(time1);
			}
		},10);
		$(".box_i img").height(t_h);
		$(".box_i img").width(t_w);
	});
	$(".box_close img").click(function(){
		$(this).parent().hide();
		$(".box_center").css("overflow-y","hidden");
		var box_i = $(this).parent().prev(".box_i");
		var h = $(box_i).height();
		var w = $(box_i).width();
		var box_i_t = $(".box_center").css("top");
		var i_bl = w/h;
		var i=h;
		var time1 = setInterval(function(){
				i=i-10 ;
				var h_i = i;
				var w_i = i*i_bl;
				var box_i_tt = box_i_t -(h-h_i)/2;
				$(".box_center").css("top",box_i_tt+"px");
				$(".box_i img").width(w_i);
				$(".box_i img").height(h_i);
				if(h_i<=10 || w_i<=10){
					$(".box_bk").hide();
					$(".box_center").hide();
					clearInterval(time1);
				}

		},10);
	});



	var post_content = $(".web_site").parent(".post-body");
//	console.log(post_content);
	$(post_content).find("p a").each(function(i,item){
		var p = $(this).parent("p");
		var html = $(p).html();
		$(p).after("<div class='link_div'><div class='link_bk_line'></div>"+html+"</div>");
		$(p).remove();
	});

	$(".post-content").find("a").each(function(){
		var title = $(this).attr("title");
		if(title){
			$(this).attr("data-intro",title);
			$(this).attr("title","");
		}
	});

	$(".post-content").find("a").hover(function(){
		var title = $(this).attr("data-intro");
		var left = $(this).offset().left+$(this).outerWidth()/2;
		if(title){
			var adddiv = '<div class="grumble" style="left:'+left+'px";display:none>'+title+'</div>';
			$("body").prepend(adddiv);
			$(".grumble").css("top",$(this).offset().top-$(".grumble").height()-$(this).outerHeight());
			$(".grumble").show();
		}
	},function(){
		$(".grumble").remove();
	});
	$(".post-content").mousemove(function(e){
		//console.log($(e.target));
		var class_name = $(e.target).attr("class");
		if(class_name && class_name.indexOf("link_div")>=0){
			$(".link_div").removeClass("link_active");
			$(e.target).addClass("link_active");
		}else{
			$(".post-content").find(".link_div").each(function(){
				$(this).removeClass("link_active");
			});
		}
	});
	$(".post-content").mousemove();
});
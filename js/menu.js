
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
    for(var i = 0; i < headCounts.length; i++){
        if(headCounts[i] > 0){
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
    for (var i = 0; i < vHIndexs.length; i++) {
        vHIndexs[i] = 0;
    }
    $(".menu").parent(".post-content").find("h1,h2,h3,h4,h5,h6").each(function(i,item){

    var id = '';
    var name = '';
    var tag = $(item).get(0).tagName.toLowerCase();

    var className = '';
    for (var j = 0; j < vHTags.length; j++) {
        if (tag == vHTags[j]) {
            if (j+1 < vHTags.length)
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
    if (text=="目录▲") {
        $(this).html("目录▼");
        $(this).attr({"title":"展开"});
    } else {
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
    if (t!="") {
        var a1 = str.substring(0,s-1);
        var a2 = str.substring(e+1,str.length);
        t = t.replace(/class=/g,"");
        var s = '<span class="comment_m">' + t +'</span>';
        $(item).html(a1+s+a2);
    }
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

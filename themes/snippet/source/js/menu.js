
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

$(document).ready(function() {
	var href = window.location.href;
	var host = "http://"+window.location.host+'/';
	var filter = 'color';  // threshold, color
	var imagePath = host+"img/qrcode.jpg";
	function makeQArt() {
		new QArt({
			value: href,
			imagePath: imagePath,
			filter: filter,
		}).make(document.getElementById('combine'));
	}
	if($("#combine").length>0){
		makeQArt();
	}
});

/*
 *  复制Code到剪贴板
 */

$(document).ready(function(){

	/*
	 * Code 添加复制按钮
	 */
	var html = '<div class="copy">复制</div>';
	$("figure").append(html);
	$("figure").mouseover(function(){
		$(this).find(".copy").show();
	});
	$("figure").mouseout(function(){
		$(this).find(".copy").hide();
	});



	String.prototype.replaceAll = function (FindText, RepText) {
		regExp = new RegExp(FindText, "g");
		return this.replace(regExp, RepText);
	}

	/*
	 * 复制按钮操作
	 */
	var cur_copy;
	var clipboard = new ClipboardJS('.copy', {
			text: function(e) {
				console.log($(e));
				cur_copy = e;
				var content = $(e).parent().find(".code").html();
				console.log(content);
				var str="";
				var f=0;
				var j=0;
				for(var i=0;i<content.length;i++)
				{
					str[i]=' ';
					if(content[i]=='>'){
						f=1;
						j++;
						if(i>4)
						{
							if(content[i-1]=='r' && content[i-2]=='b'&& content[i-3]=='<')
								str+='\n';
						}
						continue;
					}
					if(content[i]=='<'){
						f=0;
						j=1;
					}
					if(f==1){
						str+=content[i];
					}
				}
				
				console.log(str);
				return str;
			}
		});
		clipboard.on('success', function(e) {
			$(cur_copy).width(70);
			$(cur_copy).html("复制成功");

			setTimeout(function(){
				$(cur_copy).width(50);
				$(cur_copy).html('复制');
			},500)
		});

		clipboard.on('error', function(e) {
			alert(e);
		});
});

/*
 *
 *  Clock 显示
 * 
 */

$(document).ready(function () {
    if($("#clock").length<=0)
        return;
    /**
     * @constructor
     */
    var Clock = function () {
        /**
         * @type {Clock}
         */
        var me = this;

        var config = {
            starCount: 500,
            showFps: true,
            drawDigital: true,
            star: {
                minOpacity: 0.1,
                fade: true,
                fadeSpeed: 0.02,
                color: '#0a0'
            },
            hour: {
                foreground: '#aaa',
                background: '#000',
                width: 3,
            },
            minute: {
                foreground: '#aaa',
                background: '#000',
                width: 3,
            },
            second: {
                foreground: '#aaa',
                background: '#000',
                width: 3,
            },
            milli: {
                foreground: 'rgba(0,0,0,0.1)',
                background: '#000',
                width: 3,
            }
        }

        /**
         * @type {Element}
         */
        var canvas = document.createElement('canvas');

        /**
         * @type {CanvasRenderingContext2D}
         */
        var engine = canvas.getContext('2d');

        /**
         * requestor
         * @type {*|Function}
         */
        var frame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function (
                cb) {
                return setTimeout(cb, 30)
            };

        /**
         * @type {{}}
         */
        var star = [];

        /**
         *
         * @type {number}
         */
        var size = 0.9;

        /**
         * @type {number}
         */
        var radius = size / 2;

        /**
         * @type {Date}
         */
        var current = null;

        /**
         * @type {{refresh: number, tick: number, start: Date}}
         */
        var fps = {
            val: 0,
            refresh: 50,
            tick: 0,
            start: new Date()
        };

        /**
         * @type {{width: number, height: number, size: number, radius: number, middle: number}}
         */
        var meta = {
            width: 0,
            height: 0,
            size: 0,
            radius: 0,
            middle: 0
        };

        /**
         * init
         */
        this.run = function () {
            generateStar();
          //  document.body.appendChild(canvas);
            document.getElementById("clock").appendChild(canvas);

            //canvas.setAttribute('width', window.innerWidth);
           // canvas.setAttribute('height', window.innerHeight);
            $("#clock").height($("#clock").width()/1.618);
            canvas.setAttribute('width', $("#clock").width());
            canvas.setAttribute('height', $("#clock").height());

            frame(tick);
        };

        /**
         * render frame
         */
        var tick = function () {
            current = new Date();
            solveMeta();

            engine.fillStyle = '#000';
            engine.clearRect(0, 0, meta.width, meta.height);
            engine.fillRect(0, 0, meta.width, meta.height);

            //draw part
            drawFps();
            drawStar();

            drawBackgroundTime();
            drawPattern();
            drawForegroundTime();

            drawDigital();

            frame(tick);
        };

        /**
         * draw digital watch
         */
        var drawDigital = function () {
            if (config.drawDigital) {
                var time = [
                n(current.getHours()),
                current.getSeconds() % 2 ? ':' : ' ',
                n(current.getMinutes())
                ].join('');

                var size = 30;
                var padding = 10;
                engine.font = size + 'px Arial';
                var m = engine.measureText(time);

                //engine.fillStyle = 'rgba(0,0,0,0.5)';
                //engine.fillRect(
                //    meta.middle.x - m.width / 2 - padding,
                //    meta.middle.y - size / 2 - padding,
                //    m.width + padding * 2,
                //    size + padding * 2
                //);

                engine.fillStyle = '#fff';
                engine.fillText(
                    time,
                    meta.middle.x - m.width / 2,
                    meta.middle.y + size / 2);
            }
        };

        /**
         * @param ne
         * @returns {*}
         */
        var n = function (ne) {
            if (ne < 10) {
                return '0' + ne;
            }

            return ne;
        };

        /**
         * draw lines for evers hour and minute
         */
        var drawPattern = function () {
            //#1
            engine.strokeStyle = 'rgba(255,255,255,0.2)';
            engine.lineWidth = 2;

            engine.beginPath();
            engine.arc(meta.middle.x, meta.middle.y, meta.radius * 0.8 - meta.radius / 12, 0, Math.PI * 2);
            engine.stroke();
            engine.closePath();

            //#1.5
            engine.strokeStyle = 'rgba(255,255,255,0.2)';
            engine.beginPath();
            engine.arc(meta.middle.x, meta.middle.y, meta.radius * 0.8 + meta.radius / 12, 0, Math.PI * 2);
            engine.stroke();
            engine.closePath();

            //#2
            engine.strokeStyle = 'rgba(0,0,0,0.5)';
            engine.lineWidth = meta.radius / 6;

            engine.beginPath();
            engine.arc(meta.middle.x, meta.middle.y, meta.radius * 0.8, 0, Math.PI * 2);
            engine.stroke();
            engine.closePath();


            var angleWidth = Math.PI * 2 / 60;
            var seconds = current.getSeconds() + current.getMilliseconds() / 1000;

            for (var i = 0; i < 60; i++) {
                var angleMid = i * angleWidth - 0.5 * Math.PI;
                var startAngle = angleMid - Math.PI / 500;
                var endAngle = angleMid + Math.PI / 500;

                //var opa = (60 - seconds + i - 1) % 60;
                //
                //engine.strokeStyle = 'rgba(' + [255, 255, 255, opa / 60].join(',') + ')';

                if (i === parseInt(seconds)) {
                    engine.strokeStyle = '#0a0';
                } else {
                    var opa = 1 - Math.min(
                        Math.abs(i - 60 - seconds),
                        Math.abs(i - seconds),
                        Math.abs(i + 60 - seconds)) / 15;

                    engine.strokeStyle = 'rgba(' + [255, 255, 255, opa].join(',') + ')';
                }


                engine.lineWidth = meta.radius / 20;

                engine.beginPath();
                engine.arc(meta.middle.x, meta.middle.y, meta.radius * 0.8, startAngle, endAngle);
                engine.stroke();
                engine.closePath();
            }

            angleWidth = Math.PI * 2 / 12;

            for (var i = 0; i < 12; i++) {
                var angleMid = i * angleWidth - 0.5 * Math.PI;
                var startAngle = angleMid - Math.PI / 200;
                var endAngle = angleMid + Math.PI / 200;

                engine.strokeStyle = 'rgba(255,255,255,0.6)';
                engine.lineWidth = meta.radius / 7;

                engine.beginPath();
                engine.arc(meta.middle.x, meta.middle.y, meta.radius * 0.75, startAngle, endAngle);
                engine.stroke();
                engine.closePath();
            }
        }

        /**
         * draw background clock
         */
        var drawBackgroundTime = function () {
            drawBackgroundTimePart(meta.radius / 3 + 20, current.getHours() + current.getMinutes() / 60, 12, config.hour);
            drawBackgroundTimePart(meta.radius * 0.65 + 20, current.getMinutes() + current.getSeconds() / 60, 60,
                config.minute);
            drawBackgroundTimePart(meta.radius + 20, current.getSeconds() + current.getMilliseconds() / 1000, 60,
                config.second);
        };

        /**
         * draw foreground clock
         */
        var drawForegroundTime = function () {
            drawTimePart(meta.radius / 3, current.getHours() + current.getMinutes() / 60, 12, config.hour);
            drawTimePart(meta.radius * 0.65, current.getMinutes() + current.getSeconds() / 60, 60, config.minute);
            drawTimePart(meta.radius, current.getSeconds() + current.getMilliseconds() / 1000, 60, config.second);

            drawTimePart(meta.radius / 15, current.getMilliseconds(), 1000, config.milli, true);
            drawTimePart(meta.radius / 15, current.getMilliseconds() + 250, 1000, config.milli, true);
            drawTimePart(meta.radius / 15, current.getMilliseconds() + 500, 1000, config.milli, true);
            drawTimePart(meta.radius / 15, current.getMilliseconds() + 750, 1000, config.milli, true);
        };

        /**
         * draw bg time part
         *
         * @param {number} radius
         * @param {number} time
         * @param {number} maxTime
         * @param {{}} config
         */
        var drawBackgroundTimePart = function (radius, time, maxTime, config) {
            engine.globalAlpha = 0.5;

            var angleWidth = Math.PI * 2 / maxTime;
            var angleMid = time * angleWidth - 0.5 * Math.PI;
            var startAngle = angleMid - Math.PI / 1.5;
            var endAngle = angleMid + Math.PI / 1.5;

            engine.fillStyle = config.background;

            //### 1
            var grd = engine.createRadialGradient(meta.middle.x, meta.middle.y, radius / 2, meta.middle.x, meta.middle.y,
                radius);
            grd.addColorStop(0, 'rgba(0,0,0,0)');
            grd.addColorStop(1, config.background);
            engine.fillStyle = grd;

            engine.beginPath();
            engine.moveTo(meta.middle.x, meta.middle.y);
            engine.arc(meta.middle.x, meta.middle.y, radius, startAngle, endAngle);
            engine.fill();
            engine.closePath();

            //### 2
            grd = engine.createRadialGradient(meta.middle.x, meta.middle.y, radius / 2, meta.middle.x, meta.middle.y,
                radius);
            grd.addColorStop(0, 'rgba(0,0,0,0)');
            grd.addColorStop(1, 'rgba(0,200,0,0.5)');
            engine.fillStyle = grd;

            engine.beginPath();
            engine.moveTo(meta.middle.x, meta.middle.y);
            engine.arc(meta.middle.x, meta.middle.y, radius, startAngle + Math.PI / 2, endAngle - Math.PI / 2);
            engine.fill();
            engine.closePath();

            engine.globalAlpha = 1;
        }

        /**
         * draw time part
         *
         * @param {number} radius
         * @param {number} time
         * @param {number} maxTime
         * @param {{}} config
         */
        var drawTimePart = function (radius, time, maxTime, config, anti) {
            var angleWidth = Math.PI * 2 / maxTime;
            var angleMid = time * angleWidth - 0.5 * Math.PI;
            var length = 8;

            if (anti) {
                angleMid = 0 - angleMid;
                length = 8;
            }

            var startAngle = angleMid - Math.PI / length;
            var endAngle = angleMid + Math.PI / length;

            engine.strokeStyle = config.foreground;
            engine.lineWidth = config.width;

            engine.beginPath();
            engine.arc(meta.middle.x, meta.middle.y, radius - config.width, startAngle, endAngle);
            engine.stroke();
            engine.closePath();


            if (!anti) {
                engine.strokeStyle = '#fff';
                engine.lineWidth = 20;

                engine.beginPath();
                engine.arc(meta.middle.x, meta.middle.y, radius, angleMid - 0.01, angleMid + 0.01);
                engine.stroke();
                engine.closePath();
            }
        }

        /**
         * solve and render fps
         */
        var drawFps = function () {
            if (config.showFps) {
                fps.tick--;

                if (fps.tick <= 0) {
                    var diffTime = (new Date() - fps.start) / 1000;
                    fps.val = parseInt(fps.refresh / diffTime * 10) / 10;
                    fps.start = new Date();
                    fps.tick = fps.refresh;
                }

                engine.font = '10px Arial';
                engine.fillStyle = '#fff';
                engine.fillText(fps.val + ' fps | ' + [
                n(current.getHours()),
                current.getSeconds() % 2 ? ':' : ' ',
                n(current.getMinutes()),
                current.getSeconds() % 2 ? ':' : ' ',
                n(current.getSeconds())
                ].join(''), 5, meta.height - 5);
            }
        }

        /**
         * generate Star line setup
         */
        var generateStar = function () {
            for (var i = 0; i < config.starCount; i++) {
                star.push({
                    width: Math.random(),
                    deg: Math.random() * 360,
                    color: Math.random(),
                    colorDir: Math.random() < 0.5 ? config.star.fadeSpeed : -config.star.fadeSpeed
                });
            }
        }

        /**
         * height of canvas
         * @returns {string}
         */
        var width = function () {
            return canvas.getAttribute('width');
        }

        /**
         * height of canvas
         * @returns {string}
         */
        var height = function () {
            return canvas.getAttribute('height');
        }

        /**
         * get mid coords from the clock
         * @returns {{x: number, y: number}}
         */
        var middle = function () {
            return {
                x: width() / 2,
                y: height() / 2
            };
        }

        /**
         * cache size properties
         */
        var solveMeta = function () {
            meta.width = width();
            meta.height = height();
            meta.radius = Math.min(meta.width, meta.height) * radius;
            meta.size = Math.min(meta.width, meta.height);
            meta.middle = middle();
        }

        /**
         * draw clock star lines
         */
        var drawStar = function () {
            engine.strokeStyle = config.star.color;

            for (var i = 0; i < star.length; i++) {
                var starLine = star[i];
                var relX = Math.sin(starLine.deg / 360 * Math.PI * 2);
                var relY = Math.cos(starLine.deg / 360 * Math.PI * 2);

                engine.beginPath();

                engine.moveTo(
                    meta.middle.x,
                    meta.middle.y);

                engine.lineTo(
                    meta.middle.x + relX * starLine.width * meta.radius,
                    meta.middle.y + relY * starLine.width * meta.radius);

                engine.lineWidth = parseInt((1 - starLine.width) * 5);

                if (config.star.fade) {
                    engine.globalAlpha = config.star.minOpacity + (1 - config.star.minOpacity) * starLine.color;
                    starLine.color += starLine.colorDir;

                    if (starLine.color >= 1 || starLine.color <= 0) {
                        starLine.color = starLine.color | 0;
                        starLine.colorDir = -starLine.colorDir;
                    }
                }

                engine.stroke();
                engine.closePath();
            }

            engine.globalAlpha = 1;
        }
    };

    var c = new Clock();
    c.run();
});
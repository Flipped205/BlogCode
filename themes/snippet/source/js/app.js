/*!========================================================================
 *  hexo-theme-snippet: app.js v1.0.0
 * ======================================================================== */
window.onload = function() {
    var $body = document.body,
        $mnav = document.getElementById("mnav"), //获取导航三角图标
        $mainMenu = document.getElementById("main-menu"), //手机导航
        $process = document.getElementById('process'), //进度条
        $ajaxImgs = document.querySelectorAll('.img-ajax'), //图片懒加载
        $commentsCounter = document.getElementById('comments-count'),
        $gitcomment = document.getElementById("gitcomment"),
        $backToTop = document.getElementById("back-to-top"),
        timer = null;

    //设备判断
    var isPC = true;
    (function(designPercent) {
        function params(u, p) {
            var m = new RegExp("(?:&|/?)" + p + "=([^&$]+)").exec(u);
            return m ? m[1] : '';
        }
        if (/iphone|ios|android|ipod/i.test(navigator.userAgent.toLowerCase()) == true && params(location.search, "from") != "mobile") {
            isPC = false;
        } 
    })();

    //手机菜单导航
    $mnav.onclick = function(){  
        var navOpen = $mainMenu.getAttribute("class");
        if(navOpen.indexOf("in") != '-1'){
            $mainMenu.setAttribute("class","collapse navbar-collapse"); 
        } else {
            $mainMenu.setAttribute("class","collapse navbar-collapse in");
        }
    };

    //首页文章图片懒加载
    function imgsAjax($targetEles) {
        if (!$targetEles) return;
        var _length = $targetEles.length;
        if (_length > 0) {
            var scrollBottom = getScrollTop() + window.innerHeight;
            for (var i = 0; i < _length; i++) {
                (function(index) {
                    var $this = $targetEles[index];
                    var $this_offsetZero = $this.getBoundingClientRect().top + window.pageYOffset - document.documentElement.clientTop;
                    if (scrollBottom >= $this_offsetZero && $this.getAttribute('data-src') && $this.getAttribute('data-src').length > 0) {
                        if ($this.nodeName.toLowerCase() === 'img') {
                            $this.src = $this.getAttribute('data-src');
                            $this.style.display = 'block';
                        } else {
                            var imgObj = new Image();
                            imgObj.onload = function() {
                                $this.innerHTML = "";
                            };
                            imgObj.src = $this.getAttribute('data-src');
                            $this.style.backgroundImage = "url(" + $this.getAttribute('data-src') + ")";
                        }
                        $this.removeAttribute('data-src'); //为了优化，移除
                    }
                })(i);
            }
        }
    }

    //获取滚动高度
    function getScrollTop() {
        return ($body.scrollTop || document.documentElement.scrollTop);
    }
    //滚动回调
    var scrollCallback = function() {
        if ($process) {
            $process.style.width = (getScrollTop() / ($body.scrollHeight - window.innerHeight)) * 100 + "%";
        }
        (isPC && getScrollTop() >= 300) ? $backToTop.removeAttribute("class","hide") : $backToTop.setAttribute("class","hide");
        imgsAjax($ajaxImgs);
    };
    scrollCallback();

    //监听滚动事件
    window.addEventListener('scroll', function() {
        clearTimeout(timer);
        timer = setTimeout(function fn() {
            scrollCallback();
        }, 200);
    });

    //返回顶部
    $backToTop.onclick = function() {
       cancelAnimationFrame(timer);
       timer = requestAnimationFrame(function fn() {
          var sTop = getScrollTop();
          if (sTop > 0) {
             $body.scrollTop = document.documentElement.scrollTop = sTop - 50;
             timer = requestAnimationFrame(fn);
         } else {
             cancelAnimationFrame(timer);
         }
     });
   };
};

// 评论 Valine
$(function(){
    new Valine({
       el: '#vcomments',
       appId: 'AkdVyeGCGyETIJ9igXR9YjaA-gzGzoHsz',
       appKey: 'EJDh2xilyKqFAi2IwiVDTcLV'
   })
});


// 图片放大查看
$(function(){
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

        if (bl<i_bl) {
            t_w = w*0.85;
            t_h = t_w*(1/i_bl);
            box_i_t = ((1-(t_h/h))/2)*h;
        } else {
            t_h = h*0.85;
            t_w = t_h*i_bl;
            box_i_t = h*0.05;
        }
        if (t_w<i_w){
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
            if (h_i>=t_h || w_i >= t_w) {
                $(".box_center").width(w_i+30);
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
            if (h_i<=10 || w_i<=10) {
                $(".box_bk").hide();
                $(".box_center").hide();
                clearInterval(time1);
            }
        },10);
    });
})


// 文章二维码生成
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

// 复制Code到剪贴板
$(document).ready(function(){
    // Code内添加复制按钮
    var html = '<div class="copy">复制</div>';
    $("figure").append(html);
    
    // 鼠标进入代码，按钮隐藏与显示
    $("figure").mouseover(function(){
        $(this).find(".copy").show();
    });
    $("figure").mouseout(function(){
        $(this).find(".copy").hide();
    });



    // String.prototype.replaceAll = function (FindText, RepText) {
    //     regExp = new RegExp(FindText, "g");
    //     return this.replace(regExp, RepText);
    // }

    // 复制按钮操作
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
        for (var i=0;i<content.length;i++) {
            str[i]=' ';
            // 标签的结束
            if (content[i] == '>'){
                f=1;
                j++;
                if ( i > 4) {
                    // 处理 <br> 为换行
                    if ( content[i-1] == 'r' && content[i-2] == 'b'&& content[i-3] == '<')
                        str+='\n';
                }
                continue;
            }
            // 标签的开始
            if(content[i]=='<'){
                f=0;
                j=1;
            }
            // 复制标签结束后的内容，即标签内容，也是Code
            if(f==1) {
                str+=content[i];
            }
        }
        console.log(str);
        return str;
        }
    });

    // 复制成功
    clipboard.on('success', function(e) {
        $(cur_copy).width(70);
        $(cur_copy).html("复制成功");

        setTimeout(function(){
            $(cur_copy).width(50);
            $(cur_copy).html('复制');
        },500)
    });

    //复制错误
    clipboard.on('error', function(e) {
        alert(e);
    });

});


// img 添加图片标注
$(function(){
    $("img").each(function(){
        var alt=$(this).attr("alt");
        var img_width = $(this).width();
        if(alt!=undefined){
            console.log(alt);
            var html = '<span class="img_alt" style="width:'+img_width+'px;">'+alt+'</span>'
            $(this).after(html);
        }
    });
});
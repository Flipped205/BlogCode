---
title: HTTPD简介
categories:
- 工作
tags:
- HTTPD
other: work_05
date: 2018-08-02
---

## **1 前言**
本文档以K2S为例，简要说明Broadcom平台的网络服务器httpd的实现原理，使大家对httpd有个简单的认识，在遇到问题时能够有初步的定位。
## **2 连接篇**
### **2.1 http协议**
浏览器与服务器之间的通信，遵循的是HTTP协议，HTTP是一种超文本传送协议（HyperText Transfer Protocol）,是一套计算机在网络中通信的一种规则。
HTTP协议基于TCP，默认采用80端口，在TCP/IP体系结构中，HTTP属于应用层协议，位于TCP/IP协议的顶层。
HTTP是一种无状态的的协议，意思是指 在Web 浏览器（客户端）和 Web 服务器之间不需要建立持久的连接。整个过程就是当一个客户端向服务器端发送一个请求(request)，然后Web服务器返回一个响应 (response),之后连接就关闭了，在服务端此时是没有保留连接的信息。

### **2.2 连接过程**
下图为浏览器和httpd在一次请求回复时经历的主要过程:
<div align="center">![](/img/work_05/01.png)</div>
httpd进程启动以后，会先进行初始化，包括创建套接字、绑定端口、设置监听等操作，此时httpd会一直被动监听80端口的变化。
客户端的 connect() 函数能为客户端主动连接服务器，建立连接是通过三次握手，而这个连接的过程是由内核完成，不是这个函数完成的，这个函数的作用仅仅是通知 Linux 内核，让 Linux 内核自动完成 TCP 三次握手连接（三次握手详情，请看《浅谈 TCP 三次握手》），最后把连接的结果返回给这个函数的返回值（成功连接为0， 失败为-1）。通常的情况，客户端的 connect() 函数默认会一直阻塞，直到三次握手成功或超时失败才返回（正常的情况，这个过程很快完成）。
之后，httpd的accept()函数从处于 established 状态的连接队列头部取出一个已经完成的连接，如果这个队列没有已经完成的连接，accept()函数就会阻塞，直到取出队列中已完成的用户连接为止。至此，浏览器与httpd的连接建立完成，之后就可以通过IO操作进行请求的读取和发送。
<div align="center">![](/img/work_05/02.png)</div>

例如，我们在浏览器地址栏中输入192.268.2.1/#/pc/wifiSet，浏览器会与httpd建立连接，并将上图中的请求数据发送给httpd。

HTTP协议的请求和响应都是一段按一定规则组织起来的文本，其请求的头部包括请求行（请求方式method、请求的路径path、协议版本protocol），请求头标（一系列key：value形式组织的文本行，如第二行指出了该请求的目的主机是192.168.2.1），空行（分隔请求头部与数据）和请求数据。
httpd处理这段文本的逻辑在下一篇中介绍。
httpd处理完成之后，会向浏览器响应数据，响应请求的头部同样是一段按一定规则组织起来的文本，响应的头部包括状态行（HTTP版本protocol,响应代码和响应描述）、响应头标（一系列key：value形式组织的文本行）、空行、响应数据。

<div align="center">![](/img/work_05/03.png)</div>

之后就是浏览器和httpd各自关闭连接，一次完整的请求完成。

## **3 逻辑篇**
### **3.1 mime_handler**
想要理解httpd，最重要的是要理解一个结构体即mime_handler
```c
struct mime_handler {
    char *pattern;                    //用于匹配文件的pattern
    char *mime_type;
    char *extra_header;
    void (*input)(char *path, FILE *stream, int len, char *boundary);
    void (*output)(char *path, FILE *stream);
    void (*auth)(char *userid, char *passwd, char *realm);
};

struct mime_handler mime_handlers[] = {
     { "upgrade.cgi*", "text/html", no_cache, do_upgrade_post, do_upgrade_cgi, do_auth },
}:
```

- `pattern`是用来匹配函数入口的，如果文件名与pattern指定的模式匹配，则通过input和output指定的函数进行处理，支持通过‘`?`’匹配任意一个字符，‘`*`’匹配‘`/`’以外的所有字符，‘`**`’匹配任意字符；
- `mime_type`是HTTP协议中规定的数据类型，指定了HTTP请求和回复需要遵循的格式，HTTP/1.0版规定，头信息必须是 ASCII 码，后面的数据可以是任何格式。因此，服务器回应的时候，必须告诉客户端，数据是什么格式，这就是Content-Type字段的作用
- `extra_header`是需要在回复中添加的头部字段，用于一些特殊的操作，上例中的no_cache完整内容如下，指定了客户端的缓存请求：
```html
 "Cache-Control: no-cache\r\n"
 "Pragma: no-cache\r\n"
 "Expires: 0"；
```

- `input`函数指定了在发送响应HTTP头部以前，需要进行的处理，包括将HTTP请求中的内容解析出来，特别是一些关键的参数，并将其保存在哈希表中，上例中do_upgrade_post在这个阶段会持续接收浏览器发过来的升级包；
- `output`函数指定了如何进行回复的操作，包括回复以后的操作，上例中do_upgrade_cgi会对接收到的升级包进行检查，无误后将结果返回给浏览器，，同时发送信号给RC完成后续的写flash和重启操作；
- `do_auth`函数指定了对该请求的鉴权操作，判断该请求是否经过认证（K2S中采用单独的一套鉴权操作）

### **3.2 处理过程**
以http://192.168.2.1/#/wifiConfig为例，下图为整个过程的数据流图和处理流程图
<div align="center">![](/img/work_05/04.png)</div>

- 1. 浏览器中输入URL：http://192.168.2.1/#/pc/wifiSet;
- 2. 前端预加载的routing.js判断浏览器所属的设备是否为移动设备，决定应该加载pc页面还是h5页面，本例在PC上测试，故解析结果为192.168.2.1/pc/wifiConfig.htm;
- 3. 浏览器生成HTTP请求，并发送出去，其中包括请求的头部和数据内容，本例为页面请求，没有数据内容，故只包含头部；
- 4. httpd在监听到80端口有变化的情况下，则通过accept、fdopen打开stream进行数据读取和写入；
- 5. 从HTTP头部的第一行读出请求的文件为/pc/wifiConfig.htm，该路径为相对www的相对路径；
- 6. 通过匹配Host字段，解析出请求的主机，判断该请求是否是发送到本机的，如果此时需要DNS劫持，则发送重定向将请求定向到路由器的管理页面；
- 7. 通过匹配mac地址是否经过鉴权，判断是否需要发送未认证响应；
- 8. 通过pattern匹配找到相应的处理逻辑，{ "**.html", "text/html", no_cache, NULL, do_ej, do_auth },
- 9. 由于input函数为NULL，无需预处理；
- 10. send_headers将响应的头部写入stream；
- 11. output函数为do_ej，该函数会查找wifiConfig.htm文件中的<%%>,并将其中包括的函数用函数执行的结果替换，如将var wirelessChannel2G = '<% nvram_get("pc_show_2_chanspec"); %>'替换为var wirelessChannel2G = “0”，并将该文件写入stream；
- 12. httpd关闭stream，发送数据；
- 13. 浏览器结束数据并解析为真正的页面，至此整个请求响应过程结束。

上面的例子是请求一个htm页面的过程，对于cgi请求的过程稍有不同，体现在HTTP请求和input函数上，一个CGI请求一般需要携带一些参数，用于响应的处理，如登录请求为：
```js
    $.sendAjax("login.cgi", "user_name":"admin","Pwd":"MTIzNDU2Nzg=","_pageStyle":"pc"})
```

响应的HTTP请求头部为：
```
POST /login.cgi HTTP/1.1

Host: 192.168.2.1

Connection: keep-alive

Content-Length: 47

Accept: */*

Origin: http://192.168.2.1

X-Requested-With: XMLHttpRequest

User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36

Content-Type: application/json

Referer: http://192.168.2.1/

Accept-Encoding: gzip, deflate

Accept-Language: en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4

Cookie: td_cookie=1315354745

username=admin&Pwd=MTIzNDU2Nzg%3D&_pageStyle=pc
```

这里除了HTTP头部以外，还有响应的请求数据username=admin&Pwd=MTIzNDU2Nzg%3D&_pageStyle=pc，以key=value的方式组织，并以&连接多个字段；
CGI请求的input的函数为do_apply_post会将这些字段和值解析出来并存储在哈希表中，这样在以后的调用中，只需要通过查找哈希表就可以快速定位所需要的字段和值。  

## **4 开发篇**
这里只是一点小小的提示，更多功能请咨询李光华大师，后续有新的内容也会补充进来。
### **4.1 PC访问H5页面**
当前K2S的页面基本和K3一致，依据访问管理页面的设备类型强制选择访问PC页面H5页面，但是在分析H5页面的相关BUG的时候如果通过手机访问，则失去了PC浏览器自带的那些分析手段，不利于分析BUG，可以通过一定的配置使得PC也可以访问H5页面。
下面所说的方法适用于chrome浏览器，其他浏览器未研究，但理论上应该是想通的，无非就是通过navigator的值来完成。
在chrome浏览器中，通过F12打开调试界面，找到图示的Network conditions，然后去掉Select automatically前面的勾并在下面输入Windows Phone(别忘了后面的分号)；然后刷新页面就可以访问H5页面了。

<div align="center">![](/img/work_05/05.png)</div>
<div align="center">![](/img/work_05/06.png)</div>

在这种情况下，页面看起来很大，不过不要紧，可以通过下图的按钮模拟移动设备的界面大小，还可以自动配置不同设备的尺寸。
<div align="center">![](/img/work_05/07.png)</div>
<div align="center">![](/img/work_05/08.png)</div>
## **5 结语**
这篇文档里面的内容是我在移植和修改httpd及页面的过程中的一些积累，拿出来跟大家分享一下，不了解的同志们拿来稍微看下，理解大体过程，了解的大神还望多多指正。
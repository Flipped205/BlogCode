title: 裁剪libiconv字符转码库
categories:
- 工作
tags:
- libiconv
other: work_09
date: 2018-09-04
---

## **1.libiconv是啥?**
libiconv是一个字符转换库，同一个字符在不同的标准下面对应的编码方式不同，比如：
<div align="center">![](/img/work_09/01.png)</div>

libiconv就是完成不同编码方式的转换。在K2上面的使用pppoe中文账户名拨号和lighttpd（web界面有关）的moileapp的界面显示时会用到转码功能，需求是将汉字字符由utf-8编码的格式转成gb2312的格式（对应的函数调用代码详见sop/package/network/services/ppp/src/pppd/options.c第411行 和 sop/packgage/feeds/packages/lighthttp/src/src/mod_mobileapp.c第2545行）

## **2.为啥要裁剪？**
k2上面的libiconv库采用的是libiconv-full库，编译生成的libiconv.so大小为900多K，这在在K2mini上肯定是不行的（Flash仅为4M）
## **3，裁剪原理是啥？**

因为在1中我们提到过，中文转码只需要utf-8和gb2312两种，加上英文，总共应该需要ascII，utf-8，gb2312三种编码方式，libiconv-full提供了多国语言，多种标准的编码方式，所以很大一只，我们可以仅保留这三种让这个库小很多。

## **4，怎么裁剪的？**

K2的源码sop/package/libs下面里面有两个libiconv的包，一个是libiconv-stub(简化包)，一个是libiconv-full（前面提到过的），在尝试了对libiconv-stub添加gb2312方式失败的情况下，转而裁剪libiconv-full库。

要裁剪库的话就需要去修改build_dir/target*/libiconv*/lib目录下源文件：

修改的方法一直接修改源文件，然后修改makefile的make方式，改成本地新建src文件夹make的方式，详见（SOP开发指南 10.3一小节http://172.17.200.152:8080/SOP%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97.html ）

为了省事和沿用之前的make方式，即采用了第二种方法——使用的是make+patch的方式，详见（SOP开发指南第9节），就是基于patch文件对下载解压出来的文件进行修改，然后到build_dir/target*/libiconv*/目录下编译。

我修改的patch文件是/package/libs/libiconv-full/patches/下面的100-strip_charsets.patch文件，patch文件里的所做的修改对应的是源码lib目录下面的aliases.h 和aliases.gperf 和converters.h和encodings.def四个文件的修改。这里用到了quilt工具方便管理和修改patch文件（详见   Working with patches ），这个工具可做到间接修改patch文件和直接修改对应的源文件这两种方式的灵活结合。

具体所做的修改简单来讲就是在100-strip_charsets.patch的基础上（已经裁掉了包括gb2312在内的大量的编码表），分别在aliases.h 和aliases.gperf 和converters.h和encodings.def四个文件里做相应的添加，添加gb2312相关的内容，修改完成之后重新使用mmm -c libiconv-full命令编译，最终生成的libiconv.so为60多k，满足要求。。。（附件为修改完成之后的裁剪patch文件）

[100-strip_charsets.patch][100-strip_charsets.patch]


[100-strip_charsets.patch]: /file/work_09/100-strip_charsets.patch
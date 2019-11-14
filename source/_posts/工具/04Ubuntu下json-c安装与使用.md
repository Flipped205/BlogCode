---
title: Ubuntu下json-c安装与使用
categories:
- 工具
tags:
- linux工具
other: tools_04
date: 2018-05-25
updated: 2018-05-25
---

## Ubuntu下json-c安装与使用
#### 1、获取并编译json-c
```bash
//获取源代码
git clone https://github.com/json-c/json-c.git
cd json-c
./autogen.sh
./configure
make
sudo make install
```
#### 2、使用json-c
通过`sudo make install`可以看出json-c的头文件和库所安装位置
![](/img/tools_04/01.png)
```bash
## 查看库路径和头文件路径

# 头文件所在路径
cd /usr/local/include/json-c
ls
# 库所在路径
cd /usr/local/lib/
ls
```
![](/img/tools_04/02.png)
一般使用中只需在代码中包含json.h
```c
//test.c
....
#include <json-c/json.h>
....
....
```
编译test.c
```bash
gcc test.c -ljson-c
```
注：`-l` 代表库文件路径

#### 3、常见问题
问题1：执行时出错"error while loading shared libraries: libjson-c.so.4: cannot open shared object file: No such file or directory"

修复方法：/etc/ld.so.conf中加入json库路径。可在`/etc/ld.so.conf`中加入该行`/usr/local/lib`
```bash
# file /etc/ld.so.conf

include /etc/ld.so.conf.d/*.conf
/usr/local/bin          #新增内容

```
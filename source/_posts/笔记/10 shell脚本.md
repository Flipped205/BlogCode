---
title: shell脚本
categories:
- 笔记
tags:
- shell脚本
other: note_10
date: 2019-11-21
udpated: 2019-11-21
---

shell脚本中切换目录

```bash
!#/bin/bash/
pwd
cd ./../
pwd

```
执行脚本
```bash
//可执行权限
$ chmod a+x 1.sh
//执行脚本
$ ./1.sh
$
//查看当前位置
$ pwd
```
之后会发现第二个`pwd `和第一个`pwd`，不一样，且第二个明显已经回到上一级目录，但是当前的目录还是没有改变。这种完全没有达到我们想要的目的，该怎么办呢。具体如下:
```bash
$ source ./1.sh
$
$
$ pwd
```
通过使用`source`，发现当前位置已发生改变。

<div align="center">

![切换目录脚本](/img/note_10/01.jpg)

</div>


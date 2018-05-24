---
title: Linux 串口调试工具
categories:
- 工具
tags:
- linux工具
other: tools_02
---

** minicom **
## 1、安装 ##

```bash
sudo apt-get install minicom
```
## 2、查看串口 ##

使用linux串口一般`/dev/ttyS*`,如何查看当前使用的是那个`ttyS*`。 
方式1：查看串口是否可用
```bash
su   #切换root
echo 123 > /dev/ttyS0
```
<div align="left">![](/img/tools_02/01.png)</div>
如图，如果不可用则会提示`Input/Output error`

方式2：通过查看日志 
```bash
dmesg | grep ttyS*
```
<div align="left">![](/img/tools_02/02.png)</div>
针对USB设置，一般查看`ttyUSB*`

## 3、使用串口 ##

**方式1:**
1、打开minicom

```bash
sudo minicom
```
<div align="left">![](/img/tools_02/03.png)</div>
2、进入minicom帮助页
按键`ctrl+A`(不区分大小写)，随后按`z`,出现如下：
<div align="left">![](/img/tools_02/04.png)</div>
3、设置minicom
设置minicom,按`o`
<div align="left">![](/img/tools_02/05.png)</div>
上下选择`Serial port setup`
<div align="left">![](/img/tools_02/06.png)</div>
一般主要设置`Serial Device`和`Bits`,设置后之后`Save setup as dfl`或`Save setup as..`
<div align="left">![](/img/tools_02/07.png)</div>
4、使用
保存之后，如果没有反应，可以`ctrl+a`,`q`退出，重新进入。

**方式2:**
使用时直接输入设备和波特率
```bash
sudo minicom -D /dev/ttyS0 -b 115200
```


## 4、其他命令，查看已接入设备 ##

```
df
```
---
title: TCP和UDP
categories:
- 笔记
tags:
- 网络
other: note_03 
date: 2018-05-14 
updated: 2018-05-14
---

补码
正数：与原码相同
负数：取反+1

校验和：
所有数之和，超过0xff即255，就要求其补码作为校验和（取反加1）

```c
#include<stdio.h>
int main()
{
 int a[8]={0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08};
 int i,sum=0;
 for (i=0;i<8;i++)
     sum+=a[i];//将每个数相加
     if(sum>0xff)
     {
        sum=~sum;
                  
        sum+=1;
 
                 
　        }
 sum=sum&0xff; 
 printf("0x%x\n",sum);
}
```

# 1、UDP
## 1.1 简介
UDP数据报封装成一份IP数据报格式如图
IP首部（20字节）-UDP首部（8字节）-UDP数据 （IP数据报）
应用程序必须关心IP数据报长度。如果超过网络的MTU，那么久要对IP数据包进行分片。

## 1.2 UDP首部（8字节）
16位源端口号 16目的端口号  （4字节）
16位UDP长度  16位UDP校验和 （4字节）
数据

UDP长度指：UDP首部和UDP数据的字节长度

## 1.3 UDP校验和
UDP校验和覆盖UDP首部和UDP数据。UDP和TCP在手不中都有覆盖它们首部和数据的校验和。UDP的校验和是`可选的`。TCP的校验和是`必需的`。

UDP校验和不同之处：1、UDP数据报的长度可以为奇数字节，但是校验和算法是把如干个16bit字节相加。解决方法是必须时在最后增加填充字节0，这是为了校验和的计算。
2、UDP数据报和TCP段都包含一个12字节长的伪首部，它是为了计算校验和而设置的。伪首部包含IP首部的一些字段。器目的是让UDP两次检查数据是否已经正确到达目的地。

UDP伪首部：
32位源IP地址
32位目的IP地址   

UDP校验和是一个端到端的校验和。它由发送端计算，然后由接收端验证。其目的是为了发现UDP首部和数据在发送端和接收端之间发生的任何改动。

接收方和发送方，伪首部中，源IP地址和目的IP交换，伪首部和UDP首部中的其他字段都是相同的，就像数据回显一样。然而UDP校验和（事实上，TCP/IP协议簇中的所有校验和）是简单的16bit和。它们检测不出交换两个16bit的差错。

根据一些数据统计：TCP发生的校验和差错的比例比UDP相对要高得多，可能原因是因为该系统中的TCP连接经常是“远程”连接（经过许多路由器和网桥等中间设备），而UDP一般为`本地通信`。

## 11.5 IP分片
物理网络层一般要限制每次发送数据帧的最大长度。任何时候IP层接收到一份要发送的IP数据报时，它要判断向本地哪个接口发送数据（选路），并查询该接口获得其MTU。IP把MTU与数据报长度进行比较，如果需要则进行分片。分片可以发生在原始发送端主机上，也可以发生在中间路由器上。

把一份IP数据报分片后，之后到达目的地才进行重新组装（这里的重新组装与其他网络协议不同，它们要就在下一站就进行重新组装，而不是在最终目的地）。重新组装由目的端的IP层来完成。其目的是使分片和重新组装的过程对运输层（TCP和UDP）是透明的。已经分片过的数据报有可能会再次分片（可能不止一次）。IP首部中包含的数据为分片和重组提供了足够的信息。


对于发送端发送的每份IP数据报来说，其标识字段都包含一个为抑制。该值在数据报分片时被复制到每个片中。标识字段用其中一个bit来表示“更多的片”。除了最后一片外，其他每个组成数据报的片都要把该bit置1。

分片举例：
IP首部(20字节)  UDP首部(8字节)  UDP数据(1473字节)
分段
IP首部(20字节) UDP首部(8字节)  (1472字节)  IP首部(20字节)(1字节)

注：IP首部(20字节) UDP首部(8字节)  (1472字节) 分组
    IP首部(20字节)(1字节) 分组
    
## 11.6 ICMP不可达差错（需分片）

发送ICMP不可达差错的另一种情况是，当路由器收到一份需要分片的数据报，而在IP首部又设置不分片（DF）的标志比特，如果某个程序需要判断到达目的端的路途中最小MTU是多少，称作路径MTU发现机制，那么这个差错就可以被改程序使用。

这种情况的ICMP报文格式如图


|0-7|8-15|16-32|
|:-:|:-:|:-:|
|类型(3) |代码(4)| 校验和()|
未用(必须为0)()())()()(()()()()
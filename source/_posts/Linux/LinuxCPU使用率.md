---
title: Linux CPU使用率
categories:
- Linux
tags:
- cpu
other: linux_02
date: 2018-06-26
---
内核版本
```bash
cat /proc/version
```
<div align="left">![](/img/linux_02/00.png)
</div>

CPU活动信息
```bash
cat /proc/stat
```
<div align="left">![](/img/linux_02/01.png)
</div>

jiffies是内核中的一个全局变量，用来记录自系统启动以来产生的节拍书，在linux中，一个节拍大致可以立即为操作系统进程调度的最小时间片，不同的linux内核可能值有所不同，通常在1ms到10ms之间。

**参数说明:**

|参数|解释(jiffies)|
|:---|:------------|
|user（`6001460`）|从系统启动开始累计到当前时刻，处于用户态的运行时间，不包含nice值为负进程|
|nice（`37043`）|从系统启动开始累计到当前时刻，nice值为负的进程所占用的CPU时间|
|system（`95525758`）|从系统启动开始累计到当前时刻，核心时间|
|idle（`277280659`）|从系统启动开始累计到当前时刻，除IO等待时间以外其它等待时间|
|iowait（`904849`）| 从系统启动开始累计到当前时刻，IO等待时间|
|irq（`0`）|从系统启动开始累计到当前时刻，硬中断时间|
|softirq（`200629`）| 从系统启动开始累计到当前时刻，软中断时间|
|stealstolen（`0`）|which is the time spent in other operating systems when running in a virtualized environment(since 2.6.11)|
|guest（`0`）|which is the time spent running a virtual  CPU  for  guest operating systems under the control of the Linux kernel(since 2.6.24)|



## **总的CPU使用率计算** ##
计算方法：
- 1、采用两个足够用段的时间间隔的CPU快照，t1,t2。（user,nice,system,idle）
- 2、计算总的CPU时间片totalCPUTime
    + a)、t1的CPU使用情况，求和s1;
    + b)、t2的CPU使用情况，求和s2;
    + c)、s2-s1得到时间间隔的所有时间片，即totalCPUTime = s2-s1;
- 3、计算使用时间(usr+system)
    + a)、t1的使用情况，u1 = (user+system).
    + b)、t2的使用情况，u2 = (user+system).
    + c)、u2-u1得到时间间隔的使用时间片，即useCPUTime = u2-u1;
- 4、计算使用率
    + pcpu = 100*(userCPUTime)/totalCPUTime;


```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct CPU_JIFFIES
{
    char name[20];
    unsigned int user;
    unsigned int nice;
    unsigned int system;
    unsigned int idle;
};

void get_cpu_jiffies(struct CPU_JIFFIES *jiffies)
{
    FILE *fp = NULL;
    char buff[1024] ={0};
    fp = fopen("/proc/stat","r");
    if (!fp){
        printf("error\n");
        return ;
    }
    fgets(buff, sizeof(buff), fp);

    sscanf(buff, "%s %u %u %u %u",jiffies->name, &(jiffies->user), &(jiffies->nice), &(jiffies->system), &(jiffies->idle));
    printf("%s %u %u %u %u\n", jiffies->name, jiffies->user, jiffies->nice, jiffies->system, jiffies->idle);
    fclose(fp);
}

float  cal_pcpu(struct CPU_JIFFIES e, struct CPU_JIFFIES s)
{
    double et, st;
    double eu, su;
    double idle ; 

    et = (double)(e.user + e.nice + e.system + e.idle);
    st = (double)(s.user + s.nice + s.system + s.idle);

    idle = (double)(e.idle-s.idle);

    eu = (double)(e.user + e.system);
    su = (double)(s.user + s.system);

    printf("et:%f st:%f eu:%f su:%f\n",et, st, eu,su );
    printf("%f\n",(100*(eu-su))/(et-st));
    return (100*(et-st-idle))/(et-st);
}

void main(void)
{
    struct CPU_JIFFIES s;
    struct CPU_JIFFIES e;
    int pcpu=0;

    sleep(1);
    get_cpu_jiffies(&s);
    sleep(1);
    get_cpu_jiffies(&e);
    
    pcpu = (int)cal_pcpu(e,s);
    printf("%d\n", pcpu);
}
```

TOP 命令
```bash
top
```
<div align="left">![](/img/linux_02/02.png)
</div>

内存使用
free命令
```bash
free
```
<div align="left">![](/img/linux_02/03.png)
</div>



备注：
- 1．不同内核版本/proc/stat文件格式不大一致。/proc/stat文件中第一行为总的cpu使用情况。
    各个版本都有的4个字段: `user`、`nice`、`system`、`idle`
    2.5.41版本新增字段：`iowait`
    2.6.0-test4新增字段：`irq`、`softirq`
    2.6.11新增字段：`stealstolen`：which is the time spent in other operating systems when running in a virtualized environment
    2.6.24新增字段：`guest`：which is the time spent running a virtual  CPU  for  guest operating systems under the control of the Linux kernel
- 2．/proc/pid/task目录是Linux 2.6.0-test6之后才有的功能。
- 3．关于出现cpu使用率为负的情况，目前想到的解决方案是如果出现负值，连续采样计算cpu使用率直到为非负。
- 4．有些线程生命周期较短,可能在我们采样期间就已经死掉了.

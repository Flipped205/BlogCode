---
title: Linux 锁
categories:
- Linux
tags:
- 锁
- 文件
other: note_0d
date: 2018-07-20
updated: 2018-07-20
---


## **记录锁（fcntl）** ##
　两个进程同时对文件进行操作：当一个进程正在读或者修改文件的某个部分时，使用记录锁可以阻止其他进程修改同一文件区。另一术语`字节范围锁`。
fcntl函数原型
```c
#include <fcntl.h>
int fcntl(int fd,int cmd, .../*struct flock *flockptr */);  // 返回值：若成功，依赖于cmd,否则，返回-1
```
　　对于记录锁，cmd是F_GETLK,F_SETLK或F_SETLKW。第三个参数（我们将调用flockptr）是一个指向flock结构的指针。
```c
struct flock{
    short l_type;           /* F_RDLCK, F_WRLCK, or F_UNLCK */
    short l_whence;         /* SEEK_SET, SEEK_CUR or SEEK_END */
    short l_start;          /* offset in bytes, relative to l_whence */
    short l_len;            /* length, in bytes, 0 means lock to EOF */
    short l_pid;            /* returned with F_GETLK */
}
```
flock结构说明如下：
- 锁类型：F_RDLCK(共享读锁)、F_WRLCK(独占性写锁)或F_UNLCK(解锁一个区域)
- 要加锁或解锁区域的起始字节偏移量(l_start和l_whence)
- 区域字节长度(l_len)
- 进程ID(l_pid)持有的锁能阻塞当前进程(仅由F_GETLK)返回

关于锁区域说明：
- 区域起始偏移量的两个元素与lseek函数中最后的两个参数类似。l_whence可选的值是SEEK_SET、SEEK_CUR和SEEK_END。
- 锁可以在文件尾端处开始或越过尾端处开始，但不能在文章起始位置之前开始。
- 如l_len=0，则表示锁的范围可以扩展到最大可能的偏移量。这意味着不管向该文件追加多少数据。它们都可以处于锁的范围内。
- 为了对整个文件加锁，我们设置l_start和l_whence指向文件的起始位置，并指定l_len=0。（常用的指定文件起始位置，l_start=0,l_whence为SEEK_SET）。

两种锁类型：共享读锁（L_RDLCK）和独占性写锁（L_WRLCK）。
不同进程下，不同类型锁彼此之间的兼容性：
<div align="center">

![不同类型锁批次之间的兼容性](/img/note_0d/01.png)</div>

　　共享读锁和独占性写锁的原则：多个进程，如果在一个给定字节上有一个或多个读锁时，则不能在该字节上加写锁；如果在一个字节上已经有一把独占性写锁，则不能再对它加任意读锁。
　　以上情况只针对于多个进程。如果一个进程中对一个文件区域有一把锁，后来进程又企图在同一文件再加一把锁，那么新锁将`替换`已有锁。
　　加读锁时，该描述符必须是读打开。加锁时，该描述符必须是写打开。

fcntl的3个命令：
- F_GETLK: 是否存在一把锁。如存在，则将现有锁信息重写flockptr指向的信息。如果不存在，则除了l_type设置为F_UNLCK之外，其他信息保存不变。
- F_SETLK: 设置由flockptr所描述的锁。获取一把读锁（l_type=F_RDLCK）或者写锁（l_type=F_WRLCK）。而兼容性规则，阻止系统给出这把锁，那么fcntl就会立即出错返回。此时errno设置为EACCES和EAGAIN（一般不能满足，都返回该值）。此命令也可用于清除由flockptr指定锁（l_type=F_UNLCK）。
- F_SETLKW: 是F_SETLK的阻塞版本，（W=wait）。所以在请求的读锁或写锁因另一个进程当前已经对请求区域的某个部分进行加锁而不能授予，那么调用就会被置为休眠。如果请求创建的锁已经可用，或者休眠由信号中断，则该进程被唤醒。

**demo:**
通用头部代码：
```c
// 通用code
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

int lock_reg(int fd, int cmd, int type, off_t offset, int whence, off_t len)
{
    struct flock lock;

    lock.l_type = type;
    lock.l_start = offset;
    lock.l_whence = whence;
    lock.l_len = len;

    return (fcntl(fd, cmd, &lock));
}

#define read_lock(fd, offset, whence, len) \
            lock_reg((fd), F_SETLK, F_RDLCK, (offset), (whence), (len))

#define readw_lock(fd, offset, whence, len) \
            lock_reg((fd), F_SETLKW, F_RDLCK, (offset), (whence), (len))

#define write_lock(fd, offset, whence, len) \
            lock_reg((fd), F_SETLK, F_WRLCK, (offset), (whence), (len))

#define writew_lock(fd, offset, whence, len) \
            lock_reg((fd), F_SETLKW, F_WRLCK, (offset), (whence), (len))

#define un_lock(fd, offset, whence, len) \
            lock_reg((fd), F_SETLK, F_UNLCK, (offset), (whence), (len))


char* getRandomString(int length)
{
    int j, i;
    char* string;
    char tmp[4]="Aa0";
    srand((unsigned) time(NULL ));
    if ((string = (char*) malloc( sizeof(char)*length)) == NULL )
    {
        printf("%d,malloc error\n",__LINE__);
        return " ";
    }
    for (i = 0; i < length - 1; i++)
    {
        j = rand() % 3;
        string[i] = tmp[j] + rand()%10;
        if (j!=2){
            string[i] += rand()%16;
        }
    }
    string[length - 1] = '\0';
    printf("%d,write_buf:  %s\n",__LINE__, string );
    return string;
}
```
写文件 a.c
```c
// a.c  写文件
void main(void)
{
    int fd = -1;
    int len = 0;
    int i=0;
    while(1){
        srand(time(0));
        sleep(10);
        printf("start\n");
        fd = open("./a.txt", O_WRONLY | O_CREAT | O_TRUNC, S_IWUSR | S_IRUSR | S_IWGRP| S_IRUSR | S_IWOTH | S_IROTH);
        if (fd != -1) {
            if (write_lock(fd, 0, SEEK_SET, 0)){
                printf("%d,%d,%s\n",__LINE__,errno,(char *)strerror(errno));
                close(fd);
                continue;
            }
            len = rand()%200 + 50;
            if (len == write(fd, getRandomString(len), len)) {
                printf("%d,write success\n", __LINE__);
            }else {
                printf("%d,write fail\n", __LINE__);
            }
            close(fd);
        }
    }
}
```
读文件 b.c
```c
// b.c 读文件
void main(void)
{
    int fd = -1;
    int len = -1;
    char buf[256]={0};
    int i=0;
    while(1){
        sleep(5);
        printf("start\n");
        fd = open("./a.txt", O_RDONLY);
        if (fd != -1) {
            if (read_lock(fd, 0, SEEK_SET, 0)){
                printf("%d,%d,%s\n",__LINE__,errno,(char *)strerror(errno));
                close(fd);
                continue;
            }
            len = read(fd, buf, 256);
            if (-1 == len){
                printf("%d,read failed\n", __LINE__);
            }else{
                printf("%d,read success\n",__LINE__);
                printf("%d,%s\n\n",__LINE__, buf);
            }
            close(fd);
        }
    }
}
```

## **文件描述符** ##
**open 函数**
```c
//函数头文件
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

//函数原型
int open(const char *pathname, int flags);                  /* 打开现有文件 */
int open(const char *pathname, int flags, mode_t mode);     /* 打开的文件不存在，则先创建它 */

```
返回-1,则出错。成功，则返回文件描述符

参数说明：

|flags|含义|
|:----|:---|
|O_RDONLY|以只读方式打开文件|
|O_WRONLY|以只写方式打开文件|
|O_RDWR|以读写方式打开文件|
|O_CREAT|若所打开文件不存在则创建此文件。使用此选项时，需同时使用第三个参数mode说明该新文件的存取许可权位。|
|O_EXCL| 如果同时指定了O_CREATE,而文件已经存在，则导致调用出错|
|O_TRUNC|如果文件存在，而且为只读或只写方式打开，则将其长度截短为0|
|O_NOCTTY|如果pathname指定的是终端设备(tty)，则不将此设备分配作为进程的控制终端|
|O_APPEND|每次写时都加到文件的尾端|
|O_NONBLOCK|如果pathname指定的是一个FIFO、一个块特殊文件或一个字符特殊文件，则此选择项为此文件的本次打开操作和后续的I/O操作设备为非阻塞方式|
|O_NONELAY|O_NONBLOCK|
|O_SYNC|只在数据被写入外存或其他设备之后操作才返回|

|mode取值|对应八进制数|含义|
|:-------|:-----------|:---|
|S_SVTX|01000|粘贴位|
|S_IRUSR|00400|文件所有者的读权限位|
|S_IWUSR|00200|文件所有者的写权限位|
|S_IXUSR|00100|文件所有者的执行权限位|
|S_IRGRP|00040|所有者同组用户的读权限位|
|S_IWGRP|00020|所有者同组用户的写权限位|
|S_IXGRP|00010|所有者同组用户的执行权限位|
|S_IROTH|00004|其他组用户的读权限位|
|S_IWOTH|00002|其他组用户的写权限位|
|S_IXOTH|00001|其他组用户的执行权限位|

## **文件流** ##
**fopen 函数**
```c
//头文件
#include <stdio.h>

//函数原型
FILE *fopen(const char *path, const char *mode);
```
返回值：失败返回NULL

|mode取值|说明|
|:-------|:---|
|r | 以只读方式打开文件，该文件必须存在。|
|r+ | 以读/写方式打开文件，该文件必须存在。|
|rb+| 以读/写方式打开一个二进制文件，只允许读/写数据。|
|rt+| 以读/写方式打开一个文本文件，允许读和写。|
|w  | 打开只写文件，若文件存在则长度清为 0，即该文件内容消失，若不存在则创建该文件。|
|w+ | 打开可读/写文件，若文件存在则文件长度清为零，即该文件内容会消失。若文件不存在则建立该文件。|
|a  | 以附加的方式打开只写文件。若文件不存在，则会建立该文件，如果文件存在，写入的数据会被加到文件尾，即文件原先的内容会被保留（EOF 符保留）。|
|a+ | 以附加方式打开可读/写的文件。若文件不存在，则会建立该文件，如果文件存在，则写入的数据会被加到文件尾后，即文件原先的内容会被保留（原来的 EOF 符不保留）。|
|wb | 以只写方式打开或新建一个二进制文件，只允许写数据。|
|wb+| 以读/写方式打开或建立一个二进制文件，允许读和写。|
|wt+| 以读/写方式打开或建立一个文本文件，允许读写。|
|at+| 以读/写方式打开一个文本文件，允许读或在文本末追加数据。|
|ab+| 以读/写方式打开一个二进制文件，允许读或在文件末追加数据。|

```c
//获取某个文件流的文件描述符
int i_fp = -1;
FILE *fp = fopen("/tmp/test.txt","r+");
i_fp = fileno(fp);
fclose(fp);
```
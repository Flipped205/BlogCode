---
title: Broadcom NVRAM实现机制与优化
categories:
- 工作
tags:
- nvram
other: work_04
date: 2018-08-02
---

## **1.    NVRAM源码结构** ##
### **1.1   NVRAM概述** ###
　　本质上，NVRAM是flash中的一块大小为64KB的存储空间。系统boot后，这块存储空间被映射至内存，并依据这段内存构造了一个插入、删除、查找速度极快的数据结构。同时，Broadcom还为该设备提供了mmap()、read()、write()、ioctl()等系统调用接口以实现用户想要的各类型操作，这些操作包括读取/存储系统配置项、读取/存储用户自定义的临时变量、将对NVRAM的改动实际地写入flash等。NVRAM是Broadcom芯片方案中非常重要的一个套件，运行在Broadcom芯片方案上的许多应用程序都会用到NVRAM提供的服务来获取/改变系统的当前状态。

### **1.2   Broadcom NVRAM源码结构** ###
　　Broadcom为NVRAM提供了设备驱动程序、动态链接库以及一个简单易用应用程序，应用程序不是我们关心的，不再赘述。动态链接库为应用程序提供了几个关键的API，包括：①用于读取NVRAM变量值的函数nvram_get()；②用于设置NVRAM变量值的函数nvram_set()；③用于将RAM中的变量与值写入flash的函数nvram_commit()等。这三个函数实际上分别通过系统调用read()、write()、ioctl()陷入内核态，进而执行NVRAM的设备驱动程序。
　　用户态的源代码位于repeater/main/components/router/nvram目录下，名为nvram_linux.c，编译产物为libnvram.so。内核态的源代码被精巧地分为两个部分：位于repeater/main/src/shared目录下的nvram.c，该源文件包含平台无关的代码，数据结构与算法实现也定义在此处；而位于repeater/main/components/opensource/linux/linux-2.6.36/arch/arm/plat-brcm目录下的是平台相关代码，名为nvram_linux.c，该源文件提供了系统调用接口的具体实现以及设备初始化代码；repeater/main/src/shared目录下的nvram_rw.c则包含了CFE阶段初始化NVRAM代码。NVRAM的体系结构如图1所示。
<div align="center">![图1 NVRAM体系结构](/img/work_04/01.png)</div>

## **2.NVRAM初始化** ##
　　NVRAM伴随着CFE的初始化过程，这里简要阐述：
　　首先，CFE启动代码尝试发现NVRAM。Broadcom解决方案中总是将NRVRAM分区置于flash的最后64KB字节中，这64KB字节分区的头部包含NVRAM的基本信息，头部具有如下所示的格式：
<div align="center">![图2 NVRAM头部信息](/img/work_04/02.png)</div>

　　每个参数都是4字节的整型，这里只关心magic这个参数。顾名思义，该参数是一个特殊的魔法数，启动代码通过这个魔法数确定是否发现了正确的NVRAM分区；flash总大小总是为2的n次方字节，且至少是128KB。所以，寻找NVRAM的算法就比较简单了，每次都假设flash总字节数为2的n次方，回退64KB并尝试读取魔法数，如果读取得到的magic恰好是预设的魔法数，就认为已经找到了正确的NVRAM分区；否则假设flash总字节数翻倍，然后继续进行尝试。尝试一定次数还未找到NVRAM分区，那么就会使用默认NVRAM变量。默认的NVRAM位于flash一个特定的位置，而且默认NVRAM变量是只读的，因此不存在被破坏的可能，这样就保证了CFE总是能够获取必要的启动信息。特别地，当用户选择恢复出厂时，CFE会直接读取默认NVRAM。之后就调用_nvram_init()，将整个nvram分区拷贝至RAM，调用nvram_rehash()完成初始化，得到一个完整的包含所有NVRAM变量的NVRAM哈希表。发现NVRAM的过程如图3所示：
<div align="center">![图3 发现NVRAM分区的算法](/img/work_04/03.png)</div>

## **3.数据结构与算法分析** ##
　　这一节将简要分析NVRAM在内存中的存储结构，以及read()、write()、ioctl()等系统调用在内核空间中的实现机制，以期获得一个完整清晰的模块逻辑。首先简要描述NVRAM的数据结构；然后分别描述执行系统调用read()、write()和ioctl()时的执行流程，其中ioctl()的实现机制是重点分析对象。

### **3.1   NVRAM的数据结构** ###
　　假设在此之前已经完成了NVRAM的初始化工作（初始化在CFE阶段就已经完成了），这里将简要分析NVRAM的所有变量与值是如何在内存中进行存储的。为了方便存储，解决方案使用了自定义的结构体struct nvram_tuple，该结构体包含三个数据成员：①char *name，指向NVRAM变量名字符串的指针；②char *value，指向NVRAM值字符串的指针；③struct nvram_tuple *next，指向下一个struct nvram_tuple的指针。如图2所示是NVRAM在内存中的存储结构，主要分成四个部分：

- 1.首先是名为nvram_hash的哈希表。哈希值由NVRAM变量名字符串计算得出，每个表项都是一个struct tuple的链表。（值得一提的是，“每个表项都是一个struct tuple的链表”的说法并不严格准确。具体地说，在为struct nvram_tuple动态分配存储空间时多分配了一部分内存空间，而这多余的存储空间则用于存储NVRAM变量名字符串。因此，链表中每个节点可能具有各不相同的大小。）由于采用了哈希表存储所有的NVRAM变量，所以理想情况下，查找一个变量的速度可以达到O(1)，这使得NVRAM的操作速度相当快。
- 2.其次是一个名为nvram_dead的链表，链表中存储所有已经废弃的struct tuple节点。例如，当用户unset某个变量时，该NVRAM变量的节点就被移动至nvram_dead链表中。尚不清楚为什么Broadcom选择存储这些已经废弃的节点。
- 3.然后是一个名为nvram_buf的64KB缓冲区。该缓冲区将所有的NVRAM变量名-变量值字符串对集中存储。为什么不像NVRAM变量名字符串一样与struct nvram_t0uple节点一起存储？这是因为NVRAM值字符串不像变量字符串一样总是具有固定的长度，一个NVRAM变量的变量名字符串总是不变的，例如get_wan_port_status这个变量名总是表示WAN口状态，因此长度不会有任何变化；相反地，举个例子，一个变量值字符串可以取“yes”和“no”两种取值，因此变量值的长度是可变的。各个nvram_tuple节点的value指针指向该缓冲区的各个字符串。当一个NVRAM变量的值长度发生变化时，若新的值字符串长度不大于原长度，则将值字符串存储在原址；否则就将值字符串存储到未使用的缓冲区中，并使nvram_tuple节点的value指针指向新的值字符串。如此，除非缓冲区nvram_buf被占满，NVRAM值字符串的存储需求总是可以得到满足。
- 4.最后是一个临时的、大小为64KB的缓冲区header。header缓冲区总是在需要使用的时候动态申请，用完立即销毁，主要用于初始化、写入flash等操作时在内存中构造一个与将要写入flash的内容完全相同的缓冲区。header的头部存储magic number、CRC校验码等重要信息，接下来就是一连串的“name=value”的变量名-变量值对。通过MTD的设备的read()与write()方法，程序可以将flash中NVRAM设备的字节读取到header缓冲区中，也可以将header缓冲区的刷写入flash。

<div align="center">![图4 NVRAM数据结构](/img/work_04/04.png)</div>

### **3.2   read()系统调用** ###
　　应用程序使用nvram_get()获取值字符串，而nvram_get()内部通过系统调用read()获取值字符串，同时将变量名字符串通过read()的参数传递给NVRAM设备驱动。陷入内核态后，read()系统调用将执行dev_nvram_read()函数。如图5所示是dev_nvram_read()函数的基本执行流程，这里忽略了一些必要的出错处理。首先计算变量名字符串的哈希值，在对应的链表中查找从nvram_tuple节点。若找到正确的节点，函数返回对应“name=value”字符串在缓冲区中的偏移量；否则返回0（注意到任何一个“name=value”字符串的偏移量都不可能为0，因为缓冲区一开始是一个16个字节的头部信息）。
<div align="center">![图5 dev_nvram_read()执行流程](/img/work_04/05.png)</div>

### **3.3   write()系统调用** ###
　　应用程序使用nvram_set()设置NVRAM变量时，nvram_set()内部通过系统调用write()设置NVRAM变量。陷入内核态后，write()系统调用将执行dev_nvram_write()函数。如图6所示是dev_nvram_set()的基本执行流程，这里忽略了一些必要的出错处理。首先根据变量名字符串找到NVRAM变量在哈希表中的存储位置；查找该哈希表项，即nvram_tuple链表，若找到该变量名则替换其变量值，否则创建一个新的nvram_tuple节点，为节点各项元素赋以合适的值，这些值通常都是由应用程序员提供的；最后将该节点插入链表头部，完成nvram_set()操作。
<div align="center">![图4 dev_nvram_write()执行流程](/img/work_04/06.png)</div>
### **3.4   ioctl()系统调用** ###
　　注意到，无论是系统调用read()还是write()本质上都没有实际执行IO操作，只是在内存中进行了一些存取。不过，一旦应用程序调用nvram_commit()函数，就涉及了真正的IO操作。nvram_commit()通过系统调用ioctl()实现其功能。通过ioctl()陷入内核态后，ioctl()将执行nvram_commit()函数(内核中的nvram_commit()，不同于同名用户态API)，该函数比较复杂，细节的处理较多，如果都详细加以说明反而会导致逻辑不清晰，因此在此忽略了大部分的出错处理。处理步骤简述如下：

- 1) 申请一块大小为64KB的缓冲区buf，buf的大小与flash中NVRAM设备是一致的；
- 2) 生成头部信息，头部包括CRC校验码、版本信息等；
- 3) 遍历哈希表，将表中所有的变量名-变量值对逐一以“name=value”的格式填入该缓冲区，填写buf缓冲区域结束后重新生成哈希表，如果需要的话，在这里会补充一些参数；
- 4) 整块擦除NVRAM对应的64KB的flash空间，使之能够被重新写入；
- 5) 完成擦除后，程序便将缓冲区buf的内容写入flash。
至此，nvram_commit()的所有工作就都完成了。

## **4.NVRAM的优化** ##
　　Broadcom提供的NVRAM机制其本意是用于用户配置项的存储，但是在工程实践中，由于普遍对该工具的用途认识出现了偏差，且Broadcom解决方案中没有为进程间的参数共享提供一个切实有效的通用机制，导致了NVRAM机制的大范围错用与误用。比如说，用一个NVRAM变量（pingcheck）表示当前的网络状态。这种用法程序员是比较方便，但是却不合理。这是由于NVRAM设计之初就是为了存储用户的配置项，所有的用户配置项必须最终必须刷写入flash以使得下次开机时用户配置项依然生效。把容易实时地发生变化的系统状态量写入NVRAM是极不明智的。这里说是NVRAM的缺陷，不如说是对NVRAM的滥用造成的问题。同时，由于可能对sdk不了解，对于某些函数接口也出现了误用，其中最为典型的是nvram_commit()的误用。nvram_commit()如前所述，会实际地将内存中的NVRAM变量写入flash，频繁的nvram_commit()将缩短flash的使用寿命；同时，nvram_commit()进行写入时首先要擦除nvram分区，再进行写入。在擦除开始后到写入完成前断电，那么nvram分区的内容就会丢失。尽管由于Broadcom提供了较为完善的机制避免了系统因此而不能boot，但是用户配置项的丢失却是是实实在在的，用户将不得不重新设置路由器。考虑到现在用户大量使用无线接入路由器，要求用户再次使用有线进行一次配置是用户极不友好的，更普遍的情况是用户会认为路由器已经无法使用，影响用户使用体验、口碑等。
　　但是，项目进行到此，使用nvram接口函数的应用程序数量庞大，可以说，几乎所有的应用程序都使用了nvram_set()或nvram_get()或nvram_commit()等接口函数，鉴于工程量大，一一对这些应用程序的源代码进行修改是不合时宜的。因此，需要对NVRAM机制进行优化，优化对原厂源代码的影响应当尽可能小：
　　考虑到存在数量较大不合时宜的nvram_commit()，需要对源代码进行些许改动，以观察究竟有哪些应用程序使用了该接口。所幸，无论是使用应用程序nvram在串口进行设置还是使用动态链接库libnvram.so对nvram设备进行操作，最终都是经过动态链接库应用层的几个系统调用接口对设备进行访问、改动、保存。已经了解到，nvram_commit()或者是在终端输入nvram commit最终都是通过系统调用接口ioctl()生效。如果在调用ioctl()之前添加一段代码，记录应用程序的PID甚至是时间是完全可行的。同时这对于源代码的改动也是较小的。
　　考虑到系统中存在大量临时的变量，这些临时的变量也会随着nvram_commit()被实际地写入flash。为防止这些临时量被实际地写入flash，考虑提供一个临时nvram变量机制。该机制允许应用程序员使用nvram的接口函数保存一些临时的nvram变量，同时还能使得这些变量只能出现在内存中，而不会被commit进内存。
　　考虑到nvram_commit()过程中掉电可能会引发用户配置项丢失，需要为nvram分区提供一个用户配置项的恢复方法。这里采用这样一种做法：开辟一个全新的nvram_backup分区，每次nvram_commit()擦除nvram分区之前先将nvram分区的所有内容拷贝到nvram_backup分区，然后才进行nvram分区的擦除与重新写入。在执行nvram_commit()的过程中系统可能掉电而导致nvram分区的系统配置项丢失，在CFE启动阶段添加代码检测这一错误。一旦发现了错误，就将nvram_backup分区的内容覆写至nvram分区，这样用户配置项就得到了保留。
　　最后，如果看帖子不方便的，可以下载帖子附件中的.doc文档，内容是完全相同的。

附件资料：
- [nvram设备驱动实现机制.doc][nvram设备驱动实现机制.doc]
- [header.vsdx][header.vsdx]
- [ioctl.vsdx][ioctl.vsdx]
- [nvram体系结构.vsdx][nvram体系结构.vsdx]
- [read.vsdx][read.vsdx]
- [write.vsdx][write.vsdx]
- [发现.vsdx][发现.vsdx]
- [内存结构.vsdx][内存结构.vsdx]

[nvram设备驱动实现机制.doc]: /file/work_04/nvram设备驱动实现机制.doc
[header.vsdx]: /file/work_04/header.vsdx
[ioctl.vsdx]: /file/work_04/ioctl.vsdx
[nvram体系结构.vsdx]: /file/work_04/nvram体系结构.vsdx
[read.vsdx]: /file/work_04/read.vsdx
[write.vsdx]: /file/work_04/write.vsdx
[发现.vsdx]: /file/work_04/发现.vsdx
[内存结构.vsdx]: /file/work_04/内存结构.vsdx
title: Flash简介
categories:
- 工作
tags:
- flash
- NAND
other: work_08
date: 2018-09-04
---
Flash是路由器、手机等手持式电子设备最常用的存储器。像手机用的eMMC、电脑用的SSD，其存储单元还是NAND Flash。

 
**硬件简介**

从原理上看，Flash分为NAND和NOR两类。即NOT+AND、NOT+OR，NOT是存储单元的特性、非门，AND/OR是连接方式、串联/并联。

这一点从阵列结构可以看得清楚。
<div align="center">![](/img/work_08/01.png)</div>
从接口上看，Flash接口通常有并行、串行两种。串行通常为SPI接口。

SPI NOR Flash，引脚少、易布线，应用广泛。
<div align="center">![](/img/work_08/02.png)</div>
Parallel NOR Flash，采用RAM接口，允许随机读取，可以直接供CPU运行代码，而不必拷贝到RAM。
<div align="center">![](/img/work_08/03.png)</div>
SPI NAND Flash，少见，不了解。

Parallel NAND Flash，采用标准接口，8位I/O，复用传输指令、地址、数据等。
<div align="center">![](/img/work_08/04.png)</div>

## **NAND vs NOR**

Flash有些共通的特点：按块写入，按块擦除，先擦后写。擦除后默认值是0xFF，写入1->0，0->1需要擦除。

NAND与NOR对比，有以下主要差异：
- 1. 访问方式：NOR Flash支持随机读取，NAND必须按页读取；
- 2. 访问速度：NOR Flash读取稍快，写入和擦除巨慢（2个数量级的差距）；
- 3. 可靠性：NAND Flash需要坏块处理，除主存储区域，还有OOB（out-of-band）；NOR Flash不需要。
- 4. 寿命：NOR Flash十万次擦写；NAND Flash百万次擦写。

## **存储单元的组织结构**
NAND和NOR Flash都是按阵列结构组织的，但稍有不同。

NAND Flash是Block-Page的阵列结构，最小访问单元是Page，每个Page从512Byte/1K/2K等不同。每个Page对应一块OOB，一般每512Byte对应16Byte的OOB。
<div align="center">![](/img/work_08/05.png)</div>

NOR Flash一般是Block-Sector-Page-Byte的阵列结构，最小访问单元是Byte/Page，允许按Byte读取。
## **Flash的基本操作**
Flash有读写擦三个基本操作，Read/Program/Erase，对应型号的datasheet有详细描述。

所有Flash都支持Read ID操作，通过该ID可以判断厂商、芯片型号等，软件可以据此匹配多Flash芯片。该操作可能是厂商自定义的，也可能是JEDEC（JESD216）定义的。

## **使用注意事项**

- 1. 寿命
Flash寿命是有限的，NAND百万次，NOR十万次，应避免对同一地址频繁擦写。
举个例子：比如4G流量统计需要15s记录一次，如此计算，NOR Flash 半月损坏，NAND Flash 半年损坏。显然无法满足要求。
改善方案：
    - a）使用针对Flash专门设计的FS，比如yaffs、jffs，有擦写均衡。均衡效果一般受剩余空间约束，剩余空间过小时仍需要评估。
    - b）无FS的情况，高频访问的参数，可以开辟一段空间，轮流写入。比如1Byte的数据，给予256的一个Page，寿命几乎延长256倍。
- 2. 数据完整性
因为不能随机写入、先擦后写等原因，操作不当容易造成数据丢失，需要注意。
比如，修改1个字节，至少需要重写一个Page，甚至擦除1个Block，就需要先备份原有数据，然后修改，然后写入。中间人和环节断电，数据会丢失。
有几种方式保证完整性，或者出错后纠错：
    - a）yaffs、jffs等系统，一定程度有这方面的考虑。
    - b）设计备份纠错机制，上电自检恢复。比如K2S nvram做了这方面的改进，nvram分区写之前，先备份到nvram_backup备份分区，上电时检查nvram_backup分区的备份标记，执行回复。
    - c）应用程序自身做容错设计，可以检错纠错。


参考资料：
[【Flash存储器简介.ppt】讨论PPT][1]
[【Benchmarking_Flash_NOR_and_Flash_NAND_memories_for_Code_and_Data Storage.pdf】Flash芯片级原理介绍][2]
[【GD25Q128C-Rev1.2.pdf】SPI NOR Flash Datasheet][3]
[【am29lv160.pdf】Parellel NOR Flash Datasheet][4]
[【K9F2G08U0.pdf】Parellel NAND Flash Dataseet][5]

[1]: /file/work_08/Flash存储器简介.ppt
[2]: /file/work_08/Benchmarking_Flash_NOR_and_Flash_NAND_memories_for_Code_and_Data-Storage.pdf
[3]: /file/work_08/GD25Q128C-Rev1.2.pdf
[4]: /file/work_08/am29lv160.pdf
[5]: /file/work_08/K9F2G08U0.pdf

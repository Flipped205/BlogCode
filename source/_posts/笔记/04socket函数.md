---
title: socket函数 几种不同的套接字使用
categories:
- 笔记
tags:
- socket
- 套接字
other: note_04 
date: 2018-06-04 
updated: 2018-06-04
---

bits/socket.h
```c
/* Protocol families.  */
#define PF_UNSPEC   0   /* Unspecified.  */
#define PF_LOCAL    1   /* Local to host (pipes and file-domain).  */
#define PF_UNIX     PF_LOCAL /* POSIX name for PF_LOCAL.  */
#define PF_FILE     PF_LOCAL /* Another non-standard name for PF_LOCAL.  */
#define PF_INET     2   /* IP protocol family.  */
#define PF_AX25     3   /* Amateur Radio AX.25.  */
#define PF_IPX      4   /* Novell Internet Protocol.  */
#define PF_APPLETALK    5   /* Appletalk DDP.  */
#define PF_NETROM   6   /* Amateur radio NetROM.  */
#define PF_BRIDGE   7   /* Multiprotocol bridge.  */
#define PF_ATMPVC   8   /* ATM PVCs.  */
#define PF_X25      9   /* Reserved for X.25 project.  */
#define PF_INET6    10  /* IP version 6.  */
#define PF_ROSE     11  /* Amateur Radio X.25 PLP.  */
#define PF_DECnet   12  /* Reserved for DECnet project.  */
#define PF_NETBEUI  13  /* Reserved for 802.2LLC project.  */
#define PF_SECURITY 14  /* Security callback pseudo AF.  */
#define PF_KEY      15  /* PF_KEY key management API.  */
#define PF_NETLINK  16
#define PF_ROUTE    PF_NETLINK /* Alias to emulate 4.4BSD.  */
#define PF_PACKET   17  /* Packet family.  */
#define PF_ASH      18  /* Ash.  */
#define PF_ECONET   19  /* Acorn Econet.  */
#define PF_ATMSVC   20  /* ATM SVCs.  */
#define PF_RDS      21  /* RDS sockets.  */
#define PF_SNA      22  /* Linux SNA Project */
#define PF_IRDA     23  /* IRDA sockets.  */
#define PF_PPPOX    24  /* PPPoX sockets.  */
#define PF_WANPIPE  25  /* Wanpipe API sockets.  */
#define PF_LLC      26  /* Linux LLC.  */
#define PF_CAN      29  /* Controller Area Network.  */
#define PF_TIPC     30  /* TIPC sockets.  */
#define PF_BLUETOOTH    31  /* Bluetooth sockets.  */
#define PF_IUCV     32  /* IUCV sockets.  */
#define PF_RXRPC    33  /* RxRPC sockets.  */
#define PF_ISDN     34  /* mISDN sockets.  */
#define PF_PHONET   35  /* Phonet sockets.  */
#define PF_IEEE802154   36  /* IEEE 802.15.4 sockets.  */
#define PF_CAIF     37  /* CAIF sockets.  */
#define PF_ALG      38  /* Algorithm sockets.  */
#define PF_NFC      39  /* NFC sockets.  */
#define PF_VSOCK    40  /* vSockets.  */
#define PF_MAX      41  /* For now..  */

/* Address families.  */
#define AF_UNSPEC   PF_UNSPEC
#define AF_LOCAL    PF_LOCAL
#define AF_UNIX     PF_UNIX
#define AF_FILE     PF_FILE
#define AF_INET     PF_INET
#define AF_AX25     PF_AX25
#define AF_IPX      PF_IPX
#define AF_APPLETALK    PF_APPLETALK
#define AF_NETROM   PF_NETROM
#define AF_BRIDGE   PF_BRIDGE
#define AF_ATMPVC   PF_ATMPVC
#define AF_X25      PF_X25
#define AF_INET6    PF_INET6
#define AF_ROSE     PF_ROSE
#define AF_DECnet   PF_DECnet
#define AF_NETBEUI  PF_NETBEUI
#define AF_SECURITY PF_SECURITY
#define AF_KEY      PF_KEY
#define AF_NETLINK  PF_NETLINK
#define AF_ROUTE    PF_ROUTE
#define AF_PACKET   PF_PACKET
#define AF_ASH      PF_ASH
#define AF_ECONET   PF_ECONET
#define AF_ATMSVC   PF_ATMSVC
#define AF_RDS      PF_RDS
#define AF_SNA      PF_SNA
#define AF_IRDA     PF_IRDA
#define AF_PPPOX    PF_PPPOX
#define AF_WANPIPE  PF_WANPIPE
#define AF_LLC      PF_LLC
#define AF_CAN      PF_CAN
#define AF_TIPC     PF_TIPC
#define AF_BLUETOOTH    PF_BLUETOOTH
#define AF_IUCV     PF_IUCV
#define AF_RXRPC    PF_RXRPC
#define AF_ISDN     PF_ISDN
#define AF_PHONET   PF_PHONET
#define AF_IEEE802154   PF_IEEE802154
#define AF_CAIF     PF_CAIF
#define AF_ALG      PF_ALG
#define AF_NFC      PF_NFC
#define AF_VSOCK    PF_VSOCK
#define AF_MAX      PF_MAX

```
AF_xx地址簇，BF_xx协议簇
AF_xx 与 BF_xx值相同

通常PF_INET表示互联网协议簇（TCP/IP协议簇）；或者PF_PACKET协议栈（底层数据包接口）

不同的AF_xx或BF_xx需要的目的结构不同

函数原型
int socket(int domain, int type, int protocol);

`domain`:协议域，又称协议簇(family)。常用的协议簇有AF_INET,AF_INET6，AF_LOCAL(或称AF_UNIX,UNIX域Socket)、AF_ROUTE。协议簇决定Socket的地址类型。在通信中必须采用对应的地址，如AF_INET决定了要用ipv4地址(32位)与端口号(16位)的组合、AF_UNIX决定了要用一个绝对路径名作为地址。

`type`:指定Socket类型。常用的socket类型有SOCK_STREAM(用于TCP)、SOCK_DGRAM（用于UDP）、SOCK_RAW（ICMP,IGMP）、SOCK_PACKET、SOCK_SEQPACKET、FA_PACKET.


`protocol`：指定协议。常用的协议有IPPROTO_TCP、IPPROTO_UDP、IPPROTO_STCP、IPPROTO_TIPC。分别对应TCP传输协议、UDP传输协议、STCP传输协议、TIPC传输协议。



链路层套接字：PF_PACKET
该套接字的打开需要用户root权限。

其中socket type有两种类型SOCK_RAW,SOCK_DGRAM。
`SOCK_RAW`:它包含了MAC层头部信息的原始分组，当然这种类型的套接字在发送的时候需要自己加上一个MAC头部（以太网头部，其类型定义在linux/if_ether.h中ethhdr）。应用：dhcpc中接收来自DHCP服务器数据时创建该套接字。portocol为：htons(ETH_P_IP)。 struct sockaddr_ll sock;
`SOCK_DGRAM`:它已经进行了MAC层头部处理的，即收到的帧已经去掉了头部。应用：dhcpc在发送Discover等报文时使用该类型创建套接字，可无需添加以太网头部，只需添加IP头部、UDP头部和Data。portocol为：htons(ETH_P_IP)。

`protocol`是指其送交的上层的协议好，如IP为0x0800.当其为htons(ETH_P_ALL)（其宏定义为0）时表示收发所有协议。

创建好套接字后，就可以通过UDP一样的recvform和sendto函数进行数据的收发，其目的的地址结构sockaddr_ll。这与传输层的地址结构定义是不一样的，其长度为20字节。（在TCP/IP的链路层地址中使用18字节），而传输层额结构长度为16字节。
```c
struct sockaddr_ll
{
    unsigned short sll_family; // 总是AF_INET
    unsigned short sll_protocol; //物理层的协议
    int sll_ifindex; // 接口号
    unsigned short sll_hatype; // 报文类型
    unsigned char sll_pkttype; // 分组类型
    unsigned char sll_halen;   // 地址长度
    unsigned char sll_addr[8]; //物理层地址
}
```

eg:
```c
#define MAC_BCAST_ADDR (unsigned char *) "\xff\xff\xff\xff\xff\xff"

// dhcp discover
int dhcp_discover(...)
{
    int fd;
    fd = socket(PF_PACKET,SOCK_DGRAM,htons(ETH_P_IP));
    
    struct sockaddr_ll dest;
    memset(&dest,0,sizeof(dest));
    dest.sll_family = AF_PACKET;
    dest.sll_protocol = htons(ETH_P_IP);
    dest.sll_ifindex = ifindex; // 随机数
    dest.sll_halen = 6;
    memcpy(dest.sll_addr,MAC_BCAST_ADDR,6);
}
```

参考资料：
1、[raw_socket以及普通socket使用终极总结][1]
2、[socket建立][2]

[1]:http://blog.csdn.net/luchengtao11/article/details/76635669
[2]:http://blog.csdn.net/ttyttytty12/article/details/8141910





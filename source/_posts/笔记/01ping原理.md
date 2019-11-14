---
title: PING原理
categories:
- 笔记
tags:
- ping
other: note_01  
date: 2018-07-05
updated: 2018-07-05
---
<div align="center">

![](/img/note_01/01.png)
</div>

&emsp;&emsp;由上面的执行结果可以看到，ping命令执行后显示出被测试系统的`主机名`和`相应IP`，返回给当前主机的ICMP报文序列号（seq）,`生存时间`（ttl）,和`往返时间`（time单位是毫秒，即千分之一秒）。模拟ping命令，这些信息非常重要。要真正了解ping命令的实现原理，就要了解ping命令所使用到的TCP/IP协议。

## ping命令介绍 ##
&emsp;&emsp;PING(Packet Internet Groper)，因特网包探索其，用于测试网络连接量的程序。Ping发出一个ICMP(Internet Control Messages Protocol)即因特网信报控制协议；回声请求消息给目的地并报告是否收到所希望的ICMP echo(ICMP回声应答)。它是用来检查网络是否通畅或者网络连速度的命令。它所利用的原理是这样的：利用网络上机器IP得治的唯一性，给目标IP地址发送一个数据包，再要求对方返回一个同样大小的数据包来确定两台网络机器是否连接相通，时延是多少。
&emsp;&emsp;其中关键在于发送ICMP数据包，然后对接收到的包进行一定的处理。不可避免，我们要发送ICMP包，必须自己来构建一个包出来。再来回顾一下ICMP:
&emsp;&emsp;ICMP(Internet Control Message Protocol)Internet控制保温协议。它是TCP/IP协议簇的一个子协议，用于在IP主机、路由器之间传递控制消息。ICMP是面向无连接的协议。
&emsp;&emsp;ping命令值使用众多ICMP报文中的两种：“请求回送(ICMP_ECHO)”和“请求回应(ICMP_ECHOREPLY)”。这两种报文的报头格式如下：
<table class="table_center"><tr><td>类型(TYPE)</td><td>编码(CODE)</td><td>校验和(CHECKSUM)</td></tr><tr><td colspan="2">标识符(ID)</td><td>顺序号(SEQ)</td></tr></table>&emsp;&emsp;当TYPE字段为`ICMP_ECHO`,CODE字段为0时，代表PING请求报文;TYPE字段为`ICMP_ECHOREPLY`,CODE字段为`0`时，代表PING应答报文/

icmp结构体   //  netinet/ip_icmp.h
```c
struct icmp
{
	u_int8_t	icmp_type;              /* type of message, see below */
	u_int8_t	icmp_code;              /* type sub code */
	u_int16_t	icmp_cksum;             /* ones complement checksum of struct */
	union
	{
		u_char		ih_pptr;        /* ICMP_PARAMPROB */
		struct in_addr	ih_gwaddr;      /* gateway address */
		struct ih_idseq                 /* echo datagram */
		{
			u_int16_t	icd_id;
			u_int16_t	icd_seq;
		}		ih_idseq;
		u_int32_t	ih_void;

		/* ICMP_UNREACH_NEEDFRAG -- Path MTU Discovery (RFC1191) */
		struct ih_pmtu
		{
			u_int16_t	ipm_void;
			u_int16_t	ipm_nextmtu;
		} ih_pmtu;

		struct ih_rtradv
		{
			u_int8_t	irt_num_addrs;
			u_int8_t	irt_wpa;
			u_int16_t	irt_lifetime;
		} ih_rtradv;
	} icmp_hun;
#define icmp_pptr	icmp_hun.ih_pptr
#define icmp_gwaddr	icmp_hun.ih_gwaddr
#define icmp_id		icmp_hun.ih_idseq.icd_id
#define icmp_seq	icmp_hun.ih_idseq.icd_seq
#define icmp_void	icmp_hun.ih_void
#define icmp_pmvoid	icmp_hun.ih_pmtu.ipm_void
#define icmp_nextmtu	icmp_hun.ih_pmtu.ipm_nextmtu
#define icmp_num_addrs	icmp_hun.ih_rtradv.irt_num_addrs
#define icmp_wpa	icmp_hun.ih_rtradv.irt_wpa
#define icmp_lifetime	icmp_hun.ih_rtradv.irt_lifetime
	union
	{
		struct
		{
			u_int32_t	its_otime;
			u_int32_t	its_rtime;
			u_int32_t	its_ttime;
		} id_ts;
		struct
		{
			struct ip idi_ip;
			/* options and then 64 bits of data */
		}			id_ip;
		struct icmp_ra_addr	id_radv;
		u_int32_t		id_mask;
		u_int8_t		id_data[1];
	} icmp_dun;
#define icmp_otime	icmp_dun.id_ts.its_otime
#define icmp_rtime	icmp_dun.id_ts.its_rtime
#define icmp_ttime	icmp_dun.id_ts.its_ttime
#define icmp_ip		icmp_dun.id_ip.idi_ip
#define icmp_radv	icmp_dun.id_radv
#define icmp_mask	icmp_dun.id_mask
#define icmp_data	icmp_dun.id_data
};
```
&emsp;&emsp;使用宏定义表达更简洁，其中ICMP报文为8字节，数据报长度最大为64K字节。

&emsp;&emsp;校验和算法：这一算法称为网际校验和算法，把校验的数据16位进行累加，然后取反码，若数据字节长度为奇数，则数据尾部补一个字节的0以凑成偶数。此算法适用于IPv4、ICMPv4、ICMPv6、UDP和TCP校验和，校验和字段为上述ICMP数据结构的icmp_cksum变量。
&emsp;&emsp;标识符：用于唯一标识ICMP报文，为上述ICMP数据结构的icmp_id宏定义指的变量。
&emsp;&emsp;顺序号：ping命令的icmp_seq便由这里读出，代表ICMP报文的发送顺序，为上述ICMP数据结构的icmp_seq宏所指的变量。

**ICMP封包后**：<table class="table_center"><tr><th>ICMP报头</th><th>ICMP报文</th></tr></table>
&emsp;&emsp;ICMP是为网管和目标主机二提供的一种差错控制机制，使它们在遇到差错时能把错误报告给报文源发方。ICMP协议是IP层的一个协议，但是由于差错报告在发送给报文源发方时可能也要经过若干子网，因此牵扯到路由选择等问题，所以ICMP报文通过IP协议来发送。ICMP数据报的数据发送前需要两级封装：首先添加ICMP报头形成ICMP报文，再添加IP报头形成IP数据报。因此我们还需知道IP报文的格式。

&emsp;&emsp;**IP报文格式**：<div align="center">![](/img/note_01/02.png)</div>
整个ICMP报文作为IP报文的数据部分，再给ICMP报文加个IP头部：
<table class="table_center"><tr><th>IP头部</th><th>ICMP头部</th><th>ICMP数据</th></tr></table>

**注:** ip头部的考虑，在发送ICMP报文时不需要考虑IP头部，只需要组建一个完整测ICMP发送报文即TYPE为ICMP_ECHO、CODE为0的PING报文。在PING应答报文中对接收数据分析时，必须考虑IP头部，先去除IP头部后，进行对ICMP报文处理。
&emsp;&emsp;PING请求（发送）报文不考虑IP头部，PING应答（接收）报文考虑去除IP头部。

ip结构体  
```c
//  netinet/ip.h
struct ip
{
#if __BYTE_ORDER == __LITTLE_ENDIAN
	unsigned int ip_hl:4;               /* header length */
	unsigned int ip_v:4;                /* version */
#endif
#if __BYTE_ORDER == __BIG_ENDIAN
	unsigned int ip_v:4;                /* version */
	unsigned int ip_hl:4;               /* header length */
#endif
	u_int8_t ip_tos;                    /* type of service */
	u_short ip_len;                     /* total length */
	u_short ip_id;                      /* identification */
	u_short ip_off;                     /* fragment offset field */
#define IP_RF 0x8000                    /* reserved fragment flag */
#define IP_DF 0x4000                    /* dont fragment flag */
#define IP_MF 0x2000                    /* more fragments flag */
#define IP_OFFMASK 0x1fff               /* mask for fragmenting bits */
	u_int8_t ip_ttl;                    /* time to live */
	u_int8_t ip_p;                      /* protocol */
	u_short ip_sum;                     /* checksum */
	struct in_addr ip_src, ip_dst;      /* source and dest address */
};
```
PING程序中主要使用以下数据：
- IP报文头部长度IHL(Internet Header Length),以4字节为单位记录IP头部长度（ip_hl）。
- 生命周期(TTL)以秒为单位，指出IP数据报能在网络上停留的最长时间，其值由发送方设定，并在经过路由的每一个节点时建议，当该值为0时，数据报被丢弃（ip_ttl）。

ping程序代码流程：
- 1、参数合法性检查，获取（转换）目标地址
- 2、发送报文
- 3、接收报文
- 4、打印PING信息

**1、参数合法性检查**
```c

int main(int argc,char *argv[]){
    in_addr_t inaddr;
    struct sockaddr_in dest_addr;
    int socket_fd;  
    int size = 50 *1024;
    struct hostent *p_host;
    int n_send = 1;
    if(argc < 2){
        printf("Usgae: %s [hostname/ip address]\n",argv[0]);
    }
    /*
     * 创建socket套接字 AF_INET ipv4  IPPROTO_ICMP icmp协议
     */
    socket_fd = socket(AF_INET,SOCK_RAW,IPPROTO_ICMP); 
    if(socket_fd < 0){
        perror("fail socket");
        exit(EXIT_FAILURE);
    }
    
    /*
     * setsockopt 这里使用主要是设置接收数据包缓冲区，避免了send(),recv()不断的循环收发
     */

    if(setsockopt(socket_fd,SOL_SOCKET,SO_RCVBUF,&size,sizeof(size)) < 0 ){
        perror("fail setsocketopt");    
        exit(EXIT_FAILURE);
    }
    bzero(&dest_addr,sizeof(dest_addr));
    dest_addr.sin_family = AF_INET;
    
    inaddr = inet_addr(argv[1]); // 将点分十进制ip地址转换为网络字节序
    if(inaddr == INADDR_NONE){
        p_host = gethostbyname2_block_proc(argv[1],12); //gethostbyname2 防止阻塞处理
        if(NULL == p_host){
            printf("unknow host:%s\n",argv[1]);
            exit(EXIT_FAILURE);
        }
        memcpy((char *)&dest_addr.sin_addr,p_host->h_addr,p_host->h_length);    
    }else{
        dest_addr.sin_addr.s_addr = inaddr;
    }
    if(NULL != p_host){
        printf("PING %s",p_host->h_name);
    }else{
        printf("PING %s",argv[1]);
    }
    printf("(%s) %d bytes of data.\n",inet_ntoa(dest_addr.sin_addr),ICMP_LEN);  
    signal(SIGINT,statistics);
    pHost = p_host; // pHost statisticsd 打印信息使用
    IP = argv[1];  // IP statistics打印信息使用
    SocketICMP = socket_fd;  //SocketICMP statistics()函数close套接字使用
    while(n_send < SEND_NUM ){
        send_packet(socket_fd,&dest_addr,n_send);
        
        recv_packet(socket_fd,&dest_addr);
        sleep(1);
        n_send++;
        nSend = n_send; // nSend statistics打印信息使用
    }
    statistics();
}
```

**2、发送数据**
发送数据主要包括组建ICMP报文，发送报文；组建ICMP报文时需要计算校验和
```c
u_int16_t compute_cksum(u_int16_t *p_data,int data_len){
    u_int16_t *p_tmp_data = p_data;
    int len = data_len;
    u_int32_t sum = 0; // sum 必须为 u_int32_t 不能为 u_int16_t   
    while(len > 1){
        sum += *p_tmp_data++;
        len -= 2;
    }
    if(1 == len){
        u_int16_t tmp = *p_tmp_data;
        tmp &= 0xff00;
        sum += tmp;
    }
    while(sum >> 16){
        sum = (sum >> 16) + (sum & 0x0000ffff);
    }
    sum = ~sum;
    return sum;

}


/*
 * 组建ICMP报文
 */
void set_icmp(char *p_send_buffer,u_int16_t seq){
    struct icmp *p_icmp;
    struct timeval *p_time;
    
    p_icmp = (struct icmp *)p_send_buffer;
    p_icmp->icmp_type = ICMP_ECHO;
    p_icmp->icmp_code = 0;
    p_icmp->icmp_cksum = 0;
    p_icmp->icmp_seq = seq;
    p_icmp->icmp_id = getpid();
    p_time = (struct timeval *)p_icmp->icmp_data;
    gettimeofday(p_time,NULL);
    p_icmp->icmp_cksum = compute_cksum((u_int16_t *)p_icmp,ICMP_LEN);
    
    if(seq == 1){
        FirstSendTime = *p_time;
    }   
}

int send_packet(int socket_fd,struct sockaddr_in *p_dest_addr,int n_send){
    char send_buffer[BUFFER_LEN];
    set_icmp(send_buffer,n_send);
    if(sendto(socket_fd,send_buffer,ICMP_LEN,0,(
        struct sockaddr *)p_dest_addr,sizeof(struct sockaddr_in))<0){
        perror("sendto");
        return 0;
    }
}
```
**3、接收数据**
接收数据包括接收数据和数据分析
```c
int unpack(char *p_recv_buffer,struct timeval *p_recv_time){
    struct ip *p_ip = (struct ip *)p_recv_buffer;
    struct icmp *p_icmp ;
    int ip_head_len;
    double rtt=0.0; 

    ip_head_len = p_ip->ip_hl << 2;
    p_icmp = (struct icmp *)(p_recv_buffer + ip_head_len);
    
    if(p_icmp->icmp_type == ICMP_ECHOREPLY && p_icmp->icmp_id == getpid()){
        struct timeval *p_send_time = (struct timeval *)p_icmp->icmp_data;
        rtt = get_rtt(p_recv_time,p_send_time);
        printf("%u bytes from %s:icmp_seq=%u ttl=%u time=%.1f ms\n",
            ntohs(p_ip->ip_len),inet_ntoa(p_ip->ip_src),p_icmp->icmp_seq,
            p_ip->ip_ttl,rtt);

        if(rtt < min || 0 == min){
            min = rtt;
        }
        if(rtt > max){
            max = rtt;
        }
        avg += rtt;
        mdev += rtt*rtt;

        return 0;
    }
    return -1;
}


int recv_packet(int socket_fd,struct sockaddr_in *p_dest_addr){
    int recv_bytes = 0;
    int addrlen = sizeof(struct sockaddr_in);
    char recv_buffer[BUFFER_LEN];
    struct timeval recv_time;
    
    signal(SIGALRM,statistics);
    alarm(WAIT_TIME);

    recv_bytes = recvfrom(socket_fd,recv_buffer,BUFFER_LEN,0,
        (struct sockaddr *)p_dest_addr,&addrlen);
    if(recv_bytes < 0){
        perror("recvfrom");
        return 0;
    }

    gettimeofday(&recv_time,NULL);
    LastRecvTime = recv_time;
    if(unpack(recv_buffer,&recv_time) == -1){
        return -1;
    }
    nRecv++;
}
```

```c
double get_rtt(struct timeval *p_recv_time,struct timeval *p_send_time){
    struct timeval tmp_time = *p_recv_time;
    
    tmp_time.tv_usec -= p_send_time->tv_usec;
    if(tmp_time.tv_usec < 0){
        --(tmp_time.tv_sec);
        tmp_time.tv_usec += 1000000;
    }
    tmp_time.tv_sec -= p_send_time->tv_sec;
    
    return (tmp_time.tv_sec *1000.0) + (tmp_time.tv_usec / 1000.0);
}
```

**4、打印数据**
统计数据
```c
void statistics(){
    double tmp;
    avg /= nRecv;
    tmp = mdev/nRecv - avg * avg;
    mdev = sqrt(tmp);
    
    if(NULL != pHost){
        printf("--- %s ping statistics ---\n",pHost->h_name);
    }else{
        printf("--- %s ping statistics ---\n",IP);
    }
    printf("%d packets transmitted, %d received, %d%% packet loss, time %dms\n",
        nSend,nRecv,(nSend-nRecv)/nSend *100,(int)get_rtt(&LastRecvTime,&FirstSendTime));
    printf("rtt min/avg/max/dev = %.3f/%.3f/%.3f/%.3f ms\n",min,avg,max,mdev);
    
    close(SocketICMP);
    exit(0);
}
```

完整代码：
```c
#include <stdio.h>
#include <sys/time.h>
#include <netdb.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <string.h>
#include <netinet/ip_icmp.h>
#include <sys/types.h>
#include <unistd.h>
#include <sys/socket.h>
#include <signal.h>
#include <math.h>
#include <setjmp.h>


#define SEND_NUM 100
#define BUFFER_LEN 128
#define ICMP_HEAD_LEN 8
#define ICMP_DATA_LEN 56
#define ICMP_LEN (ICMP_HEAD_LEN + ICMP_DATA_LEN)

//char SendBuffer[BUFFER_LEN];
//char RecvBuffer[BUFFER_LEN];

struct hostent *pHost;
char *IP;
int nRecv = 0;
int nSend = 0;

double min=0.0;
double avg=0.0;
double max=0.0;
double mdev =0.0;

struct timeval FirstSendTime;
struct timeval LastRecvTime;

#define WAIT_TIME 5

int SocketICMP;

u_int16_t compute_cksum(u_int16_t *p_data,int data_len){
    u_int16_t *p_tmp_data = p_data;
    int len = data_len;
    u_int32_t sum = 0; // sum 必须为 u_int32_t 不能为 u_int16_t   
    while(len > 1){
        sum += *p_tmp_data++;
        len -= 2;
    }
    if(1 == len){
        u_int16_t tmp = *p_tmp_data;
        tmp &= 0xff00;
        sum += tmp;
    }
    while(sum >> 16){
        sum = (sum >> 16) + (sum & 0x0000ffff);
    }
    sum = ~sum;
    return sum;

}


void set_icmp(char *p_send_buffer,u_int16_t seq){
    struct icmp *p_icmp;
    struct timeval *p_time;
    
    p_icmp = (struct icmp *)p_send_buffer;
    p_icmp->icmp_type = ICMP_ECHO;
    p_icmp->icmp_code = 0;
    p_icmp->icmp_cksum = 0;
    p_icmp->icmp_seq = seq;
    p_icmp->icmp_id = getpid();
    p_time = (struct timeval *)p_icmp->icmp_data;
    gettimeofday(p_time,NULL);
    p_icmp->icmp_cksum = compute_cksum((u_int16_t *)p_icmp,ICMP_LEN);
    
    if(seq == 1){
        FirstSendTime = *p_time;
    }   
}

int send_packet(int socket_fd,struct sockaddr_in *p_dest_addr,int n_send){
    char send_buffer[BUFFER_LEN];
    set_icmp(send_buffer,n_send);
    if(sendto(socket_fd,send_buffer,ICMP_LEN,0,(
        struct sockaddr *)p_dest_addr,sizeof(struct sockaddr_in))<0){
        perror("sendto");
        return 0;
    }
}
double get_rtt(struct timeval *p_recv_time,struct timeval *p_send_time){
    struct timeval tmp_time = *p_recv_time;
    
    tmp_time.tv_usec -= p_send_time->tv_usec;
    if(tmp_time.tv_usec < 0){
        --(tmp_time.tv_sec);
        tmp_time.tv_usec += 1000000;
    }
    tmp_time.tv_sec -= p_send_time->tv_sec;
    
    return (tmp_time.tv_sec *1000.0) + (tmp_time.tv_usec / 1000.0);

}

void statistics(){
    double tmp;
    avg /= nRecv;
    tmp = mdev/nRecv - avg * avg;
    mdev = sqrt(tmp);
    
    if(NULL != pHost){
        printf("--- %s ping statistics ---\n",pHost->h_name);
    }else{
        printf("--- %s ping statistics ---\n",IP);
    }
    printf("%d packets transmitted, %d received, %d%% packet loss, time %dms\n",
        nSend,nRecv,(nSend-nRecv)/nSend *100,(int)get_rtt(&LastRecvTime,&FirstSendTime));
    printf("rtt min/avg/max/dev = %.3f/%.3f/%.3f/%.3f ms\n",min,avg,max,mdev);
    
    close(SocketICMP);
    exit(0);
}

int unpack(char *p_recv_buffer,struct timeval *p_recv_time){
    struct ip *p_ip = (struct ip *)p_recv_buffer;
    struct icmp *p_icmp ;
    int ip_head_len;
    double rtt=0.0; 

    ip_head_len = p_ip->ip_hl << 2;
    p_icmp = (struct icmp *)(p_recv_buffer + ip_head_len);
    
    if(p_icmp->icmp_type == ICMP_ECHOREPLY && p_icmp->icmp_id == getpid()){
        struct timeval *p_send_time = (struct timeval *)p_icmp->icmp_data;
        rtt = get_rtt(p_recv_time,p_send_time);
        printf("%u bytes from %s:icmp_seq=%u ttl=%u time=%.1f ms\n",
            ntohs(p_ip->ip_len),inet_ntoa(p_ip->ip_src),p_icmp->icmp_seq,
            p_ip->ip_ttl,rtt);

        if(rtt < min || 0 == min){
            min = rtt;
        }
        if(rtt > max){
            max = rtt;
        }
        avg += rtt;
        mdev += rtt*rtt;

        return 0;
    }
    return -1;
}


int recv_packet(int socket_fd,struct sockaddr_in *p_dest_addr){
    int recv_bytes = 0;
    int addrlen = sizeof(struct sockaddr_in);
    char recv_buffer[BUFFER_LEN];
    struct timeval recv_time;
    
    signal(SIGALRM,statistics);
    alarm(WAIT_TIME);

    recv_bytes = recvfrom(socket_fd,recv_buffer,BUFFER_LEN,0,
        (struct sockaddr *)p_dest_addr,&addrlen);
    if(recv_bytes < 0){
        perror("recvfrom");
        return 0;
    }

    gettimeofday(&recv_time,NULL);
    LastRecvTime = recv_time;
    if(unpack(recv_buffer,&recv_time) == -1){
        return -1;
    }
    nRecv++;
}
static sigjmp_buf jmpbuf;
static void alarm_func()
{
     siglongjmp(jmpbuf, 1);
}

static struct hostent * gethostbyname2_block_proc(char *p_hostname,int timeout){
     struct hostent *p_ret_hostent;
 
     signal(SIGALRM, alarm_func);
     if(sigsetjmp(jmpbuf, 1) != 0)
     {
           alarm(0); /* 取消闹钟 */
           signal(SIGALRM, SIG_IGN);
           return NULL;
     }
     alarm(timeout); /* 设置超时时间 */
     p_ret_hostent = gethostbyname2(p_hostname,AF_INET); // gethostbyname2指定AF_IENT IPV4地址
     signal(SIGALRM, SIG_IGN);
 
     return p_ret_hostent;

}

int main(int argc,char *argv[]){
    in_addr_t inaddr;
    struct sockaddr_in dest_addr;
    int socket_fd;  
    int size = 50 *1024;
    struct hostent *p_host;
    int n_send = 1;
    if(argc < 2){
        printf("Usgae: %s [hostname/ip address]\n",argv[0]);
    }
    /*
     * 创建socket套接字 AF_INET ipv4  IPPROTO_ICMP icmp协议
     */
    socket_fd = socket(AF_INET,SOCK_RAW,IPPROTO_ICMP); 
    if(socket_fd < 0){
        perror("fail socket");
        exit(EXIT_FAILURE);
    }
    /*
     * setsockopt 这里使用主要是设置接收数据包缓冲区，避免了send(),recv()不断的循环收发
     */

    if(setsockopt(socket_fd,SOL_SOCKET,SO_RCVBUF,&size,sizeof(size)) < 0 ){
        perror("fail setsocketopt");    
        exit(EXIT_FAILURE);
    }
    bzero(&dest_addr,sizeof(dest_addr));
    dest_addr.sin_family = AF_INET;
    
    inaddr = inet_addr(argv[1]); // 将点分十进制ip地址转换为网络字节序
    if(inaddr == INADDR_NONE){
        p_host = gethostbyname2_block_proc(argv[1],12); //gethostbyname2 防止阻塞处理
        if(NULL == p_host){
            printf("unknow host:%s\n",argv[1]);
            exit(EXIT_FAILURE);
        }
        memcpy((char *)&dest_addr.sin_addr,p_host->h_addr,p_host->h_length);    
    }else{
        dest_addr.sin_addr.s_addr = inaddr;
    }
    if(NULL != p_host){
        printf("PING %s",p_host->h_name);
    }else{
        printf("PING %s",argv[1]);
    }
    printf("(%s) %d bytes of data.\n",inet_ntoa(dest_addr.sin_addr),ICMP_LEN);  
    signal(SIGINT,statistics);
    pHost = p_host; // pHost statisticsd 打印信息使用
    IP = argv[1];  // IP statistics打印信息使用
    SocketICMP = socket_fd;  //SocketICMP statistics()函数close套接字使用
    while(n_send < SEND_NUM ){
        send_packet(socket_fd,&dest_addr,n_send);
        
        recv_packet(socket_fd,&dest_addr);
        sleep(1);
        n_send++;
        nSend = n_send; // nSend statistics打印信息使用
    }
    statistics();
}
```
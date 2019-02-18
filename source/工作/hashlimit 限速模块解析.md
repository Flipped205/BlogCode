---
title: hashlimit 限速模块解析
categories:
- 工作
tags:
- hashlimit
other: work_03
date: 2018-08-02
---

## **1 hashlimit简介** ##

### **1.1 令牌桶算法** ###

hashlimit 的匹配是基于令牌桶 (Token bucket）模型的。
令牌桶是一种网络通讯中常见的缓冲区工作原理，它有两个重要的参数，令牌桶容量 n 和令牌产生速率 s。我们可以把令牌当成是门票，而令牌桶则是负责制作和发放门票的管理员，它手里最多有 n 张令牌。一开始，管理员开始手里有 n 张令牌。每当一个数据包到达后，管理员就看看手里是否还有可用的令牌。如果有，就把令牌发给这个数据包，hashlimit 就告诉 iptables，这个数据包被匹配了。而当管理员把手上所有的令牌都发完了，再来的数据包就拿不到令牌了。这时，hashlimit 模块就告诉iptables，这个数据包不能被匹配。除了发放令牌之外，只要令牌桶中的令牌数量少于 n，它就会以速率 s 来产生新的令牌，直到令牌数量到达 n 为止。通过令牌桶机制，即可以有效的控制单位时间内通过（匹配）的数据包数量，又可以容许短时间内突发的大量数据包的通过（只要数据包数量不超过令牌桶n）。

### **1.2 使用介绍** ###

hashlimit 是 iptables 的一个匹配模块，用它结合 iptables 的其它命令可以实现限速的功能。iptables 的基本原理是“匹配--处理”，hashlimit 在这个工作过程中只能起到匹配的作用，它本身是无法对网络数据包进行任何处理的。

#### **1.2.1 命令使用** ####


因此，利用hashlimit来限速需要包括两个步骤：1、对符合hashlimit匹配规则包放行，2、丢弃/拒绝未放行的包。下面是一个简单的例子：

```shell
#在以字节为单位进行限速的模式
iptables -t mangle -w -A limit_chain -d 10.10.10.231/32 -m hashlimit --hashlimit-upto 1mb/s --hashlimit-burst 1mb --hashlimit-mode dstip --hashlimit-name dst_64_51_06_5C_A0_8A -j RETURN
iptables -t mangle -w -A limit_chain -d 10.10.10.231/32 -j DROP

#在以包为单位进行限速的模式
iptables -t mangle -w -A limit_chain -d 10.10.10.125/32 -m hashlimit --hashlimit-name test --hashlimit-upto 16/sec --hashlimit-burst 32 --hashlimit-mode dstip --hashlimit-htable-expire 180000 -j ACCEPT
iptables -t mangle -w -A limit_chain -d 10.10.10.125/32 -j DROP 

#对于两种模式的选择并不需要额外操作，代码会通过解析 --hashlimit-upto/above 参数后的配置值是否包含 b/s 单位，来判断采用哪种模式
```

使用需要了解以下几个参数:
--hashlimit-name：定义这条 hashlimit 规则的名称, 所有的条目（entry）都存放在/proc/net/ipt_hashlimit/{hashlimit-name}里
--hashlimit-mode：限制的类型，可以是源地址/源端口/目标地址/目标端口
--hashlimit-srcmask：当 mode 设置为 srcip 时, 配置相应的掩码表示一个网段
--hashlimit-upto: 允许进来的包最大速率
--hashlimit-above：允许进来的包最小速率
--hashlimit-burst：允许突发的个数(其实就是令牌桶最大容量)
--hashlimit-htable-max：hash 的最大条目数
--hashlimit-htable-expire：proc 信息记录时间, 用于老化 proc 信息记录，单位毫秒(milliseconds)
--hashlimit-htable-gcinterval：垃圾回收器回收的间隔时间，也是用于老化 proc 信息记录，单位毫秒

#### **1.2.2 查看proc信息** ####
在以字节为单位进行限速的模式下，查看 /proc/net/ipt_hashlimit/dst_64_51_06_5C_A0_8A 文件:

```shell
$ cat /proc/net/ipt_hashlimit/dst_64_51_06_5C_A0_8A
59 0.0.0.0:0->10.10.10.231:0 4194304000 1 63999
```

- 第一个字段是 expire 倒计时时间(单位是秒), 比如这里设置 60000 毫秒, 即 60s, 如果 60s 内没有再次触发这个规则, 则会一直减到0 (此时删除相关链表节点，该记录为空); 如果触发则再次变为 60.
- 第二个字段是 dstip:port->srcip:port, 这里 mode 只设置了 dstip
- 第三个字段是当前剩余的令牌数，是实时变化
- 第四个字段是允许数据包突发放行的次数, 是一个定值
- 第五个字段是每16个字节消耗的令牌数, 是一个定值

在以包为单位进行限速的模式下，查看 /proc/net/ipt_hashlimit/test 文件:
查看 /proc/net/ipt_hashlimit/test 文件:

```shell
$ cat /proc/net/ipt_hashlimit/test
179 0.0.0.0:0->10.10.10.125:0 6400 6400 2000
```

- 第一个字段是 expire 倒计时时间(单位是秒), 比如这里设置 180000 毫秒, 即 180s, 如果 180s 内没有再次触发这个规则, 则会一直减到 0 (见上面关于 expire 解释); 如果触发则再次变为 180.
- 第二个字段是 srcip:port->dstip:port, 这里 mode 只设置了 srcip
- 第三个字段是当前剩余的令牌数，是实时变化
- 第四个字段是令牌桶最大容量, 是一个定值
- 第五个字段是一次触发使用的令牌数, 也是令牌产生速率, 也是一个定值

这些 proc 信息是内核的 hashlimit 模块完成计算写入的，具体算法过程结合了 iptables 和 netfilter 两部对用户配置数据的转换。

### **1.3 原理总结** ###

为了实现限速功能，可以假定令牌桶中的令牌数的产生速率是一定的（即每秒能够获取的令牌数是一定的），设置的限速值越小（即每秒能够通过的字节或者包数目越小），通过`令牌消耗量 = 令牌产生量`可以推测，每个字节或者包单位所消耗的令牌数就越大。

#### **1.3.1 重要宏定义** ####
先说明一下几个重要的宏定义，xt_hashlimit.c文件中，内核实现令牌桶算法时预先定义了如下几个值：

```c
#define _POW2_BELOW2(x) ((x)|((x)>>1))
#define _POW2_BELOW4(x) (_POW2_BELOW2(x)|_POW2_BELOW2((x)>>2))
#define _POW2_BELOW8(x) (_POW2_BELOW4(x)|_POW2_BELOW4((x)>>4))
#define _POW2_BELOW16(x) (_POW2_BELOW8(x)|_POW2_BELOW8((x)>>8))
#define _POW2_BELOW32(x) (_POW2_BELOW16(x)|_POW2_BELOW16((x)>>16))
#define POW2_BELOW32(x) ((_POW2_BELOW32(x)>>1) + 1)
```

上面 POW2_BELOW32(x) 宏的作用即是保留 x 在二进制形式下的最高位的 1，其余位置为 0

下面需要找到一个信息确定的情况来推算令牌产生速率这个定值。在代码运行的时候，32 位系统的整型数最大值为 0xFFFFFFFF，借此限定了每个字节或者包单位最多能够消耗 0xFFFFFFFF 个令牌，而由前面可知单位消耗量最大时限速值最小。通过该情况下的确定信息可以计算出令牌的消耗速率，也就是相应的令牌产生速率。（当然，如果你能神预感到其它的限速值情况下，相应的单位消耗令牌数，你也可以计算到一个类似的令牌产生速率）。

- 以包为单位的限速模式下，通过应用层 iptables 工具能够设置的最低限速值为 1/day（即每心跳 1/(HZ×60×60×24) 个包），即每心跳消耗 0xFFFFFFFF/(HZ×60×60×24) 个令牌，将该值设为该模式下的令牌产生速率，宏REDITS_PER_JIFFY 的值为 128(0x1000)。

  ```c
  #define MAX_CPJ (0xFFFFFFFF / (HZ*60*60*24))
  #define CREDITS_PER_JIFFY POW2_BELOW32(MAX_CPJ)
  ```

- 以字节为单位的限速模式下，通过应用层 iptables 工具能够设置的最低限速值为 1B/s（即每心跳 1/HZ 个字节），即每心跳消耗 0xFFFFFFFF/HZ 个令牌，将该值设为该模式下的令牌产生速率，宏 CREDITS_PER_JIFFY_BYTES 的值为 16777216(0x1000000)。

  ```c
  #define MAX_CPJ_BYTES (0xFFFFFFFF / HZ)
  #define CREDITS_PER_JIFFY_BYTES POW2_BELOW32(MAX_CPJ_BYTES)
  ```

#### **1.3.2 结论** ####
上面虽然对 hashlimit 模块使用到的令牌桶算法做了简要介绍，但是追踪分析源码能够发现如下结论：
对于以字节为单位的限速模式：

- 令牌的产生速率是一定的，为 0x1000000/心跳
- 令牌桶的最大容量是一定的，为 0x1000000 * HZ（HZ 为系统每秒心跳数，K2P 路由器配置为 250）
- 每16个字节消耗的令牌数和用户配置的限速值 rate 成反比关系，为 0x1000000 * HZ / (rate / 16 + 1)。
- 允许数据包突发放行的次数为 burst / rate 向上取整的结果，突发每产生一次相应的值减 1，该值不会增加。

对于以包为单位的限速模式：
- 令牌的产生速率也是一定的，为 128/心跳
- 令牌桶的最大容量是不一定的，为根据用户配置的限速值 rate 和 突发值 burst 决定，(32000 / rate) * burst
- 每个包消耗的令牌数和用户配置的限速值 rate 也成反比关系，为32000 / rate。

## **2 源码解析** ##
对该模块的探究，最基本的需要了解的是 iptables 是应用层的，其实质仅仅是一个定义规则的配置工具，当中的核心工作，数据包的拦截、转发、修改是在 Netfiler 中实现。

因此，通过追踪用户空间 iptables 的相关源码和内核空间 netfilter 的相关源码来解析 hashlimit 模块功能，hashlimit 模块在限速上提供了两种模式，一种是以包为单位的限速，一种是以字节为单位的限速。本文主要沿着以字节为单位的限速模式进行解析。

### **2.1 用户空间iptables相关代码解析** ###

通过 xtables_register_matches 函数在用户空间的 iptables 中注册一个匹配模块，用户空间的 match 是用 struct xptables_match{} 结构来表示的，所以需要去实例化一个该对象，然后对其关键成员进行初始化赋值。一般情况需要实现 help 函数、print 和 save 函数、x6_fcheck 函数和 x6_parse 函数就可以满足基本要求了。

```c
static struct xtables_match hashlimit_mt_reg[] = {
    {
        .version       = XTABLES_VERSION,
        .name          = "hashlimit",
        .revision      = 1,
        .family        = NFPROTO_IPV4,
        .size          = XT_ALIGN(sizeof(struct xt_hashlimit_mtinfo1)),
        .userspacesize = offsetof(struct xt_hashlimit_mtinfo1, hinfo),
        .help          = hashlimit_mt_help,
        .init          = hashlimit_mt4_init,
        .x6_parse      = hashlimit_mt_parse,
        .x6_fcheck     = hashlimit_mt_check,
        .print         = hashlimit_mt4_print,
        .save          = hashlimit_mt4_save,
        .x6_options    = hashlimit_mt_opts,
        .udata_size    = sizeof(struct hashlimit_mt_udata),
    },
    ...     //其他协议类型如NFPROTO_UNSPEC、NFPROTO_IPV6
}

xtables_register_matches(hashlimit_mt_reg, ARRAY_SIZE(hashlimit_mt_reg));
```

模块定义了结构体 hashlimit_cfg1 来保存用户配置的规则参数，规则名保存在 xt_hashlimit_mtinfo1 结构体中的 name 成员中。

```c
struct hashlimit_cfg1 {
    __u32 mode;   /* bitmask of XT_HASHLIMIT_HASH_* */
    __u32 avg;    /* Average secs between packets * scale */
    __u32 burst;  /* Period multiplier for upper limit. */

    /* user specified */
    __u32 size;     /* how many buckets */
    __u32 max;      /* max number of entries */
    __u32 gc_interval;  /* gc interval */
    __u32 expire;   /* when do entries expire? */

    __u8 srcmask, dstmask;
};

struct xt_hashlimit_mtinfo1 {
    char name[HASHLIMIT_NAMESIZE];
    struct hashlimit_cfg1 cfg;

    /* Used internally by the kernel */
    struct xt_hashlimit_htable *hinfo __attribute__((aligned(8)));
};
```

- hashlimit_mt_help()：当我们在命令行输入 iptables -m hashlimit -h 时，用于显示该模块用法的帮助信息。
- hashlimit_mt4_print()：当我们在命令行输入 iptables -L 时，该函数用于打印用户输入参数。往该函数中传入了一个 xt_entry_matc h的结构体，模块自定义的 xt_hashlimit_mtinfo1 数据存在这个结构体的data成员中。
- hashlimit_mt4_save() 和 hashlimit_mt4_print() 类似。
- hashlimit_mt_parse()：用于解析命令行参数的回调函数。

  ```c
  static void hashlimit_mt_parse(struct xt_option_call *cb)
  {
    struct xt_hashlimit_mtinfo1 *info = cb->data;
  
    xtables_option_parse(cb);
    switch (cb->entry->id) {
    case O_BURST:
        #解析--hashlimit-burst参数，进行单位转化和合法性校验，可设置最大为 XT_HASHLIMIT_BURST_MAX b/s，配置 burst 值
        info->cfg.burst = parse_burst(cb->arg, info);
        break;
    case O_UPTO:
        #解析--hashlimit-upto参数，后文中所述的 rate 值，配置 avg 值
        if (cb->invert)
            info->cfg.mode |= XT_HASHLIMIT_INVERT;
        #进行单位转化，调用bytes_to_cost()函数，info->cfg.avg = 2^32 / (rate >> 4 + 1)，配置限速模式
        if (parse_bytes(cb->arg, &info->cfg.avg, cb->udata))
            info->cfg.mode |= XT_HASHLIMIT_BYTES;
        #以包为单位限速模式，转化后为 SCALE / rate
        else if (!parse_rate(cb->arg, &info->cfg.avg, cb->udata))
            xtables_param_act(XTF_BAD_VALUE, "hashlimit",
                      "--hashlimit-upto", cb->arg);
        break;
    case O_ABOVE:
        #解析--hashlimit-above参数，区别在于对 cb->invert 判断处理，需要点明的是 cfg.mode 初始化为 0
        if (!cb->invert)
            info->cfg.mode |= XT_HASHLIMIT_INVERT;
        ......  #实现类似于 case O_UPTO
    case O_MODE:
        #解析--hashlimit-mode参数，配置匹配模式
        if (parse_mode(&info->cfg.mode, cb->arg) < 0)
            xtables_param_act(XTF_BAD_VALUE, "hashlimit",
                      "--hashlimit-mode", cb->arg);
        break;
    case O_SRCMASK:
        info->cfg.srcmask = cb->val.hlen;
        break;
    case O_DSTMASK:
        info->cfg.dstmask = cb->val.hlen;
        break;
    }
  }
  ```
- hashlimit_mt_check()：在调用本模块时，该函数做必须参数的有无校验，同时也对相应的数值范围做校验和转换。如本模块必须设置 --hashlimit-upto 或者 --hashlimit-above，设置的 burst 值一定要大于 avg 值。

  ```c
  static void hashlimit_mt_check(struct xt_fcheck_call *cb)
  {
    const struct hashlimit_mt_udata *udata = cb->udata;
    struct xt_hashlimit_mtinfo1 *info = cb->data;
    ......
  
    if (info->cfg.mode & XT_HASHLIMIT_BYTES) {
        uint32_t burst = 0;
        if (cb->xflags & F_BURST) {
            ......
            #重新配置 burst 值，保存 burst 值为输入 burst 值除输入 avg 值的结果（向上取整）
            burst = info->cfg.burst;
            burst /= cost_to_bytes(info->cfg.avg);  #此处调用 cost_to_bytes 和解析函数中的 bytes_to_cost 有对齐16字节整数倍的效果。
            if (info->cfg.burst % cost_to_bytes(info->cfg.avg))
                burst++;
            ......
        }
        info->cfg.burst = burst;
    } else if (info->cfg.burst > XT_HASHLIMIT_BURST_MAX)
        burst_error();
  }
  ```

### **2.2 内核空间 netfilter 相关代码解析** ###

#### ** 2.2.1 初始化模块注册 ** ####
内核中用 struct xt_match{} 结构来表示一个 match 模块。开发 match 的内核部分时，也必须去实例化一个 struct xt_match{} 对象，然后对其进行必要的初始化设置，最后通过 xt_register_matchs() 将其注册到 xt[AF_INET].match 全局链表中.

```c
static struct xt_match hashlimit_mt_reg[] __read_mostly = {
    {
        .name           = "hashlimit",
        .revision       = 1,
        .family         = NFPROTO_IPV4,
        .match          = hashlimit_mt,
        .matchsize      = sizeof(struct xt_hashlimit_mtinfo1),
        .checkentry     = hashlimit_mt_check,
        .destroy        = hashlimit_mt_destroy,
        .me             = THIS_MODULE,
    },
    ......
};

err = xt_register_matches(hashlimit_mt_reg, ARRAY_SIZE(hashlimit_mt_reg));
```

#### **2.2.2 核心match函数** ####
最关键的核心函数 hashlimit_mt()：

```c
static bool
hashlimit_mt(const struct sk_buff *skb, struct xt_action_param *par)
{
    const struct xt_hashlimit_mtinfo1 *info = par->matchinfo;
    struct xt_hashlimit_htable *hinfo = info->hinfo;
    unsigned long now = jiffies;
    struct dsthash_ent *dh;
    struct dsthash_dst dst;
    bool race = false;
    u32 cost;
    #创建 dsthash_dst 结构体，并根据匹配模式从 skb 中获取源ip或端口号、目的ip或端口号
    if (hashlimit_init_dst(hinfo, &dst, skb, par->thoff) < 0)
        goto hotdrop;

    rcu_read_lock_bh();
    #根据 ip 地址查找 xt_hashlimit_htable 表中的 dsthash_dst 节点，获取该 ip 的配置信息
    dh = dsthash_find(hinfo, &dst);
    if (dh == NULL) {
        #表中没有则创建，创建过程中会再次查找，防止其他进程创建，race标记再次查找的结果
        dh = dsthash_alloc_init(hinfo, &dst, &race);
        if (dh == NULL) {
            rcu_read_unlock_bh();
            goto hotdrop;
        } else if (race) {
            /* Already got an entry, update expiration timeout */
            dh->expires = now + msecs_to_jiffies(hinfo->cfg.expire);
            #其他进程创建的节点，则更新桶中令牌数
            rateinfo_recalc(dh, now, hinfo->cfg.mode);
        } else {
            dh->expires = jiffies + msecs_to_jiffies(hinfo->cfg.expire);
            #本次创建的新节点，则初始化桶中令牌数，并根据设置的限速值设定令牌消耗单位
            rateinfo_init(dh, hinfo);
        }
    } else {
        /* update expiration timeout */
        dh->expires = now + msecs_to_jiffies(hinfo->cfg.expire);
        #已有节点，则更新桶中令牌数
        rateinfo_recalc(dh, now, hinfo->cfg.mode);
    }

    if (info->cfg.mode & XT_HASHLIMIT_BYTES)
        #计算当前数据包需要消耗的令牌数
        cost = hashlimit_byte_cost(skb->len, dh);
    else
        cost = dh->rateinfo.cost;
    #如果当前桶中令牌数不少于该包消耗的令牌数则则返回 1，表示匹配成功，执行规则的目标动作
    if (dh->rateinfo.credit >= cost) {
        /* below the limit */
        dh->rateinfo.credit -= cost;
        spin_unlock(&dh->lock);
        rcu_read_unlock_bh();
        return !(info->cfg.mode & XT_HASHLIMIT_INVERT);
    }
    #如果当前桶中令牌数少于该包消耗的令牌数则返回 0，表示匹配不成功，继续匹配下条规则
    spin_unlock(&dh->lock);
    rcu_read_unlock_bh();
    /* default match is underlimit - so over the limit, we need to invert */
    return info->cfg.mode & XT_HASHLIMIT_INVERT;

 hotdrop:
    par->hotdrop = true;
    return false;
}
```

#### **2.2.3 令牌计算函数** ####

- 令牌更新函数

  ```c
  static void rateinfo_recalc(struct dsthash_ent *dh, unsigned long now, u32 mode)
  {
    unsigned long delta = now - dh->rateinfo.prev;
    u32 cap;
  
    if (delta == 0)
        return;
  
    dh->rateinfo.prev = now;
  
    if (mode & XT_HASHLIMIT_BYTES) {
        u32 tmp = dh->rateinfo.credit;
        #更新当前令牌数为剩余的令牌数加上这段时间产生的令牌数
        dh->rateinfo.credit += CREDITS_PER_JIFFY_BYTES * delta;
        cap = CREDITS_PER_JIFFY_BYTES * HZ;
        if (tmp >= dh->rateinfo.credit) {/* overflow */
            dh->rateinfo.credit = cap;
            return;
        }
    } else {
        #更新当前令牌数为剩余的令牌数加上这段时间产生的令牌数
        dh->rateinfo.credit += delta * CREDITS_PER_JIFFY;
        cap = dh->rateinfo.credit_cap;
    }
    #桶中最大令牌数限制为 CREDITS_PER_JIFFY_BYTES * HZ 或者 32000 * burst / rate
    if (dh->rateinfo.credit > cap)
        dh->rateinfo.credit = cap;
  }
  ```
- 令牌初始化函数

  ```c
  static void rateinfo_init(struct dsthash_ent *dh,
              struct xt_hashlimit_htable *hinfo)
  {
    dh->rateinfo.prev = jiffies;
    if (hinfo->cfg.mode & XT_HASHLIMIT_BYTES) {
        #初始化当前令牌数为桶中最大令牌数，CREDITS_PER_JIFFY_BYTES * HZ，即0x1000000 * 250
        dh->rateinfo.credit = CREDITS_PER_JIFFY_BYTES * HZ;
        #初始化16个字节的令牌消耗单位为 0x1000000 * 250 / (rate >> 4 + 1)，消耗单位和设置的限速值成反比
        dh->rateinfo.cost = user2credits_byte(hinfo->cfg.avg);
        #初始化允许突发次数为 burst(设置的 burst 值除设置的限速值的结果)
        dh->rateinfo.credit_cap = hinfo->cfg.burst;
    } else {
        #以包为单位限速模式，转化后为 (SCALE / SCALE_kernel) * (HZ * 128 * burst  / rate)，默认为32000 * burst / rate
        dh->rateinfo.credit = user2credits(hinfo->cfg.avg *
                           hinfo->cfg.burst);
        #初始化令牌消耗单位为 32000 /rate
        dh->rateinfo.cost = user2credits(hinfo->cfg.avg);
        #初始化最大令牌数为 32000 * burst / rate
        dh->rateinfo.credit_cap = dh->rateinfo.credit;
    }
  }
  ```
- 令牌消耗函数

  ```c
  static u32 hashlimit_byte_cost(unsigned int len, struct dsthash_ent *dh)
  {
    #以包为单位来判定去留，计算当前包的16字节长度为 tmp = len >> 4 + 1
    u64 tmp = xt_hashlimit_len_to_chunks(len);
    #计算该包需要消耗的令牌数约为 ( len >> 4 + 1 ) / (rate >> 4 + 1) * 0x1000000 * 250
    tmp = tmp * dh->rateinfo.cost;
    #如果该包消耗的令牌数大于桶中最大数
    if (unlikely(tmp > CREDITS_PER_JIFFY_BYTES * HZ))
        #该种处理方法会导致设置低限速值限制不了大包数据的问题，因为 1s 会允许放行一次大包
        tmp = CREDITS_PER_JIFFY_BYTES * HZ; 
    #如果该包消耗的令牌数大于桶中当前令牌数，且当前允许突发次数大于 0，则当作突发数据包处理，突发次数减 1
    if (dh->rateinfo.credit < tmp && dh->rateinfo.credit_cap) {
        #以包为单位限速模式，
        dh->rateinfo.credit_cap--;
        dh->rateinfo.credit = CREDITS_PER_JIFFY_BYTES * HZ;
    }
    return (u32) tmp;
  }
  ```

  
#### **2.2.4 校验check函数** ####

```c
static int hashlimit_mt_check(const struct xt_mtchk_param *par)
{
    struct net *net = par->net;
    struct xt_hashlimit_mtinfo1 *info = par->matchinfo;
    int ret;
    ......

    
    if (info->cfg.mode & XT_HASHLIMIT_BYTES) {
        #设置的限速值 rate 令牌消耗单位为 0x1000000 * 250 / (rate >> 4 + 1) < 1 时则溢出，该 rate > 0x1000000 * 250 *16 
        if (user2credits_byte(info->cfg.avg) == 0) {
            pr_info("overflow, rate too high: %u\n", info->cfg.avg);
            return -EINVAL;
        }
    } else if (info->cfg.burst == 0 || user2credits(info->cfg.avg * info->cfg.burst) < user2credits(info->cfg.avg)) {
        #设置的 burst 值要大于 1
        pr_info("overflow, try lower: %u/%u\n", info->cfg.avg, info->cfg.burst);
        return -ERANGE;
    }
    ......  #proc文件相关

    mutex_unlock(&hashlimit_mutex);
    return 0;
}
```

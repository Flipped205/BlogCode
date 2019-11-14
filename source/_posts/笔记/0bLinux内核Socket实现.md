---
title: Linux内核Socket实现
categories:
- Linux
tags:
- socket
other: note_0b
date: 2018-05-30
updated: 2018-05-30
---

内核版本2.6.36
``` c
/*
 *  System call vectors.
 *
 *  Argument checking cleaned up. Saved 20% in size.
 *  This function doesn't need to set the kernel lock because
 *  it is set by the callees.
 */

SYSCALL_DEFINE2(socketcall, int, call, unsigned long __user *, args)
{
    unsigned long a[6];
    unsigned long a0, a1;
    int err;
    unsigned int len;

    if (call < 1 || call > SYS_RECVMMSG)
        return -EINVAL;

    len = nargs[call];
    if (len > sizeof(a))
        return -EINVAL;

    /* copy_from_user should be SMP safe. */
    if (copy_from_user(a, args, len))
        return -EFAULT;

    audit_socketcall(nargs[call] / sizeof(unsigned long), a);

    a0 = a[0];
    a1 = a[1];

    switch (call) {
    case SYS_SOCKET:
        err = sys_socket(a0, a1, a[2]);
        break;
    case SYS_BIND:
        err = sys_bind(a0, (struct sockaddr __user *)a1, a[2]);
        break;
    case SYS_CONNECT:
        err = sys_connect(a0, (struct sockaddr __user *)a1, a[2]);
        break;
    case SYS_LISTEN:
        err = sys_listen(a0, a1);
        break;
    case SYS_ACCEPT:
        err = sys_accept4(a0, (struct sockaddr __user *)a1,
                  (int __user *)a[2], 0);
        break;
    case SYS_GETSOCKNAME:
        err =
            sys_getsockname(a0, (struct sockaddr __user *)a1,
                    (int __user *)a[2]);
        break;
    case SYS_GETPEERNAME:
        err =
            sys_getpeername(a0, (struct sockaddr __user *)a1,
                    (int __user *)a[2]);
        break;
    case SYS_SOCKETPAIR:
        err = sys_socketpair(a0, a1, a[2], (int __user *)a[3]);
        break;
    case SYS_SEND:
        err = sys_send(a0, (void __user *)a1, a[2], a[3]);
        break;
    case SYS_SENDTO:
        err = sys_sendto(a0, (void __user *)a1, a[2], a[3],
                 (struct sockaddr __user *)a[4], a[5]);
        break;
    case SYS_RECV:
        err = sys_recv(a0, (void __user *)a1, a[2], a[3]);
        break;
    case SYS_RECVFROM:
        err = sys_recvfrom(a0, (void __user *)a1, a[2], a[3],
                   (struct sockaddr __user *)a[4],
                   (int __user *)a[5]);
        break;
    case SYS_SHUTDOWN:
        err = sys_shutdown(a0, a1);
        break;
    case SYS_SETSOCKOPT:
        err = sys_setsockopt(a0, a1, a[2], (char __user *)a[3], a[4]);
        break;
    case SYS_GETSOCKOPT:
        err =
            sys_getsockopt(a0, a1, a[2], (char __user *)a[3],
                   (int __user *)a[4]);
        break;
    case SYS_SENDMSG:
        err = sys_sendmsg(a0, (struct msghdr __user *)a1, a[2]);
        break;
    case SYS_RECVMSG:
        err = sys_recvmsg(a0, (struct msghdr __user *)a1, a[2]);
        break;
    case SYS_RECVMMSG:
        err = sys_recvmmsg(a0, (struct mmsghdr __user *)a1, a[2], a[3],
                   (struct timespec __user *)a[4]);
        break;
    case SYS_ACCEPT4:
        err = sys_accept4(a0, (struct sockaddr __user *)a1,
                  (int __user *)a[2], a[3]);
        break;
    default:
        err = -EINVAL;
        break;
    }
    return err;
}

#endif              /* __ARCH_WANT_SYS_SOCKETCALL */
```
<div class="menu"></div>

## **一、创建Socket** ##
　　Socket内核调用数SYSCALL_DEFINE3：
　　Socket的创建是在用户空间调用socket系统函数完成的，创建一个Socket返回一个文件描述符fd，内核的系统调用接口为SYSCALL_DEFINE3(socket, int, family, int, type, int, protocol)，在net/socket.c文件中，下面我们看一下内核中的源码实现。
### **1、SYSCALL_DEFINE3(socket,...)** ###
SYSCALL_DEFINE3(`socket`, int, family, int, type, int, protocol)  // net/socket.c	line:1272
```c
SYSCALL_DEFINE3(`socket`, int, family, int, type, int, protocol)
{
	int retval;
	struct socket *sock;
	int flags;

	/* Check the SOCK_* constants for consistency.  */
	//进行各种检查操作
	BUILD_BUG_ON(SOCK_CLOEXEC != O_CLOEXEC);
	BUILD_BUG_ON((SOCK_MAX | SOCK_TYPE_MASK) != SOCK_TYPE_MASK);
	BUILD_BUG_ON(SOCK_CLOEXEC & SOCK_TYPE_MASK);
	BUILD_BUG_ON(SOCK_NONBLOCK & SOCK_TYPE_MASK);

	flags = type & ~SOCK_TYPE_MASK;
	if (flags & ~(SOCK_CLOEXEC | SOCK_NONBLOCK))
		return -EINVAL;
	type &= SOCK_TYPE_MASK;

	if (SOCK_NONBLOCK != O_NONBLOCK && (flags & SOCK_NONBLOCK))
		flags = (flags & ~SOCK_NONBLOCK) | O_NONBLOCK;

	//调用创建socket的函数
	retval = `sock_create`(family, type, protocol, &sock);    // 详见----第一章第2节
	if (retval < 0)
		goto out;

	retval = `sock_map_fd`(sock, flags & (O_CLOEXEC | O_NONBLOCK));  //详见----第一章第6节
	if (retval < 0)
		goto out_release;

out:
	/* It may be already another descriptor 8) Not kernel problem. */
	return retval;

out_release:
	sock_release(sock);
	return retval;
}
```
### **2、sock_create函数** ###
`sock_create`  // net/socket.c  line:1260
```c
int sock_create(int family, int type, int protocol, struct socket **res)
{
	return `__sock_create`(current->nsproxy->net_ns, family, type, protocol, res, 0);
}
```
真正实现函数__sock_create();

`__sock_create`函数实现  // net/socket.c  line 1147
```c
static int __sock_create(struct net *net, int family, int type, int protocol, struct socket **res, int kern)
{
	int err;
	struct socket *sock;
	const struct net_proto_family *pf;

	/*
	 *		Check protocol is in range
	 *		`检查协议的范围，现在内核定义的最大范围为38，这里的family指的是`
	 *		`AF_INET6，AF_INET协议簇`
	 *		`#define NPROTO      AF_MAX  //include/linux/net.h`
	 *		`#define AF_MAX      38  // For now.. `
	 *
	 */
	if (family < 0 || family >= NPROTO)
		return -EAFNOSUPPORT;
	if (type < 0 || type >= SOCK_MAX)  //`type： socket的类型 eg:SOCK_STREAM`
		return -EINVAL;

	/* Compatibility.

	   This uglymoron is moved from INET layer to here to avoid
	   deadlock in module load.
	 */
	if (family == PF_INET && type == SOCK_PACKET) { // 如果soeket type 为SOCK_PACKET，需要重新给family赋值
		static int warned; //默认初始化为0
		if (!warned) {
			warned = 1;
			printk(KERN_INFO "%s uses obsolete (PF_INET,SOCK_PACKET)\n",
			       current->comm);
		}
		family = PF_PACKET; //赋值为PF_PACKET
	}

	err = security_socket_create(family, type, protocol, kern);
	if (err)
		return err;

	/*
	 *	Allocate the socket and allow the family to set things up. if
	 *	the protocol is 0, the family is instructed to select an appropriate
	 *	default.
	 *	`调用sock_alloc分配sock`
	 */
	sock = `sock_alloc`();
	if (!sock) {
		if (net_ratelimit())
			printk(KERN_WARNING "socket: no more sockets\n");
		return -ENFILE;	/* Not exactly a match, but its the
				   closest posix thing */
	}

	sock->type = type;

#ifdef CONFIG_MODULES
	/* Attempt to load a protocol module if the find failed.
	 *
	 * 12/09/1996 Marcin: But! this makes REALLY only sense, if the user
	 * requested real, full-featured networking support upon configuration.
	 * Otherwise module support will break!
	 */
	if (net_families[family] == NULL)
		request_module("net-pf-%d", family);
#endif

	rcu_read_lock();
	pf = rcu_dereference(net_families[family]);
	err = -EAFNOSUPPORT;
	if (!pf)
		goto out_release;

	/*
	 * We will call the ->create function, that possibly is in a loadable
	 * module, so we have to bump that loadable module refcnt first.
	 */
	if (!try_module_get(pf->owner))
		goto out_release;

	/* Now protected by module ref count */
	rcu_read_unlock();


	/*
	 * static const struct net_proto_family inet_family_ops = {
	 *	.family = PF_INET,
	 *	.create = inet_create,
	 *	.owner	= THIS_MODULE,
	 *	}; //net/ipv4/af_inet.c
	 *	`根据注册的family类型，调用不同的create函数，这里就是调用inet_ctreate。`
	 */
	err = pf->`create`(net, sock, protocol, kern);
	if (err < 0)
		goto out_module_put;

	/*
	 * Now to bump the refcnt of the [loadable] module that owns this
	 * socket at sock_release time we decrement its refcnt.
	 */
	if (!try_module_get(sock->ops->owner))
		goto out_module_busy;

	/*
	 * Now that we're done with the ->create function, the [loadable]
	 * module can have its refcnt decremented
	 */
	module_put(pf->owner);
	err = security_socket_post_create(sock, family, type, protocol, kern);
	if (err)
		goto out_sock_release;
	`*res = sock`;

	return 0;

out_module_busy:
	err = -EAFNOSUPPORT;
out_module_put:
	sock->ops = NULL;
	module_put(pf->owner);
out_sock_release:
	sock_release(sock);
	return err;

out_release:
	rcu_read_unlock();
	goto out_sock_release;
}
```
### **3、sock_alloc函数** ###
　　sock_alloc函数用于分配一个socket结构体，这这里涉及了inode结构以及在分配完成后返回的地址指针。
`sock_alloc`  // net/socket.c   line:471
```c
/**
 *	sock_alloc	-	allocate a socket
 *
 *	Allocate a new inode and socket object. The two are bound together
 *	and initialised. The socket is then returned. If we are out of inodes
 *	NULL is returned.
 */

static struct socket *sock_alloc(void)
{
	struct inode *inode;
	struct socket *sock;


	/*	下面的new_inode_pseudo函数是分配一个新的inode结构体，但在实际分配过程中，分配了一个socket_alloc结构体，返回d的是inode地址，
	 *	struct socket_alloc {
     *		struct socket socket;
     *		struct inode vfs_inode;
	 *	}; //include/net/sock.h
	 */
	inode = `new_inode(sock_mnt->mnt_sb)`; // new_inode 详见 fs/inode.c中实现,sock_mnt什么时候初始化
	if (!inode)
		return NULL;

	/* 	SOCKET_I
	 * 	static inline struct socket *SOCKET_I(struct inode *inode)
 	 *	{
 	 *  	return &container_of(inode, struct socket_alloc, vfs_inode)->socket;
	 *	}//include/net/sock.h
	 *
	 *	#define container_of(ptr, type, member) ({		\
  	 *		const typeof( ((type *)0)->member ) *__mptr = (ptr);	\
  	 *		(type *)( (char *)__mptr - offsetof(type,member) );})
  	 *	#endif  //drivers/staging/rtl8192e/ieee80211.h
	 */
	sock = SOCKET_I(inode); // 该宏根据返回的inode获取到分配的socket_alloc指针

	kmemcheck_annotate_bitfield(sock, type);
	/* inode变量进行初始化操作 */
	inode->i_mode = S_IFSOCK | S_IRWXUGO;
	inode->i_uid = current_fsuid(); // 用户ID，在后面调用bind系统调用时会进行对比
	inode->i_gid = current_fsgid(); // 组ID

	percpu_add(sockets_in_use, 1);
	return sock;
}
```
#### **3.1、sock_mnt->mnt_sb的赋值分配过程** ####
　　在sock_init函数中对socket类型的文件系统进行注册
`sock_mnt`   // net/sock.c  line:316
```c
static struct vfsmount *`sock_mnt` __read_mostly;
```
　　sock_mnt数据类型为结构体  vfsmount;
`vfsmount`结构体 include/linux/mount.h 	line:49
```c
struct vfsmount {
	struct list_head mnt_hash;
	struct vfsmount *mnt_parent;	/* fs we are mounted on */
	struct dentry *mnt_mountpoint;	/* dentry of mountpoint */
	struct dentry *mnt_root;	/* root of the mounted tree */
	struct super_block *`mnt_sb`;	/* pointer to superblock */
	struct list_head mnt_mounts;	/* list of children, anchored here */
	struct list_head mnt_child;	/* and going through their mnt_child */
	int mnt_flags;
	/* 4 bytes hole on 64bits arches without fsnotify */
#ifdef CONFIG_FSNOTIFY
	__u32 mnt_fsnotify_mask;
	struct hlist_head mnt_fsnotify_marks;
#endif
	const char *mnt_devname;	/* Name of device e.g. /dev/dsk/hda1 */
	struct list_head mnt_list;
	struct list_head mnt_expire;	/* link in fs-specific expiry list */
	struct list_head mnt_share;	/* circular list of shared mounts */
	struct list_head mnt_slave_list;/* list of slave mounts */
	struct list_head mnt_slave;	/* slave list entry */
	struct vfsmount *mnt_master;	/* slave is on master->mnt_slave_list */
	struct mnt_namespace *mnt_ns;	/* containing namespace */
	int mnt_id;			/* mount identifier */
	int mnt_group_id;		/* peer group identifier */
	/*
	 * We put mnt_count & mnt_expiry_mark at the end of struct vfsmount
	 * to let these frequently modified fields in a separate cache line
	 * (so that reads of mnt_flags wont ping-pong on SMP machines)
	 */
	atomic_t mnt_count;
	int mnt_expiry_mark;		/* true if marked for expiry */
	int mnt_pinned;
	int mnt_ghosts;
#ifdef CONFIG_SMP
	int __percpu *mnt_writers;
#else
	int mnt_writers;
#endif
};
```

```c
static struct file_system_type sock_fs_type = {
	.name =		"sockfs",
	.get_sb =	sockfs_get_sb,
	.kill_sb =	kill_anon_super,
};
```
`sock_init`函数  //  net/socket.c   line:2392
```c
static int __init sock_init(void)
{
	/*
	 *      Initialize sock SLAB cache.
	 */

	sk_init();

	/*
	 *      Initialize skbuff SLAB cache
	 */
	skb_init();

	/*
	 *      Initialize the protocols module.
	 */

	init_inodecache();

	register_filesystem(&sock_fs_type); // 文件系统的注册
	sock_mnt = `kern_mount`(&sock_fs_type); // 挂载文件系统

	/* The real protocol initialization is performed in later initcalls.
	 */

#ifdef CONFIG_NETFILTER
	netfilter_init();
#endif

#ifdef CONFIG_NETWORK_PHY_TIMESTAMPING
	skb_timestamping_init();
#endif

	return 0;
}
```
#### **3.2、new_inode函数** ####
　　new_inode函数创建inode,并初始化inode的i_state变量和`inode->isn_list`链表，实际的分配函数为alloc_inode函数。fs/inode.c
```c
/**
 *	new_inode 	- obtain an inode
 *	@sb: superblock
 *
 *	Allocates a new inode for given superblock. The default gfp_mask
 *	for allocations related to inode->i_mapping is GFP_HIGHUSER_MOVABLE.
 *	If HIGHMEM pages are unsuitable or it is known that pages allocated
 *	for the page cache are not reclaimable or migratable,
 *	mapping_set_gfp_mask() must be called with suitable flags on the
 *	newly created inode's mapping
 *
 */
struct inode *new_inode(struct super_block *sb)
{
	/*
	 * On a 32bit, non LFS stat() call, glibc will generate an EOVERFLOW
	 * error if st_ino won't fit in target struct field. Use 32bit counter
	 * here to attempt to avoid that.
	 */
	static unsigned int last_ino;
	struct inode *inode;

	spin_lock_prefetch(&inode_lock);

	inode = `alloc_inode`(sb);
	if (inode) {
		spin_lock(&inode_lock);
		`__inode_add_to_lists`(sb, NULL, inode);
		inode->i_ino = ++last_ino;
		`inode->i_state` = 0;
		spin_unlock(&inode_lock);
	}
	return inode;
}
```
##### *3.2.1、alloc_inode函数* #####
`alloc_inode`函数  // fs/inode.c		line:193
```c
static struct inode *alloc_inode(struct super_block *sb)
{
	struct inode *inode;

	/*
	 * 如果当前文件系统的超级块，有自己的分配inode的函数，则调用它自己的分配函数，否则从公用的高速缓存中分配一个inode。对于sockt来说，在socket.c中，调用的函数为sock_alloc_inode
	 * 	static const struct super_operations `sockfs_ops` = {
	 *		.alloc_inode	= `sock_alloc_inode`,
	 *		.destroy_inode	= sock_destroy_inode,
	 *		.statfs		= simple_statfs,
	 *	};
	 *
	 */
	if (sb->s_op->alloc_inode)
		inode = `sb->s_op->alloc_inode`(sb);
	else
		inode = kmem_cache_alloc(inode_cachep, GFP_KERNEL);

	if (!inode)
		return NULL;
    /*
     *  初始化 inode结构体
     */
	if (unlikely(inode_init_always(sb, inode))) {
		if (inode->i_sb->s_op->destroy_inode)
			inode->i_sb->s_op->destroy_inode(inode);
		else
			kmem_cache_free(inode_cachep, inode);
		return NULL;
	}

	return inode;
}
```
###### **3.2.1.1、sock_alloc_inode函数** ######
`sock_alloc_inode`函数 	// net/socket.c		line:240
```c
static struct inode *sock_alloc_inode(struct super_block *sb)
{
	struct socket_alloc *ei;

	/*
     * kmem_cache_alloc分配stuct socket_alloc结构体，如何分配？
	 */
	ei = `kmem_cache_alloc`(sock_inode_cachep, GFP_KERNEL);
	if (!ei)
		return NULL;
	ei->socket.wq = kmalloc(sizeof(struct socket_wq), GFP_KERNEL);
	if (!ei->socket.wq) {
		kmem_cache_free(sock_inode_cachep, ei);
		return NULL;
	}
	init_waitqueue_head(&ei->socket.wq->wait);
	ei->socket.wq->fasync_list = NULL;

	ei->socket.state = SS_UNCONNECTED;
	ei->socket.flags = 0;
	ei->socket.ops = NULL;
	ei->socket.sk = NULL;
	ei->socket.file = NULL;

	return &ei->vfs_inode; //返回sturct inode `vfs_inode`;
}
```
　　备注：在分配函数sock_alloc_inode中调用了
　　ei = `kmem_cache_alloc`(sock_inode_cachep,GFP_KERNEL);这里分配的大小为socket_alloc大小，下面分宜如何分配该大小?  `kmem_cache_create`
　　`init_inodecache`函数中（net/socket.c），对其进行高速缓存的分配操作，定义在socket.c文件中，这里分配的大小为socket_alloc，但是返回时socket_alloc结构体中的struct indoe vfs_inode;变量。该函数在sock_init中被调用。

`init_inodecache`函数：
```c
static int init_inodecache(void)
{
	sock_inode_cachep = `kmem_cache_create`("sock_inode_cache",
					      sizeof(struct socket_alloc),
					      0,
					      (SLAB_HWCACHE_ALIGN |
					       SLAB_RECLAIM_ACCOUNT |
					       SLAB_MEM_SPREAD),
					      init_once);
	if (sock_inode_cachep == NULL)
		return -ENOMEM;
	return 0;
}
```

##### **3.2.2、__inode_add_to_lists函数** #####
`__inode_add_to_lists`函数   // fs/inode.c
```c
static inline void
__inode_add_to_lists(struct super_block *sb, struct hlist_head *head,
			struct inode *inode)
{
	inodes_stat.nr_inodes++;
	list_add(&inode->i_list, &inode_in_use);
	list_add(&inode->i_sb_list, &sb->s_inodes);
	if (head)
		hlist_add_head(&inode->i_hash, head);
}
```
### **4、inet_create函数** ###
　　在socket_create函数中调用pf->create,这里的指针为inet_create。在文件net/ipv4/af_inet中。
`socket_create`  // net/ipv4/af_inet.c		line:268
```c
/*
 *	Create an inet socket.
 */

static int inet_create(struct net *net, struct socket *sock, int protocol,
		       int kern)
{
	struct sock *sk;
	struct inet_protosw *answer;
	struct inet_sock *inet;
	struct proto *answer_prot;
	unsigned char answer_flags;
	char answer_no_check;
	int try_loading_module = 0;
	int err;

	if (unlikely(!inet_ehash_secret))
		if (sock->type != SOCK_RAW && sock->type != SOCK_DGRAM)
			build_ehash_secret();

	sock->state = SS_UNCONNECTED;

	/* Look for the requested type/protocol pair. */
lookup_protocol:
	err = -ESOCKTNOSUPPORT;
	rcu_read_lock();
	/*
	 * 从inetsw中根据类型，协议查找相应的socket interface即 inet_protosw *answer;
	 *      
	 * 		//  include/linux/rculist.h
	 *		#define list_for_each_entry_rcu(pos, head, member) \
	 *  		for (pos = list_entry_rcu((head)->next, typeof(*pos), member); \
	 *       		prefetch(pos->member.next), &pos->member != (head); \
	 *      		pos = list_entry_rcu(pos->member.next, typeof(*pos), member))
	 */
	list_for_each_entry_rcu(answer, &inetsw[sock->type], list) {

		err = 0;
		/* Check the non-wild match. */
		if (protocol == answer->protocol) {
			if (protocol != IPPROTO_IP)
				break;
		} else {
			/* Check for the two wild cases. */
			if (IPPROTO_IP == protocol) {
				protocol = answer->protocol;
				break;
			}
			if (IPPROTO_IP == answer->protocol)
				break;
		}
		err = -EPROTONOSUPPORT;
	}
	/*
	 * 如果没找到，尝试加载模块 
	 */
	if (unlikely(err)) {
		if (try_loading_module < 2) {
			rcu_read_unlock();
			/*
			 * Be more specific, e.g. net-pf-2-proto-132-type-1
			 * (net-pf-PF_INET-proto-IPPROTO_SCTP-type-SOCK_STREAM)
			 */
			if (++try_loading_module == 1)
				request_module("net-pf-%d-proto-%d-type-%d",
					       PF_INET, protocol, sock->type);
			/*
			 * Fall back to generic, e.g. net-pf-2-proto-132
			 * (net-pf-PF_INET-proto-IPPROTO_SCTP)
			 */
			else
				request_module("net-pf-%d-proto-%d",
					       PF_INET, protocol);
			goto lookup_protocol;
		} else
			goto out_rcu_unlock;
	}

	err = -EPERM;
	if (sock->type == SOCK_RAW && !kern && !capable(CAP_NET_RAW))
		goto out_rcu_unlock;

	err = -EAFNOSUPPORT;
	if (!inet_netns_ok(net, protocol))
		goto out_rcu_unlock;

	sock->ops = answer->ops;
	answer_prot = answer->prot;
	answer_no_check = answer->no_check;
	answer_flags = answer->flags;
	rcu_read_unlock();

	WARN_ON(answer_prot->slab == NULL);

	err = -ENOBUFS;
	/*
	 * sk_alloc表面上看是生成sock的结构体，但是实际上对于tcp来说是tcp_sock的大小的结构体，这样就可以使用inet_sk(sk);进行强制的类型转换，具体如何分配tcp_sock大小？
	 */
	sk = `sk_alloc`(net, PF_INET, GFP_KERNEL, answer_prot);
	if (sk == NULL)
		goto out;

	err = 0;
	sk->sk_no_check = answer_no_check;
	if (INET_PROTOSW_REUSE & answer_flags)
		sk->sk_reuse = 1;

	inet = inet_sk(sk);
	inet->is_icsk = (INET_PROTOSW_ICSK & answer_flags) != 0;

	inet->nodefrag = 0;

	if (SOCK_RAW == sock->type) {
		inet->inet_num = protocol;
		if (IPPROTO_RAW == protocol)
			inet->hdrincl = 1;
	}

	if (ipv4_config.no_pmtu_disc)
		inet->pmtudisc = IP_PMTUDISC_DONT;
	else
		inet->pmtudisc = IP_PMTUDISC_WANT;

	inet->inet_id = 0;
  
  	/*
  	 * sk结构体变量进行初始化。
  	 */
	`sock_init_data`(sock, sk);

	sk->sk_destruct	   = inet_sock_destruct;
	sk->sk_protocol	   = protocol;
	sk->sk_backlog_rcv = sk->sk_prot->backlog_rcv;

	inet->uc_ttl	= -1;
	inet->mc_loop	= 1;
	inet->mc_ttl	= 1;
	inet->mc_all	= 1;
	inet->mc_index	= 0;
	inet->mc_list	= NULL;

	sk_refcnt_debug_inc(sk);

	if (inet->inet_num) {
		/* It assumes that any protocol which allows
		 * the user to assign a number at socket
		 * creation time automatically
		 * shares.
		 */
		inet->inet_sport = htons(inet->inet_num);
		/* Add to protocol hash chains. */
		sk->sk_prot->hash(sk);
	}

	if (sk->sk_prot->init) {
		err = `sk->sk_prot->init(sk)`; //如果tcp  这里为tcp_v4_init_sock
		if (err)
			sk_common_release(sk);
	}
out:
	return err;
out_rcu_unlock:
	rcu_read_unlock();
	goto out;
}
```
#### **4.1、sk_alloc函数** ####
`sk_alloc`函数  // net/core/sock.c		line:1096
```c
/**
 *	sk_alloc - All socket objects are allocated here
 *	@net: the applicable net namespace
 *	@family: protocol family
 *	@priority: for allocation (%GFP_KERNEL, %GFP_ATOMIC, etc)
 *	@prot: struct proto associated with this new sock instance
 */
struct sock *sk_alloc(struct net *net, int family, gfp_t priority,
		      struct proto *prot)
{
	struct sock *sk;

	sk = `sk_prot_alloc`(prot, priority | __GFP_ZERO, family);
	if (sk) {
		sk->sk_family = family;
		/*
		 * See comment in struct sock definition to understand
		 * why we need sk_prot_creator -acme
		 */
		sk->sk_prot = sk->sk_prot_creator = prot;
		sock_lock_init(sk);
		sock_net_set(sk, get_net(net));
		atomic_set(&sk->sk_wmem_alloc, 1);

		sock_update_classid(sk);
	}

	return sk;
}
```
##### **4.1.1、sk_prot_alloc函数** #####
`sk_prot_alloc`函数		//net/core/sock.c	line:1012
```c
static struct sock *sk_prot_alloc(struct `proto *prot`, gfp_t priority,
		int family)
{
	struct sock *sk;
	struct kmem_cache *slab;

     /*
      * 下面分配内存空间时，分两种情况：`1`、从高速缓冲中分配，`2`、普通的分配
      */
	`slab = prot->slab`;
	if (slab != NULL) {
		sk = `kmem_cache_alloc`(slab, priority & ~__GFP_ZERO);  // 第一种分配方式
		if (!sk)
			return sk;
		if (priority & __GFP_ZERO) {
			/*
			 * caches using SLAB_DESTROY_BY_RCU should let
			 * sk_node.next un-modified. Special care is taken
			 * when initializing object to zero.
			 */
			if (offsetof(struct sock, sk_node.next) != 0)
				memset(sk, 0, offsetof(struct sock, sk_node.next));
			memset(&sk->sk_node.pprev, 0,
			       prot->obj_size - offsetof(struct sock,
							 sk_node.pprev));
		}
	}
	else
		sk = `kmalloc`(prot->obj_size, priority);  //第二种分配方式

	if (sk != NULL) {
		kmemcheck_annotate_bitfield(sk, flags);

		if (security_sk_alloc(sk, family, priority))
			goto out_free;

		if (!try_module_get(prot->owner))
			goto out_free_sec;
		sk_tx_queue_clear(sk);
	}

	return sk;

out_free_sec:
	security_sk_free(sk);
out_free:
	if (slab != NULL)
		kmem_cache_free(slab, sk);
	else
		kfree(sk);
	return NULL;
}
```
　　sk_prot_alloc函数中包括内存空间的分配过程，存在两种分配方式，而第一种分配方式涉及到slab是否为空，slab=prot->slab;而prot为sk_prot_alloc的传入参数，其结构体为struct proto *prot;  sk_prot_alloc参数prot由sk_alloc传入，sk_alloc参数prot 为inet_create 函数出入的answer_prot；answer_prot = answer->prot，即sk_prot_alloc中的prot为inet_create中的answer结构体重的prot成员变量。answer为inet_create函数中变量，其结构体为struct inet_protosw *answer;关于answer初始化赋值list_for_each_entry_rcu；[`详看第5小结`](#wow_1_5)。
　　第二种内存分配机制：主要是prot->obj_size;就是struct proto tcp_prot中初始化的.obj_size = sizeof(struct tcp_sock); 。 sk = kmalloc(prot->obj_size,priority);
　　下图为5个相关的数据结构，tcp_sock结构体占用的空间是最大的，所有在分配内存控件是，都是分配的tcp_sock的大小，这样在后面进行强制转换的过程中可以保证正确：
<div align="center">
![](/img/note_0b/01.png)
</div>

#### **4.2、sock_init_data函数** ####
`sock_init_data`函数    // net/core/sock.c   line:1937
```c
void sock_init_data(struct socket *sock, struct sock *sk)
{
	skb_queue_head_init(&sk->sk_receive_queue);
	skb_queue_head_init(&sk->sk_write_queue);
	skb_queue_head_init(&sk->sk_error_queue);
#ifdef CONFIG_NET_DMA
	skb_queue_head_init(&sk->sk_async_wait_queue);
#endif

	sk->sk_send_head	=	NULL;
   
	init_timer(&sk->sk_timer); // 初始化sk定时器

	sk->sk_allocation	=	GFP_KERNEL;
	sk->sk_rcvbuf		=	sysctl_rmem_default;
	sk->sk_sndbuf		=	sysctl_wmem_default;
	sk->sk_state		=	TCP_CLOSE; // 初始化sk_state = TCP_CLOSE状态，为后面在系统调用中会进行判断
	sk_set_socket(sk, sock);  // sk->sk_socket = sock; 设置sk中指向socket的指针

	sock_set_flag(sk, SOCK_ZAPPED); // 设置 SOCKET的flag位，表明该socket已经绑定一个名字，该标志什么意思？

	if (sock) {
		sk->sk_type	=	sock->type;
		sk->sk_wq	=	sock->wq;
		sock->sk	=	sk; 
	} else
		sk->sk_wq	=	NULL;

	spin_lock_init(&sk->sk_dst_lock);
	rwlock_init(&sk->sk_callback_lock);
	lockdep_set_class_and_name(&sk->sk_callback_lock,
			af_callback_keys + sk->sk_family,
			af_family_clock_key_strings[sk->sk_family]);

	sk->sk_state_change	=	sock_def_wakeup;
	sk->sk_data_ready	=	sock_def_readable;
	sk->sk_write_space	=	sock_def_write_space;
	sk->sk_error_report	=	sock_def_error_report;
	sk->sk_destruct		=	sock_def_destruct;

	sk->sk_sndmsg_page	=	NULL;
	sk->sk_sndmsg_off	=	0;

	sk->sk_peer_pid 	=	NULL;
	sk->sk_peer_cred	=	NULL;
	sk->sk_write_pending	=	0;
	sk->sk_rcvlowat		=	1;
	sk->sk_rcvtimeo		=	MAX_SCHEDULE_TIMEOUT;
	sk->sk_sndtimeo		=	MAX_SCHEDULE_TIMEOUT;

	sk->sk_stamp = ktime_set(-1L, 0);

	/*
	 * Before updating sk_refcnt, we must commit prior changes to memory
	 * (Documentation/RCU/rculist_nulls.txt for details)
	 */
	smp_wmb();
	atomic_set(&sk->sk_refcnt, 1); // sk的引用计数+1
	atomic_set(&sk->sk_drops, 0);
}
```
　　备注：思考 sock 与socket
　　参考资料：
　　　　[struct sk_buff与struct socket及struct sock 结构体分析][1]
　　　　[sock结构体][2]
　　　　[struct socket 结构详解][3]
　　　　[struct socket结构体详解][4]
　　　　[struct sk_buff结构体详解][5]


#### **4.3、tcp_v4_init_sock函数** #####
`tcp_v4_init_sock`函数	// net/ipv4/tcp_ipv4.c	line:1857
```c
/* NOTE: A lot of things set to zero explicitly by call to
 *       sk_alloc() so need not be done here.
 */
static int tcp_v4_init_sock(struct sock *sk)
{
	struct inet_connection_sock *icsk = inet_csk(sk);  // 强制类型转换  return (struct inet_connection_sock *)sk;
	struct tcp_sock *tp = tcp_sk(sk); // `强制类型转换  return (struct tcp_sock *)sk`;

	/*
	 *  tcp 相关变量初始化工作
	 */
	skb_queue_head_init(&tp->out_of_order_queue);
	tcp_init_xmit_timers(sk);
	tcp_prequeue_init(tp);

	icsk->icsk_rto = TCP_TIMEOUT_INIT;
	tp->mdev = TCP_TIMEOUT_INIT;

	/* So many TCP implementations out there (incorrectly) count the
	 * initial SYN frame in their delayed-ACK and congestion control
	 * algorithms that we must have the following bandaid to talk
	 * efficiently to them.  -DaveM
	 */
	tp->snd_cwnd = 2;

	/* See draft-stevens-tcpca-spec-01 for discussion of the
	 * initialization of these values.
	 */
	tp->snd_ssthresh = TCP_INFINITE_SSTHRESH;
	tp->snd_cwnd_clamp = ~0;
	tp->mss_cache = TCP_MSS_DEFAULT;

	tp->reordering = sysctl_tcp_reordering;
	icsk->icsk_ca_ops = &tcp_init_congestion_ops;

	sk->sk_state = TCP_CLOSE;

	sk->sk_write_space = sk_stream_write_space;
	sock_set_flag(sk, SOCK_USE_WRITE_QUEUE);

	icsk->icsk_af_ops = &ipv4_specific;
	icsk->icsk_sync_mss = tcp_sync_mss;
#ifdef CONFIG_TCP_MD5SIG
	tp->af_specific = &tcp_sock_ipv4_specific;
#endif

	/* TCP Cookie Transactions */
	if (sysctl_tcp_cookie_size > 0) {
		/* Default, cookies without s_data_payload. */
		tp->cookie_values =
			kzalloc(sizeof(*tp->cookie_values),
				sk->sk_allocation);
		if (tp->cookie_values != NULL)
			kref_init(&tp->cookie_values->kref);
	}
	/* Presumed zeroed, in order of appearance:
	 *	cookie_in_always, cookie_out_never,
	 *	s_data_constant, s_data_in, s_data_out
	 */
	sk->sk_sndbuf = sysctl_tcp_wmem[1];
	sk->sk_rcvbuf = sysctl_tcp_rmem[1];

	local_bh_disable();
	percpu_counter_inc(&tcp_sockets_allocated);
	local_bh_enable();

	return 0;
}
```
<div align="center">

![](/img/note_0b/02.png)
</div>

### **5、sk_prot_alloc参数prot** ###
　　由第4小结中的sk_prot_alloc函数解释，可知sk_prot_alloc中使用的prot变量，其作为参数传入，最早定义在inet_create函数中answer结构体。answer初始化详看以下代码
`inet_create`函数
```c
/*
 *	Create an inet socket.
 */

static int inet_create(struct net *net, struct socket *sock, int protocol,
		       int kern)
{
	struct sock *sk;
	struct inet_protosw *answer;
	struct inet_sock *inet;
	struct proto *answer_prot;
	unsigned char answer_flags;
	char answer_no_check;
	int try_loading_module = 0;
	int err;

	if (unlikely(!inet_ehash_secret))
		if (sock->type != SOCK_RAW && sock->type != SOCK_DGRAM)
			build_ehash_secret();

	sock->state = SS_UNCONNECTED;

	/* Look for the requested type/protocol pair. */
lookup_protocol:
	err = -ESOCKTNOSUPPORT;
	rcu_read_lock();
	/*
	 * 从inetsw中根据类型，协议查找相应的socket interface即 inet_protosw *answer;
	 *
	 *		//  include/linux/rculist.h
	 *		#define list_for_each_entry_rcu(pos, head, member) \
	 *			for (pos = list_entry_rcu((head)->next, typeof(*pos), member); \
	 *				prefetch(pos->member.next), &pos->member != (head); \
	 *				pos = list_entry_rcu(pos->member.next, typeof(*pos), member))
	 */
	`list_for_each_entry_rcu`(answer, &inetsw[sock->type], list) {

		err = 0;
		/* Check the non-wild match. */
		if (protocol == answer->protocol) {
			if (protocol != IPPROTO_IP)
				break;
		} else {
			/* Check for the two wild cases. */
			if (IPPROTO_IP == protocol) {
				protocol = answer->protocol;
				break;
			}
			if (IPPROTO_IP == answer->protocol)
				break;
		}
		err = -EPROTONOSUPPORT;
	}
	/*
	 * 如果没找到，尝试加载模块 
	 */
	if (unlikely(err)) {
		if (try_loading_module < 2) {
			rcu_read_unlock();
			/*
			 * Be more specific, e.g. net-pf-2-proto-132-type-1
			 * (net-pf-PF_INET-proto-IPPROTO_SCTP-type-SOCK_STREAM)
			 */
			if (++try_loading_module == 1)
				request_module("net-pf-%d-proto-%d-type-%d",
					       PF_INET, protocol, sock->type);
			/*
			 * Fall back to generic, e.g. net-pf-2-proto-132
			 * (net-pf-PF_INET-proto-IPPROTO_SCTP)
			 */
			else
				request_module("net-pf-%d-proto-%d",
					       PF_INET, protocol);
			goto lookup_protocol;
		} else
			goto out_rcu_unlock;
	}

	err = -EPERM;
	if (sock->type == SOCK_RAW && !kern && !capable(CAP_NET_RAW))
		goto out_rcu_unlock;

	err = -EAFNOSUPPORT;
	if (!inet_netns_ok(net, protocol))
		goto out_rcu_unlock;

	sock->ops = answer->ops;
	answer_prot = answer->prot;
	answer_no_check = answer->no_check;
	answer_flags = answer->flags;
	rcu_read_unlock();

	WARN_ON(answer_prot->slab == NULL);

	err = -ENOBUFS;
	/*
	 * sk_alloc表面上式生成sock的结构体，但是实际上对于tcp来说是tcp_sock的大小的结构体，这样就可以使用inet_sk(sk);进行强制的类型转换，具体如何分配tcp_sock大小？
	 */
	sk = `sk_alloc`(net, PF_INET, GFP_KERNEL, answer_prot);
	if (sk == NULL)
		goto out;

	err = 0;
	sk->sk_no_check = answer_no_check;
	if (INET_PROTOSW_REUSE & answer_flags)
		sk->sk_reuse = 1;

	inet = inet_sk(sk);
	inet->is_icsk = (INET_PROTOSW_ICSK & answer_flags) != 0;

	inet->nodefrag = 0;

	if (SOCK_RAW == sock->type) {
		inet->inet_num = protocol;
		if (IPPROTO_RAW == protocol)
			inet->hdrincl = 1;
	}

	if (ipv4_config.no_pmtu_disc)
		inet->pmtudisc = IP_PMTUDISC_DONT;
	else
		inet->pmtudisc = IP_PMTUDISC_WANT;

	inet->inet_id = 0;
  
  	/*
  	 * sk结构体变量进行初始化。
  	 */
	sock_init_data(sock, sk);

	sk->sk_destruct	   = inet_sock_destruct;
	sk->sk_protocol	   = protocol;
	sk->sk_backlog_rcv = sk->sk_prot->backlog_rcv;

	inet->uc_ttl	= -1;
	inet->mc_loop	= 1;
	inet->mc_ttl	= 1;
	inet->mc_all	= 1;
	inet->mc_index	= 0;
	inet->mc_list	= NULL;

	sk_refcnt_debug_inc(sk);

	if (inet->inet_num) {
		/* It assumes that any protocol which allows
		 * the user to assign a number at socket
		 * creation time automatically
		 * shares.
		 */
		inet->inet_sport = htons(inet->inet_num);
		/* Add to protocol hash chains. */
		sk->sk_prot->hash(sk);
	}

	if (sk->sk_prot->init) {
		err = sk->sk_prot->init(sk); //如果tcp  这里为`tcp_v4_init_sock`
		if (err)
			sk_common_release(sk);
	}
out:
	return err;
out_rcu_unlock:
	rcu_read_unlock();
	goto out;
}
```
　　list_for_each_entry_rcu(`answer`, &inetsw[sock->type], list)中的answer由`inetsw`遍历得出，其中inetsw的定义下面类型的数组如果是SOCK_STREAM类型的socket，这里的prot = tcp_prot;
`inetsw_array`   // net/ipv4/af_inet.c 
```c
/* Upon startup we insert all the elements in inetsw_array[] into
 * the linked list inetsw.
 */
static struct inet_protosw `inetsw_array`[] =
{
	{
		.type =       SOCK_STREAM,
		.protocol =   IPPROTO_TCP,
		.prot =       &`tcp_prot`,
		.ops =        &inet_stream_ops,
		.no_check =   0,
		.flags =      INET_PROTOSW_PERMANENT |
			      INET_PROTOSW_ICSK,
	},

	{
		.type =       SOCK_DGRAM,
		.protocol =   IPPROTO_UDP,
		.prot =       &udp_prot,
		.ops =        &inet_dgram_ops,
		.no_check =   UDP_CSUM_DEFAULT,
		.flags =      INET_PROTOSW_PERMANENT,
       },


       {
	       .type =       SOCK_RAW,
	       .protocol =   IPPROTO_IP,	/* wild card */
	       .prot =       &raw_prot,
	       .ops =        &inet_sockraw_ops,
	       .no_check =   UDP_CSUM_DEFAULT,
	       .flags =      INET_PROTOSW_REUSE,
       }
};
```
`tcp_prot`  // net/ipv4/tcp_ipv4.c
```c
struct proto `tcp_prot` = {
	.name			= "TCP",
	.owner			= THIS_MODULE,
	.close			= tcp_close,
	.connect		= tcp_v4_connect,
	.disconnect		= tcp_disconnect,
	.accept			= inet_csk_accept,
	.ioctl			= tcp_ioctl,
	.init			= tcp_v4_init_sock,
	.destroy		= tcp_v4_destroy_sock,
	.shutdown		= tcp_shutdown,
	.setsockopt		= tcp_setsockopt,
	.getsockopt		= tcp_getsockopt,
	.recvmsg		= tcp_recvmsg,
	.sendmsg		= tcp_sendmsg,
	.sendpage		= tcp_sendpage,
	.backlog_rcv		= tcp_v4_do_rcv,
	.hash			= inet_hash,
	.unhash			= inet_unhash,
	.get_port		= inet_csk_get_port,
	.enter_memory_pressure	= tcp_enter_memory_pressure,
	.sockets_allocated	= &tcp_sockets_allocated,
	.orphan_count		= &tcp_orphan_count,
	.memory_allocated	= &tcp_memory_allocated,
	.memory_pressure	= &tcp_memory_pressure,
	.sysctl_mem		= sysctl_tcp_mem,
	.sysctl_wmem		= sysctl_tcp_wmem,
	.sysctl_rmem		= sysctl_tcp_rmem,
	.max_header		= MAX_TCP_HEADER,
	.`obj_size`		= sizeof(struct tcp_sock),
	.slab_flags		= SLAB_DESTROY_BY_RCU,
	.twsk_prot		= &tcp_timewait_sock_ops,
	.rsk_prot		= &tcp_request_sock_ops,
	.h.hashinfo		= &tcp_hashinfo,
	.no_autobind		= true,
#ifdef CONFIG_COMPAT
	.compat_setsockopt	= compat_tcp_setsockopt,
	.compat_getsockopt	= compat_tcp_getsockopt,
#endif
};
```
在inet_init函数中（af_inet.c文件）
`inet_init`  // net/ipv4/af_inet.c	line:1609
```c
static int __init inet_init(void)
{
	struct sk_buff *dummy_skb;
	struct inet_protosw *q;
	struct list_head *r;
	int rc = -EINVAL;

	BUILD_BUG_ON(sizeof(struct inet_skb_parm) > sizeof(dummy_skb->cb));

	sysctl_local_reserved_ports = kzalloc(65536 / 8, GFP_KERNEL);
	if (!sysctl_local_reserved_ports)
		goto out;

     // 该函数注册tcp_prot，在该函数中对tcp_prot->slab进行内存分配
	rc = `proto_register`(&tcp_prot, 1);  // 详见 ---[5.1]
	if (rc)
		goto out_free_reserved_ports;

	rc = proto_register(&udp_prot, 1);
	if (rc)
		goto out_unregister_tcp_proto;

	rc = proto_register(&raw_prot, 1);
	if (rc)
		goto out_unregister_udp_proto;

	/*
	 *	Tell SOCKET that we are alive...
	 */

	(void)sock_register(&inet_family_ops);

#ifdef CONFIG_SYSCTL
	ip_static_sysctl_init();
#endif

	/*
	 *	Add all the base protocols.
	 */

	if (inet_add_protocol(&icmp_protocol, IPPROTO_ICMP) < 0)
		printk(KERN_CRIT "inet_init: Cannot add ICMP protocol\n");
	if (inet_add_protocol(&udp_protocol, IPPROTO_UDP) < 0)
		printk(KERN_CRIT "inet_init: Cannot add UDP protocol\n");
	if (inet_add_protocol(&tcp_protocol, IPPROTO_TCP) < 0)
		printk(KERN_CRIT "inet_init: Cannot add TCP protocol\n");
#ifdef CONFIG_IP_MULTICAST
	if (inet_add_protocol(&igmp_protocol, IPPROTO_IGMP) < 0)
		printk(KERN_CRIT "inet_init: Cannot add IGMP protocol\n");
#endif

	/* Register the socket-side information for inet_create. */
    // `inetsw 进行初始化操作 `
	for (r = &inetsw[0]; r < &inetsw[SOCK_MAX]; ++r)
		`INIT_LIST_HEAD`(r);  //详见------[5.2]

     // `将 inetsw_array加入到对应的inetsw链表中，就可以在inet_create函数中进行遍历`
	for (q = inetsw_array; q < &inetsw_array[INETSW_ARRAY_LEN]; ++q)
		`inet_register_protosw`(q);  // 详见------[5.3]

	/*
	 *	Set the ARP module up
	 */

	arp_init();

	/*
	 *	Set the IP module up
	 */

	ip_init();

	tcp_v4_init();

	/* Setup TCP slab cache for open requests. */
	tcp_init();

	/* Setup UDP memory threshold */
	udp_init();

	/* Add UDP-Lite (RFC 3828) */
	udplite4_register();

	/*
	 *	Set the ICMP layer up
	 */

	if (icmp_init() < 0)
		panic("Failed to create the ICMP control socket.\n");

	/*
	 *	Initialise the multicast router
	 */
#if defined(CONFIG_IP_MROUTE)
	if (ip_mr_init())
		printk(KERN_CRIT "inet_init: Cannot init ipv4 mroute\n");
#endif
	/*
	 *	Initialise per-cpu ipv4 mibs
	 */

	if (init_ipv4_mibs())
		printk(KERN_CRIT "inet_init: Cannot init ipv4 mibs\n");

	ipv4_proc_init();

	ipfrag_init();

	dev_add_pack(&ip_packet_type);

	rc = 0;
out:
	return rc;
out_unregister_udp_proto:
	proto_unregister(&udp_prot);
out_unregister_tcp_proto:
	proto_unregister(&tcp_prot);
out_free_reserved_ports:
	kfree(sysctl_local_reserved_ports);
	goto out;
}
```
#### **5.1、proto_register ** ####
`proto_register` 注册函数  // net/core/sock.c
```c
int proto_register(struct proto *prot, int alloc_slab)
{
	if (alloc_slab) {
         // prot->obj_size 为`.obj = sizeof(struct tcp_sock)`
		prot->slab = `kmem_cache_create`(prot->name, prot->obj_size, 0,
					SLAB_HWCACHE_ALIGN | prot->slab_flags,
					NULL);

		if (prot->slab == NULL) {
			printk(KERN_CRIT "%s: Can't create sock SLAB cache!\n",
			       prot->name);
			goto out;
		}

		if (prot->rsk_prot != NULL) {
			prot->rsk_prot->slab_name = kasprintf(GFP_KERNEL, "request_sock_%s", prot->name);
			if (prot->rsk_prot->slab_name == NULL)
				goto out_free_sock_slab;

			prot->rsk_prot->slab = kmem_cache_create(prot->rsk_prot->slab_name,
								 prot->rsk_prot->obj_size, 0,
								 SLAB_HWCACHE_ALIGN, NULL);

			if (prot->rsk_prot->slab == NULL) {
				printk(KERN_CRIT "%s: Can't create request sock SLAB cache!\n",
				       prot->name);
				goto out_free_request_sock_slab_name;
			}
		}

		if (prot->twsk_prot != NULL) {
			prot->twsk_prot->twsk_slab_name = kasprintf(GFP_KERNEL, "tw_sock_%s", prot->name);

			if (prot->twsk_prot->twsk_slab_name == NULL)
				goto out_free_request_sock_slab;

			prot->twsk_prot->twsk_slab =
				kmem_cache_create(prot->twsk_prot->twsk_slab_name,
						  prot->twsk_prot->twsk_obj_size,
						  0,
						  SLAB_HWCACHE_ALIGN |
							prot->slab_flags,
						  NULL);
			if (prot->twsk_prot->twsk_slab == NULL)
				goto out_free_timewait_sock_slab_name;
		}
	}

	write_lock(&proto_list_lock);
	list_add(&prot->node, &proto_list);
	assign_proto_idx(prot);
	write_unlock(&proto_list_lock);
	return 0;

out_free_timewait_sock_slab_name:
	kfree(prot->twsk_prot->twsk_slab_name);
out_free_request_sock_slab:
	if (prot->rsk_prot && prot->rsk_prot->slab) {
		kmem_cache_destroy(prot->rsk_prot->slab);
		prot->rsk_prot->slab = NULL;
	}
out_free_request_sock_slab_name:
	if (prot->rsk_prot)
		kfree(prot->rsk_prot->slab_name);
out_free_sock_slab:
	kmem_cache_destroy(prot->slab);
	prot->slab = NULL;
out:
	return -ENOBUFS;
}
```
#### **5.2、INIT_LIST_HEAD** ####
```c
static inline void INIT_LIST_HEAD(struct list_head *list)
{
	list->next = list;
	list->prev = list;
}
```

#### **5.3、inet_register_protosw** ####
```c
void inet_register_protosw(struct inet_protosw *p)
{
	struct list_head *lh;
	struct inet_protosw *answer;
	int protocol = p->protocol;
	struct list_head *last_perm;

	spin_lock_bh(&inetsw_lock);

	if (p->type >= SOCK_MAX)
		goto out_illegal;

	/* If we are trying to override a permanent protocol, bail. */
	answer = NULL;
	last_perm = &inetsw[p->type];
	list_for_each(lh, &inetsw[p->type]) {
		answer = list_entry(lh, struct inet_protosw, list);

		/* Check only the non-wild match. */
		if (INET_PROTOSW_PERMANENT & answer->flags) {
			if (protocol == answer->protocol)
				break;
			last_perm = lh;
		}

		answer = NULL;
	}
	if (answer)
		goto out_permanent;

	/* Add the new entry after the last permanent entry if any, so that
	 * the new entry does not override a permanent entry when matched with
	 * a wild-card protocol. But it is allowed to override any existing
	 * non-permanent entry.  This means that when we remove this entry, the
	 * system automatically returns to the old behavior.
	 */
	list_add_rcu(&p->list, last_perm);
out:
	spin_unlock_bh(&inetsw_lock);

	return;

out_permanent:
	printk(KERN_ERR "Attempt to override permanent protocol %d.\n",
	       protocol);
	goto out;

out_illegal:
	printk(KERN_ERR
	       "Ignoring attempt to register invalid socket type %d.\n",
	       p->type);
	goto out;
}
```
<div align="center">

![](/img/note_0b/03.png)
</div>

### **6、sock_map_fd函数** ###
　　在用户控件控件创建了一个socket后，返回值是一个文件描述符，下面分析一下创建socket时怎么和文件描述符联系，在SYSCLALL_DEFINE3(socket,int,family,int,
type,int,portocol)最后调用socke_map_fd进行关联，其中返回的retval就是用户控件获取的文件描述符fd,sock就是调用sock_create创建成功的socket。
　　sock_map_fd()主要用于对socket的*file指针初始化，经过sock_map_fd()操作后，socket就通过其*file指针与VFS管理的文件进行了关联，便可以进行文件的各种操作，如read,write,lessk,ioctl等。

　　retval = `sock_map_fd`(sock,flag&(O_CLOEXEC|O_NOBLOCK));
`sock_map_fd`函数   // net/socket.c	line:395
```c
int sock_map_fd(struct socket *sock, int flags)
{
	struct file *newfile;
	int fd = `sock_alloc_file`(sock, &newfile, flags);  

	if (likely(fd >= 0))
		fd_install(fd, newfile);

	return fd;
}
```
#### **6.1、sock_alloc_file函数** ####
`sock_alloc_file`函数   // net/socket.c		line:354
```c
/*
 *	Obtains the first available file descriptor and sets it up for use.
 *
 *	These functions create file structures and maps them to fd space
 *	of the current process. On success it returns file descriptor
 *	and file struct implicitly stored in sock->file.
 *	Note that another thread may close file descriptor before we return
 *	from this function. We use the fact that now we do not refer
 *	to socket after mapping. If one day we will need it, this
 *	function will increment ref. count on file by 1.
 *
 *	In any case returned fd MAY BE not valid!
 *	This race condition is unavoidable
 *	with shared fd spaces, we cannot solve it inside kernel,
 *	but we take care of internal coherence yet.
 */

static int sock_alloc_file(struct socket *sock, struct file **f, int flags)
{
	struct qstr name = { .name = "" };
	struct path path;
	struct file *file;
	int fd;
     /*
      *  #define get_unused_fd_flags(flags) `alloc_fd`(0, (flags))
      *  // include/linux/file.h
      */
	fd = `get_unused_fd_flags`(flags);  
	if (unlikely(fd < 0))
		return fd;

	path.dentry = d_alloc(sock_mnt->mnt_sb->s_root, &name);
	if (unlikely(!path.dentry)) {
		put_unused_fd(fd);
		return -ENOMEM;
	}
	path.mnt = mntget(sock_mnt);

	path.dentry->d_op = &sockfs_dentry_operations;
     /*
      * 将文件操作的函数绑定到inode,对于dentry是在socket_mount函数中socket_dentry_operations，该函数在sock_init中调用
      */
	d_instantiate(path.dentry, SOCK_INODE(sock));
	SOCK_INODE(sock)->i_fop = &socket_file_ops;
     
     /*
      * 申请新的file,将path和file关联起来
      */
	file = alloc_file(&path, FMODE_READ | FMODE_WRITE,
		  &socket_file_ops);
	if (unlikely(!file)) {
		/* drop dentry, keep inode */
		atomic_inc(&path.dentry->d_inode->i_count);
		path_put(&path);
		put_unused_fd(fd);
		return -ENFILE;
	}

	sock->file = file;
	file->f_flags = O_RDWR | (flags & O_NONBLOCK);
	file->f_pos = 0;
	file->private_data = sock;

	*f = file;
	return fd;
}
```
#### **6.2、get_unused_fd_flags宏实现** ####
`get_unused_fd_flags` 宏 // include/linux/file.h	line:36
```c
#define get_unused_fd_flags(flags) alloc_fd(0, (flags))
```
`alloc_fd`函数 // fs/file.c		line:427
```c
/*
 * allocate a file descriptor, mark it busy.
 */
int alloc_fd(unsigned start, unsigned flags)
{
	struct files_struct *files = current->files;
	unsigned int fd;
	int error;
	struct fdtable *fdt;

	spin_lock(&files->file_lock);
repeat:
	/* 得到本进程的文件描述符 */
	fdt = `files_fdtable`(files);
	fd = start; // 从start开始,这里start为0
	/*
	 * files->next_fd为上一次确定的下一个可用空闲的文件描述符，这里可以提高获取的效率，如果fd小于files->next_fd的话就可以直接使用next_fd;
	 */
	if (fd < files->next_fd)
		fd = files->next_fd;

	/*
	 *  当fd小于目前进程支持的最大的描述符号，那么可以通过fds_bit位图，从fd位开始查找，找到下一位0位，即下一个空闲描述符
	 */
	if (fd < fdt->max_fds)
		fd = find_next_zero_bit(fdt->open_fds->fds_bits,
					   fdt->max_fds, fd);
	/*
	 * 如需要则扩展文件描述符表
	 */
	error = expand_files(files, fd);
	if (error < 0)
		goto out;

	/*
	 * If we needed to expand the fs array we
	 * might have blocked - try again.
	 */
	if (error)
		goto repeat;

 	/*
 	 * 设置next_fd，用于下次加速查找空闲的fd
 	 * 当start大于next_fd时，不会设置next_fd以避免文件描述符的不连续。
 	 */
	if (start <= files->next_fd)
		files->next_fd = fd + 1;

	/*
	 * 将fd添加到一打开的文件描述符表中
	 */
	FD_SET(fd, fdt->open_fds);
	if (flags & O_CLOEXEC)
		FD_SET(fd, fdt->close_on_exec);
	else
		FD_CLR(fd, fdt->close_on_exec);
	error = fd;
	/* Sanity check */
	if (rcu_dereference_raw(fdt->fd[fd]) != NULL) {
		printk(KERN_WARNING "alloc_fd: slot %d not NULL!\n", fd);
		rcu_assign_pointer(fdt->fd[fd], NULL);
	}

out:
	spin_unlock(&files->file_lock);
	return error;
}
```
<div align="center">

![](/img/note_0b/04.png)
</div>

<div align="center">

![](/img/note_0b/05.png)
</div>

## **二、绑定bind** ##
### **1、SYSCALL_DEFINE3(bind,...)** ###
　　bind系统调用通过SYSCALL_DEFINE3调用各个协议不同的bind函数。
SYSCALL_DEFINE3(`bind`, int, fd, struct sockaddr __user *, umyaddr, int, addrlen)       // net/socket.c		line:1394
```c
SYSCALL_DEFINE3(`bind`, int, fd, struct sockaddr __user *, umyaddr, int, addrlen)
{
	struct socket *sock;
	struct sockaddr_storage address;
	int err, fput_needed;
	sock = `sockfd_lookup_light`(fd, &err, &fput_needed); // 根据文件描述符fd,查找相应套接字socket 
	if (sock) {
		err = `move_addr_to_kernel`(umyaddr, addrlen, (struct sockaddr *)&address);
		if (err >= 0) {
			err = security_socket_bind(sock,
						   (struct sockaddr *)&address,
						   addrlen);
			if (!err)
				err = `sock->ops->bind`(sock,
						      (struct sockaddr *)
						      &address, addrlen);
		}
		fput_light(sock->file, fput_needed);
	}
	return err;
}
```
### **2、sockfd_lookup_light函数** ###
`sockfd_lookup_light`函数 	//net/socket.c		line:447
```c
static struct socket *sockfd_lookup_light(int fd, int *err, int *fput_needed)
{
	struct file *file;
	struct socket *sock;

	*err = -EBADF;
	file = `fget_light`(fd, fput_needed); //通过fd获取struct file结构体
	if (file) {
		sock = `sock_from_file`(file, err); //返回套接字所对应的存储在file->private_date;在sock_aloc_file函数中对其进行赋值
		if (sock)
			return sock;
		fput_light(file, *fput_needed);
	}
	return NULL;
}
```
### **3、inet_bind函数** ###
　　sock->ops->bind实际调用为inet_bind。sock->ops->bind赋值过程。
　　在创建TCP类型的socket时，进行了下面的赋值初始化操作，这里的bind定义为inet_bind()函数。
`inetsw_array`结构体数组  //  net/ipv4/af_inet.c
```c
static struct inet_protosw `inetsw_array`[] =
{
	{
		.type =       SOCK_STREAM,
		.protocol =   IPPROTO_TCP,
		.prot =       &tcp_prot,
		.`ops =        &inet_stream_ops`,
		.no_check =   0,
		.flags =      INET_PROTOSW_PERMANENT |
			      INET_PROTOSW_ICSK,
	},

	{
		.type =       SOCK_DGRAM,
		.protocol =   IPPROTO_UDP,
		.prot =       &udp_prot,
		.ops =        &inet_dgram_ops,
		.no_check =   UDP_CSUM_DEFAULT,
		.flags =      INET_PROTOSW_PERMANENT,
       },


       {
	       .type =       SOCK_RAW,
	       .protocol =   IPPROTO_IP,	/* wild card */
	       .prot =       &raw_prot,
	       .ops =        &inet_sockraw_ops,
	       .no_check =   UDP_CSUM_DEFAULT,
	       .flags =      INET_PROTOSW_REUSE,
       }
};
```
`inet_stream_ops`  //  net/ipv4/af_inet.c
```c
const struct proto_ops inet_stream_ops = {
	.family		   = PF_INET,
	.owner		   = THIS_MODULE,
	.release	   = inet_release,
	.`bind		   = inet_bind`,
	.connect	   = inet_stream_connect,
	.socketpair	   = sock_no_socketpair,
	.accept		   = inet_accept,
	.getname	   = inet_getname,
	.poll		   = tcp_poll,
	.ioctl		   = inet_ioctl,
	.listen		   = inet_listen,
	.shutdown	   = inet_shutdown,
	.setsockopt	   = sock_common_setsockopt,
	.getsockopt	   = sock_common_getsockopt,
	.sendmsg	   = inet_sendmsg,
	.recvmsg	   = inet_recvmsg,
	.mmap		   = sock_no_mmap,
	.sendpage	   = inet_sendpage,
	.splice_read	   = tcp_splice_read,
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_sock_common_setsockopt,
	.compat_getsockopt = compat_sock_common_getsockopt,
#endif
};
```
`inet_dgram_ops`   //  net/ipv4/af_inet.c
```c
const struct proto_ops inet_dgram_ops = {
	.family		   = PF_INET,
	.owner		   = THIS_MODULE,
	.release	   = inet_release,
	.`bind		   = inet_bind`,
	.connect	   = inet_dgram_connect,
	.socketpair	   = sock_no_socketpair,
	.accept		   = sock_no_accept,
	.getname	   = inet_getname,
	.poll		   = udp_poll,
	.ioctl		   = inet_ioctl,
	.listen		   = sock_no_listen,
	.shutdown	   = inet_shutdown,
	.setsockopt	   = sock_common_setsockopt,
	.getsockopt	   = sock_common_getsockopt,
	.sendmsg	   = inet_sendmsg,
	.recvmsg	   = inet_recvmsg,
	.mmap		   = sock_no_mmap,
	.sendpage	   = inet_sendpage,
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_sock_common_setsockopt,
	.compat_getsockopt = compat_sock_common_getsockopt,
#endif
};
```
`inet_sockraw_ops` //  net/ipv4/af_inet.c
```c
static const struct proto_ops inet_sockraw_ops = {
	.family		   = PF_INET,
	.owner		   = THIS_MODULE,
	.release	   = inet_release,
	.`bind		   = inet_bind`,
	.connect	   = inet_dgram_connect,
	.socketpair	   = sock_no_socketpair,
	.accept		   = sock_no_accept,
	.getname	   = inet_getname,
	.poll		   = datagram_poll,
	.ioctl		   = inet_ioctl,
	.listen		   = sock_no_listen,
	.shutdown	   = inet_shutdown,
	.setsockopt	   = sock_common_setsockopt,
	.getsockopt	   = sock_common_getsockopt,
	.sendmsg	   = inet_sendmsg,
	.recvmsg	   = inet_recvmsg,
	.mmap		   = sock_no_mmap,
	.sendpage	   = inet_sendpage,
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_sock_common_setsockopt,
	.compat_getsockopt = compat_sock_common_getsockopt,
#endif
};
```
#### **3.1、inet_bind函数** ####
`inet_bind`函数	// net/ipv4/af_inet.c	line:453
```c
int inet_bind(struct socket *sock, struct sockaddr *uaddr, int addr_len)
{
	struct sockaddr_in *addr = (struct sockaddr_in *)uaddr;  //要绑定的sockaddr_in结构体
	struct sock *sk = sock->sk;
	struct inet_sock *inet = inet_sk(sk);
	unsigned short snum;   //绑定的端口
	int chk_addr_ret;  //地址类型
	int err;

	/* If the socket has its own bind function then use it. (RAW) */
/*
 * 对于RAW类型的socket，调用raw socket自己的bind函数 raw_bind
 */
	if (`sk->sk_prot->bind`) {
		err = sk->sk_prot->bind(sk, uaddr, addr_len);
		goto out;
	}
	err = -EINVAL;
	if (addr_len < sizeof(struct sockaddr_in)) // sockaddr_in长度错误
		goto out;

	chk_addr_ret = inet_addr_type(sock_net(sk), addr->sin_addr.s_addr); //地址类型检查，看看是否回环地址，多播地址，组播地址，在下面的判断中需要使用到

	/* Not specified by any standard per-se, however it breaks too
	 * many applications when removed.  It is unfortunate since
	 * allowing applications to make a non-local bind solves
	 * several problems with systems using dynamic addressing.
	 * (ie. your servers still start up even if your ISDN link
	 *  is temporarily down)
	 */
	err = -EADDRNOTAVAIL;
	/*
	 * sysctl_ip_nonlocal_bind表明是否允许绑定非本地的IP地址，默认为0，不允许绑定
 	 *   # cd /proc/sys/net/ipv4
	 *   # cat ip_nonlocal_bind   0
	 *  以上注释说明了使用费本地地址绑定可以解决一些使用动态地址绑定的服务器程
	 *  序，所有这个实现还是有实际意义的。
 	 *  inet->freebind是通过do_ip_setsockopt函数进行设置的，默认值为1，改值表示允许
 	 *  绑定一个非本地IP地址和不存在的IP地址，可以通过IP_FREEBIND设置
 	 *   inet->tarnsparent 含义就是可以使用一个服务器程序监听所有的IP地址，哪怕不是
 	 *   本地的IP地址
 	 */
	if (!sysctl_ip_nonlocal_bind &&
	    !(inet->freebind || inet->transparent) &&
	    addr->sin_addr.s_addr != htonl(INADDR_ANY) &&
	    chk_addr_ret != RTN_LOCAL &&
	    chk_addr_ret != RTN_MULTICAST &&
	    chk_addr_ret != RTN_BROADCAST)
		goto out;

	snum = ntohs(addr->sin_port); //获取绑定端口号
	err = -EACCES;
     /*
      * 如果要绑定`0-1023`之内的端口号，需要用户具有CAP_NET_BIND_SERVICE权限，PROT_SOCK就是1024 
      */
	if (snum && snum < PROT_SOCK && !capable(CAP_NET_BIND_SERVICE))
		goto out;

	/*      We keep a pair of addresses. rcv_saddr is the one
	 *      used by hash lookups, and saddr is used for transmit.
	 *
	 *      In the BSD API these are the same except where it
	 *      would be illegal to use them (multicast/broadcast) in
	 *      which case the sending device address is used.
	 */
	lock_sock(sk);

	/* Check these errors (active socket, double bind). */
	err = -EINVAL;
     /*
      * 判断sk_state的状态十分为TCP_CLOSE,在创建socket时，sk_state初始为TCP_CLOSE，如果不等于TCP_CLOSE说明已经bind过，而num只有当raw socket时才不为0
      */
	if (sk->sk_state != TCP_CLOSE || inet->inet_num) 
		goto out_release_sock;

	inet->inet_rcv_saddr = inet->inet_saddr = addr->sin_addr.s_addr; //需要绑定的地址
	if (chk_addr_ret == RTN_MULTICAST || chk_addr_ret == RTN_BROADCAST)
		inet->inet_saddr = 0;  /* Use device */

	/* Make sure we are allowed to bind here. */
	/*
 	 * 调用四层的bind函数，对于TCP来说，就是inet_csk_get_port 
 	 */
	if (`sk->sk_prot->get_port`(sk, snum)) {
		inet->inet_saddr = inet->inet_rcv_saddr = 0;
		err = -EADDRINUSE;
		goto out_release_sock;
	}

	if (inet->inet_rcv_saddr)
		sk->sk_userlocks |= SOCK_BINDADDR_LOCK;  //设置sk中的sk->userlocks表示绑定地址
	if (snum)
		sk->sk_userlocks |= SOCK_BINDPORT_LOCK;  //设置sk中的sk->userlocks表示绑定端口
	inet->inet_sport = htons(inet->inet_num);
	inet->inet_daddr = 0;
	inet->inet_dport = 0;
	sk_dst_reset(sk);
	err = 0;
out_release_sock:
	release_sock(sk);
out:
	return err;
```

#### **3.2、sk->sk_prot->bind赋值** ####
　　sk->sk_prot->bind成员赋值，由以下tcp_prot、udp_prot和raw_prot三个proto结构体变量的各个成员赋值可值，tcp_prot和udp_prot变量不存在bind成员赋值，只有raw_prot变量存在bind成员赋值且.bind = raw_bind。
`tcp_prot` 		// net/ipv4/tcp_ipv4.c		line:2601
```c
struct proto tcp_prot = {
	.name			= `"TCP"`,
	.owner			= THIS_MODULE,
	.close			= tcp_close,
	.connect		= tcp_v4_connect,
	.disconnect		= tcp_disconnect,
	.accept			= inet_csk_accept,
	.ioctl			= tcp_ioctl,
	.init			= tcp_v4_init_sock,
	.destroy		= tcp_v4_destroy_sock,
	.shutdown		= tcp_shutdown,
	.setsockopt		= tcp_setsockopt,
	.getsockopt		= tcp_getsockopt,
	.recvmsg		= tcp_recvmsg,
	.sendmsg		= tcp_sendmsg,
	.sendpage		= tcp_sendpage,
	.backlog_rcv		= tcp_v4_do_rcv,
	.hash			= inet_hash,
	.unhash			= inet_unhash,
	.`get_port		= inet_csk_get_port`,
	.enter_memory_pressure	= tcp_enter_memory_pressure,
	.sockets_allocated	= &tcp_sockets_allocated,
	.orphan_count		= &tcp_orphan_count,
	.memory_allocated	= &tcp_memory_allocated,
	.memory_pressure	= &tcp_memory_pressure,
	.sysctl_mem		= sysctl_tcp_mem,
	.sysctl_wmem		= sysctl_tcp_wmem,
	.sysctl_rmem		= sysctl_tcp_rmem,
	.max_header		= MAX_TCP_HEADER,
	.obj_size		= sizeof(struct tcp_sock),
	.slab_flags		= SLAB_DESTROY_BY_RCU,
	.twsk_prot		= &tcp_timewait_sock_ops,
	.rsk_prot		= &tcp_request_sock_ops,
	.h.hashinfo		= &tcp_hashinfo,
	.no_autobind		= true,
#ifdef CONFIG_COMPAT
	.compat_setsockopt	= compat_tcp_setsockopt,
	.compat_getsockopt	= compat_tcp_getsockopt,
#endif
};
```
`udp_prot`		// net/ipv4/udp.c	line:1860
```c
struct proto udp_prot = {
	.name		   = `"UDP"`,
	.owner		   = THIS_MODULE,
	.close		   = udp_lib_close,
	.connect	   = ip4_datagram_connect,
	.disconnect	   = udp_disconnect,
	.ioctl		   = udp_ioctl,
	.destroy	   = udp_destroy_sock,
	.setsockopt	   = udp_setsockopt,
	.getsockopt	   = udp_getsockopt,
	.sendmsg	   = udp_sendmsg,
	.recvmsg	   = udp_recvmsg,
	.sendpage	   = udp_sendpage,
	.backlog_rcv	   = __udp_queue_rcv_skb,
	.hash		   = udp_lib_hash,
	.unhash		   = udp_lib_unhash,
	.rehash		   = udp_v4_rehash,
	.`get_port	   = udp_v4_get_port`,
	.memory_allocated  = &udp_memory_allocated,
	.sysctl_mem	   = sysctl_udp_mem,
	.sysctl_wmem	   = &sysctl_udp_wmem_min,
	.sysctl_rmem	   = &sysctl_udp_rmem_min,
	.obj_size	   = sizeof(struct udp_sock),
	.slab_flags	   = SLAB_DESTROY_BY_RCU,
	.h.udp_table	   = &udp_table,
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_udp_setsockopt,
	.compat_getsockopt = compat_udp_getsockopt,
#endif
};
```
`raw_port`		//net/ipv4/raw.c  line:842
```c
struct proto raw_prot = {
	.name		   = `"RAW"`,
	.owner		   = THIS_MODULE,
	.close		   = raw_close,
	.destroy	   = raw_destroy,
	.connect	   = ip4_datagram_connect,
	.disconnect	   = udp_disconnect,
	.ioctl		   = raw_ioctl,
	.init		   = raw_init,
	.setsockopt	   = raw_setsockopt,
	.getsockopt	   = raw_getsockopt,
	.sendmsg	   = raw_sendmsg,
	.recvmsg	   = raw_recvmsg,
	.`bind		   = raw_bind`,
	.backlog_rcv	   = raw_rcv_skb,
	.hash		   = raw_hash_sk,
	.unhash		   = raw_unhash_sk,
	.obj_size	   = sizeof(struct raw_sock),
	.h.raw_hash	   = &raw_v4_hashinfo,
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_raw_setsockopt,
	.compat_getsockopt = compat_raw_getsockopt,
#endif
};
```
　　通过以上tcp_prot、udp_prot和raw_prot发现，在tcp_prot和udp_prot不存在bind成员，而存在get_prot成员。raw_prot中存在bind成员。这也是inet_bind函数中判断`sk->sk_prot->bind`是否存在，存在则调用自身的bind函数。对于tcp和udp socket，inet_bind函数随后会调用`sk->sk_prot->get_port`即inet_csk_get_port（tcp）或udp_v4_get_port(udp);

### **4、inet_csk_get_port函数** ###
　　inet_csk_get_port函数为TCP套接字sk->sk_prot->get_port的赋值。
`inet_csk_get_port` 		// net/ipv4/tcp_ipv4.c line:2621
```c
/* Obtain a reference to a local port for the given sock,
 * if snum is zero it means select any available local port.
 */
int inet_csk_get_port(struct sock *sk, unsigned short snum)
{
	/*
	 * TCP散列表管理结构实例tcp_hashinfo,在tcp.c文件中tcp_init函数中进行初始化
	 * 工作，在tcp_ipv4.c文件中，struct proto tcp_prot结构体对其进行赋值
	 * .h.hasinfo=&tcp_hashinfo;
	 */
	struct inet_hashinfo *hashinfo = sk->sk_prot->h.hashinfo;
	struct `inet_bind_hashbucket` *head;
	struct hlist_node *node;
	struct inet_bind_bucket *tb;
	int ret, attempts = 5;
	struct net *net = sock_net(sk);
	int smallest_size = -1, smallest_rover;

	local_bh_disable();
	if (!snum) { //如果用户绑定端口为0，就选择一个可用的本地端口
		int remaining, rover, low, high;

again:
		`inet_get_local_port_range`(&low, &high); //获取本地可以使用的端口范围
		remaining = (high - low) + 1; //最大重新分配次数
		smallest_rover = rover = net_random() % remaining + low; // 随机生成端口号赋值给rover

		smallest_size = -1;
		/*
		 * while循环代码是根据获取到的空闲的端口号和bhash_size从bhash上取得HASH值对应
		 * 的链表，然后遍历链表，对比链表中是否有获取到的空闲端口，如果存在该端口，说明
		 * 获取的该端口号已经被占用，如果已经被占用就将获取的+1,如果大于最大值，则从最
		 * 小值开始重新遍历端口列表，知道尝试成功次数为remaining
		 * 
		 */
		do {
			if (inet_is_reserved_local_port(rover)) //如果是保留端口直接寻找下一接口
				goto next_nolock;
			head = &hashinfo->bhash[inet_bhashfn(net, rover,
					hashinfo->bhash_size)];
			spin_lock(&head->lock);
			inet_bind_bucket_for_each(tb, node, &head->chain)
				if (net_eq(ib_net(tb), net) && tb->port == rover) {
					/* 
					 * 判断端口是否可以被复用，如果可以被复用即使在绑定表中，
*也优先使用可以复用的端口
					 */
					if (`tb`->fastreuse > 0 &&
					    sk->sk_reuse &&
					    sk->sk_state != TCP_LISTEN &&
					    (tb->num_owners < smallest_size || smallest_size == -1)) {
						smallest_size = tb->num_owners; //记录端口使用者的次数
						smallest_rover = rover;
						/*
						 * 如果绑定端口的个数大于端口的可用个数，就回判断是否绑定冲突
						 */
						if (atomic_read(&hashinfo->bsockets) > (high - low) + 1) {
							spin_unlock(&head->lock);
							snum = smallest_rover;
					goto have_snum;
						}
					}
					goto next;
				}
			break;
		next:
			spin_unlock(&head->lock);
		next_nolock:
			if (++rover > high)
				rover = low;
		} while (--remaining > 0);

		/* Exhausted local port range during search?  It is not
		 * possible for us to be holding one of the bind hash
		 * locks if this test triggers, because if 'remaining'
		 * drops to zero, we broke out of the do/while loop at
		 * the top level, not from the 'break;' statement.
		 */
		ret = 1;
		if (remaining <= 0) { //如果没有查找到，再给次机会
			if (smallest_size != -1) {
				snum = smallest_rover;
				goto have_snum;
			}
			goto fail;
		}
		/* OK, here is the one we will use.  HEAD is
		 * non-NULL and we hold it's mutex.
		 */
		snum = rover;  //找到绑定端口号
	} else {  //如果指定端口号，则在相应的链表中进行查询
have_snum:
		head = &hashinfo->bhash[inet_bhashfn(net, snum,
				hashinfo->bhash_size)];
		spin_lock(&head->lock);
		inet_bind_bucket_for_each(tb, node, &head->chain)
			if (net_eq(ib_net(tb), net) && tb->port == snum)
				goto tb_found;  // 在绑定表中查找，表示该端口已经绑定
	}
	tb = NULL;  //如果指定的端口在绑定表中没有发现，直接创建
	goto tb_not_found;
tb_found:
	if (!hlist_empty(&tb->owners)) {
		if (tb->fastreuse > 0 &&
		    sk->sk_reuse && sk->sk_state != TCP_LISTEN &&
		    smallest_size == -1) {
			goto success; 
		} else {
			ret = 1;
			if (`inet_csk(sk)->icsk_af_ops->bind_conflict`(sk, tb)) { // 调用inet_csk_bind_conflict 函数
				if (sk->sk_reuse && sk->sk_state != TCP_LISTEN &&
				    smallest_size != -1 && --attempts >= 0) {
					spin_unlock(&head->lock);
					goto again;
				}
				goto fail_unlock;
			}
		}
	}
tb_not_found:
	ret = 1; //如果在绑定表中没有发现，则创建
	if (!tb && (tb = `inet_bind_bucket_create`(hashinfo->bind_bucket_cachep,
					net, head, snum)) == NULL)
		goto fail_unlock;
	if (hlist_empty(&tb->owners)) { //如果没有绑定socket
		if (sk->sk_reuse && sk->sk_state != TCP_LISTEN) 
			tb->fastreuse = 1;
		else
			tb->fastreuse = 0;
	} else if (tb->fastreuse &&
		   (!sk->sk_reuse || sk->sk_state == TCP_LISTEN))
		tb->fastreuse = 0;
success: //如果成功找到一个可用的端口，添加到绑定表中
	if (!inet_csk(sk)->icsk_bind_hash)
		`inet_bind_hash`(sk, tb, snum); // 把当前的sock插入到woers
	WARN_ON(inet_csk(sk)->icsk_bind_hash != tb);
	ret = 0;

fail_unlock:
	spin_unlock(&head->lock);
fail:
	local_bh_enable();
	return ret;
}
```
#### **4.1、inet_get_local_port_range函数** ####
`inet_get_local_port_range`  //  net/ipv4/inet_connection_sock.c 		line:43
```c
void inet_get_local_port_range(int *low, int *high)
{
	unsigned seq;
	do {
		seq = read_seqbegin(&sysctl_local_ports.lock);

		*low = sysctl_local_ports.range[0];
		*high = sysctl_local_ports.range[1];
	} while (read_seqretry(&sysctl_local_ports.lock, seq));
}

```
`sysctl_local_ports`	// net/ipv4/inet_connection_sock.c	line:35
```c
/*
 * This struct holds the first and last local port number.
 */
struct local_ports sysctl_local_ports __read_mostly = {
	.lock = SEQLOCK_UNLOCKED,
	.range = { 32768, 61000 },
};
```
　　inet_get_local_port_range()获取本地可用端口的范围，由sysctl_local_ports定义可以知道端口的范围为32768-61000。如果用户控件绑定的本地端口为0的话，会自动为套接字分配一个可以的端口。
#### **4.2、本地端口可以被复用的条件** ####

本地端口可以被复用的几个条件如下：
- 1、绑定到不同接口的Sockets可以复用本地端口
- 2、如果所有Sockets都设置sk->sk_reuse,并且都不在TCP_LISTEN状态，可以复用端口
- 3、如果所有Socket绑定在一个特定的inet_sk(sk)->rcv_saddr本地地址，并且地址都不相同，可以复用

`inet_bind_bucket`结构体  // include/net/inet_hashtables.h
```c
/* There are a few simple rules, which allow for local port reuse by
 * an application.  In essence:
 *
 *	1) Sockets bound to different interfaces may share a local port.
 *	   Failing that, goto test 2.
 *	2) If all sockets have sk->sk_reuse set, and none of them are in
 *	   TCP_LISTEN state, the port may be shared.
 *	   Failing that, goto test 3.
 *	3) If all sockets are bound to a specific inet_sk(sk)->rcv_saddr local
 *	   address, and none of them are the same, the port may be
 *	   shared.
 *	   Failing this, the port cannot be shared.
 *
 * The interesting point, is test #2.  This is what an FTP server does
 * all day.  To optimize this case we use a specific flag bit defined
 * below.  As we add sockets to a bind bucket list, we perform a
 * check of: (newsk->sk_reuse && (newsk->sk_state != TCP_LISTEN))
 * As long as all sockets added to a bind bucket pass this test,
 * the flag bit will be set.
 * The resulting situation is that tcp_v[46]_verify_bind() can just check
 * for this flag bit, if it is set and the socket trying to bind has
 * sk->sk_reuse set, we don't even have to walk the owners list at all,
 * we return that it is ok to bind this socket to the requested local port.
 *
 * Sounds like a lot of work, but it is worth it.  In a more naive
 * implementation (ie. current FreeBSD etc.) the entire list of ports
 * must be walked for each data port opened by an ftp server.  Needless
 * to say, this does not scale at all.  With a couple thousand FTP
 * users logged onto your box, isn't it nice to know that new data
 * ports are created in O(1) time?  I thought so. ;-)	-DaveM
 */
struct inet_bind_bucket {
#ifdef CONFIG_NET_NS
	struct net		*ib_net;
#endif
	unsigned short		port;
	signed short		fastreuse;
	int			num_owners;
	struct hlist_node	node;
	struct hlist_head	owners;
};
```
#### **4.3、inet_csk(sk)->icsk_af_ops->bind_conflict(sk, tb)调用** ####
`bind_conflict`赋值   // net/ipv4/tcp_ipv4.c  line:1825
```c
const struct inet_connection_sock_af_ops `ipv4_specific` = {
	.queue_xmit	   = ip_queue_xmit,
	.send_check	   = tcp_v4_send_check,
	.rebuild_header	   = inet_sk_rebuild_header,
	.conn_request	   = tcp_v4_conn_request,
	.syn_recv_sock	   = tcp_v4_syn_recv_sock,
	.remember_stamp	   = tcp_v4_remember_stamp,
	.net_header_len	   = sizeof(struct iphdr),
	.setsockopt	   = ip_setsockopt,
	.getsockopt	   = ip_getsockopt,
	.addr2sockaddr	   = inet_csk_addr2sockaddr,
	.sockaddr_len	   = sizeof(struct sockaddr_in),
	`.bind_conflict	   = inet_csk_bind_conflict`, 
#ifdef CONFIG_COMPAT
	.compat_setsockopt = compat_ip_setsockopt,
	.compat_getsockopt = compat_ip_getsockopt,
#endif
};
```
　　由[`第一章4.3节`](#wow1_4_3)中tcp_v4_init_sock函数可知ipv4_specific被赋值于icsk->icsk_af_ops = &ipv4_specific;而struct inet_connection_sock *icsk = inet_csk(sk);	代码如下：

`tcp_v4_init_sock`函数同第一章4.3节  // net/ipv4/tcp_ipv4.c	line:1857
```c
/* NOTE: A lot of things set to zero explicitly by call to
 *       sk_alloc() so need not be done here.
 */
static int tcp_v4_init_sock(struct sock *sk)
{
	struct inet_connection_sock `*icsk = inet_csk(sk)`; 
	struct tcp_sock *tp = tcp_sk(sk);

	skb_queue_head_init(&tp->out_of_order_queue);
	tcp_init_xmit_timers(sk);
	tcp_prequeue_init(tp);

	icsk->icsk_rto = TCP_TIMEOUT_INIT;
	tp->mdev = TCP_TIMEOUT_INIT;

	/* So many TCP implementations out there (incorrectly) count the
	 * initial SYN frame in their delayed-ACK and congestion control
	 * algorithms that we must have the following bandaid to talk
	 * efficiently to them.  -DaveM
	 */
	tp->snd_cwnd = 2;

	/* See draft-stevens-tcpca-spec-01 for discussion of the
	 * initialization of these values.
	 */
	tp->snd_ssthresh = TCP_INFINITE_SSTHRESH;
	tp->snd_cwnd_clamp = ~0;
	tp->mss_cache = TCP_MSS_DEFAULT;

	tp->reordering = sysctl_tcp_reordering;
	icsk->icsk_ca_ops = &tcp_init_congestion_ops;

	sk->sk_state = TCP_CLOSE;

	sk->sk_write_space = sk_stream_write_space;
	sock_set_flag(sk, SOCK_USE_WRITE_QUEUE);

	`icsk->icsk_af_ops = &ipv4_specific;`
	icsk->icsk_sync_mss = tcp_sync_mss;
#ifdef CONFIG_TCP_MD5SIG
	tp->af_specific = &tcp_sock_ipv4_specific;
#endif

	/* TCP Cookie Transactions */
	if (sysctl_tcp_cookie_size > 0) {
		/* Default, cookies without s_data_payload. */
		tp->cookie_values =
			kzalloc(sizeof(*tp->cookie_values),
				sk->sk_allocation);
		if (tp->cookie_values != NULL)
			kref_init(&tp->cookie_values->kref);
	}
	/* Presumed zeroed, in order of appearance:
	 *	cookie_in_always, cookie_out_never,
	 *	s_data_constant, s_data_in, s_data_out
	 */
	sk->sk_sndbuf = sysctl_tcp_wmem[1];
	sk->sk_rcvbuf = sysctl_tcp_rmem[1];

	local_bh_disable();
	percpu_counter_inc(&tcp_sockets_allocated);
	local_bh_enable();

	return 0;
}
```
　　由以上代码可知inet_csk(sk)->icsk_af_ops->bind_conflict(sk, tb)真正调用的为：inet_csk_bind_conflict函数。
　　inet_csk_bind_conflict 检查端口是否冲突，返回0表示可以绑定，不冲突，返回1表示无法绑定该端口。
`inet_csk_bind_conflict`函数 	// net/ipv4/inet_connection_sock.c	line:57
```c
int inet_csk_bind_conflict(const struct sock *sk,
			   const struct inet_bind_bucket *tb)
{
	const __be32 sk_rcv_saddr = inet_rcv_saddr(sk);
	struct sock *sk2;
	struct hlist_node *node;
	int reuse = sk->sk_reuse;

	/*
	 * Unlike other sk lookup places we do not check
	 * for sk_net here, since _all_ the socks listed
	 * in tb->owners list belong to the same net - the
	 * one this bucket belongs to.
	 */

	sk_for_each_bound(sk2, node, &tb->owners) {
		if (sk != sk2 &&
		    !inet_v6_ipv6only(sk2) &&
		    (!sk->sk_bound_dev_if ||
		     !sk2->sk_bound_dev_if ||
		     sk->sk_bound_dev_if == sk2->sk_bound_dev_if)) {
			if (!reuse || !sk2->sk_reuse ||
			    sk2->sk_state == TCP_LISTEN) {
				const __be32 sk2_rcv_saddr = inet_rcv_saddr(sk2);
				if (!sk2_rcv_saddr || !sk_rcv_saddr ||
				    sk2_rcv_saddr == sk_rcv_saddr)
					break;
			}
		}
	}
	return node != NULL;
}
```
#### **4.4、inet_bind_bucket_create** ####
　　inet_bind_bucket_create函数分配一个inet_bind_bucket结构体实例并进行初始化操作，然后绑定到已绑定端口的散列表中。
`inet_bind_bucket_create`函数	// net/ipv4/inet_hashtables.c 	line:33
```c
/*
 * Allocate and initialize a new local port bind bucket.
 * The bindhash mutex for snum's hash chain must be held here.
 */
struct inet_bind_bucket *inet_bind_bucket_create(struct kmem_cache *cachep,
						 struct net *net,
						 struct inet_bind_hashbucket *head,
						 const unsigned short snum)
{
	struct inet_bind_bucket *tb = kmem_cache_alloc(cachep, GFP_ATOMIC);

	if (tb != NULL) {
		write_pnet(&tb->ib_net, hold_net(net));
		tb->port      = snum;
		tb->fastreuse = 0;
		tb->num_owners = 0;
		INIT_HLIST_HEAD(&tb->owners);
		hlist_add_head(&tb->node, &head->chain);
	}
	return tb;
}
```
#### **4.5、inet_bind_hash** ####
　　inet_bind_hash函数更新变量
`inet_bind_hash`函数	// net/ipv4/inet_hashtables.c		line:63
```c
void inet_bind_hash(struct sock *sk, struct inet_bind_bucket *tb,
		    const unsigned short snum)
{
	struct inet_hashinfo *hashinfo = sk->sk_prot->h.hashinfo; //TCP散列表管理结构实例TCP_hashinfo

	atomic_inc(&hashinfo->bsockets); // 绑定次数加1

	inet_sk(sk)->inet_num = snum; //端口号赋值
	sk_add_bind_node(sk, &tb->owners); //把Socket加入到tb->owners的hash表中
	tb->num_owners++;  //端口绑定次数加1
	inet_csk(sk)->icsk_bind_hash = tb;
}
```

## **5、inet_hashinfo 结构体** ##
`inet_hashinfo`结构体 //include/net/inet_hashtables.h	line:118
```c
struct inet_hashinfo {
	/* This is for sockets with full identity only.  Sockets here will
	 * always be without wildcards and will have the following invariant:
	 *
	 *          TCP_ESTABLISHED <= sk->sk_state < TCP_CLOSE
	 *
	 * TIME_WAIT sockets use a separate chain (twchain).
	 */
	struct inet_ehash_bucket	*ehash;
	spinlock_t			*ehash_locks;
	unsigned int			ehash_mask;
	unsigned int			ehash_locks_mask;

	/* Ok, let's try this, I give up, we do need a local binding
	 * TCP hash as well as the others for fast bind/connect.
	 */
	struct inet_bind_hashbucket	*bhash;

	unsigned int			bhash_size;
	/* 4 bytes hole on 64 bit */

	struct kmem_cache		*bind_bucket_cachep;

	/* All the above members are written once at bootup and
	 * never written again _or_ are predominantly read-access.
	 *
	 * Now align to a new cache line as all the following members
	 * might be often dirty.
	 */
	/* All sockets in TCP_LISTEN state will be in here.  This is the only
	 * table where wildcard'd TCP sockets can exist.  Hash function here
	 * is just local port number.
	 */
	struct inet_listen_hashbucket	listening_hash[INET_LHTABLE_SIZE]
					____cacheline_aligned_in_smp;

	atomic_t			bsockets;
};
```
## **6、绑定bind代码流程图** ##

<div align="center">

![](/img/note_0b/06.png)
</div>

　　bind主要的主要是选择一个可用的端口号，如果用户没有指定端口号，则会按照一定的规则进行选择一个可用的端口号。
　　对于Google REUSEPORT 新特性，支持多个进程或者线程绑定到相同的 IP 和端口，以提高 server 的性能。
　　该特性实现了 IPv4/IPv6 下 TCP/UDP 协议的支持， 已经集成到 kernel 3.9 中。
　　核心的实现主要有三点：

　　-（1）扩展 socket option，增加 SO_REUSEPORT 选项，用来设置 reuseport。
　　-（2）修改 bind 系统调用实现，以便支持可以绑定到相同的 IP 和端口
　　-（3）修改处理新建连接的实现，查找 listener 的时候，能够支持在监听相同 IP 和端口的多个 sock 之间均衡选择。请参考： <u>[多个进程绑定相同端口的实现分析][6]</u>
　　参考资料：
　　　　<u>[Socket层实现系列 — bind()的实现][7]</u>
　　　　<u>[linux中绑定一个不存在的本地地址][8]</u>


## **三、监听listen** ##
　　`SYSCALL_DEFINE2(listen, int, fd, int, backlog)`函数，该函数主要是在用户空间使用listen系统调用函数进行调用执行，在Linux内核中的还是使用System call vectors实现
### **1、SYSCALL_DEFINE2(listen,...)** ###
SYSCALL_DEFINE2(`listen`, int, fd, int, backlog)	// net/socket.c		line:1422
```c
/*
 *	Perform a listen. Basically, we allow the protocol to do anything
 *	necessary for a listen, and if that works, we mark the socket as
 *	ready for listening.
 */

SYSCALL_DEFINE2(`listen`, int, fd, int, backlog)
{
	struct socket *sock;
	int err, fput_needed;
	int somaxconn; //表示socket监听（listen）的backlog上限

	sock = sockfd_lookup_light(fd, &err, &fput_needed); //通过文件描述符fd查找套接字sock
	if (sock) {
		/*
		 *   # cd /proc/sys/net/core
		 *   # cat somaxconn         128
		 *   这里默认时128，Hadoop集群时一般都会增大该值
		 */
		somaxconn = sock_net(sock->sk)->core.sysctl_somaxconn;
		/*
		 * 如果backlog值大于somaxconn,backlog就为somaxconn,也就是最大值不能大于
		 * somaxconn
		 */
		if ((unsigned)backlog > somaxconn) 
			backlog = somaxconn;

		err = security_socket_listen(sock, backlog);
         /*
          *  调用对于的socket层的listen函数，如果是TCP的话，inet_listen，根据
          *  net/ipv4/af_inet.c文件中，const struct proto_ops inet_stream_ops = {
          *                                .listen = inet_listen,};定义
          */
		if (!err)
			err = `sock->ops->listen`(sock, backlog);

		fput_light(sock->file, fput_needed);
	}
	return err;
}
```
### **2、backlog** ###
　　通过man listen对于backlog的解释
>　　The <u>backlog</u> argument defines the maximum length to which the queue of pending connections for <u>sockfd</u> may grow.  If a  connection  request  arrives　when the queue is full, the client may receive an error with an indication of `ECONNREFUSED` or, if the underlying protocol supports retransmission,　the request may be ignored so that a later reattempt at connection succeeds.
　　The  behavior of the <u>backlog</u> argument on TCP sockets changed with Linux 2.2.  Now it specifies the queue length for <u>completely</u> established sockets　waiting to be accepted, instead of the number of incomplete connection requests.  The maximum length of the queue for incomplete  sockets  can  be set  using  <u>/proc/sys/net/ipv4/tcp_max_syn_backlog</u>.   When  syncookies are enabled there is no logical maximum length and this setting is ignored.
　　See `tcp(7)` for more information.
　　If the <u>backlog</u> argument is greater than the value in <u>/proc/sys/net/core/somaxconn</u>, then it is silently truncated to that value; the default  value in this file is 128.  In kernels before 2.4.25, this limit was a hard coded value, SOMAXCONN, with the value 128.

　　上面的解释的大体意思为：从Linux2.2内核版本开始，backlog的行为发生了改变，现在该参数指定了等待accepted的全连接队列的长度。而不是半连接的请求的队列长度。全连接需要在完成三次握手之后。
　　半连接最大长度可以使用/proc/sys/net/ipv4/tcp_max_syn_backlog进行设置。这个默认值为cat /proc/sys/net/ipv4/tcp_max_syn_backlog
　　1024
　　当syncookies被设置后，该参数被忽略掉。如果backlog值大于/proc/sys/net/core/somaxconn,它将被截断，默认值为128。也就是 当传参backlog的值 >= somaxconn时，已完成连结队列的数量最多就是somaxconn

### **3、inet_listen** ###
　　该函数主要是做一些检查工作，例如当前连接的状态，sock的类型，最主要的处理在inet_csk_listen_start函数中。
`inet_listen`函数	// net/ipv4/af_inet.c	line:194
```c
/*
 *	Move a socket into listening state.
 */
int inet_listen(struct socket *sock, int backlog)
{
	struct sock *sk = sock->sk;
	unsigned char old_state;
	int err;

	lock_sock(sk);

	err = -EINVAL;
	/*
	 * 检查sock的状态是否为SS_UNCONNECTED,sock的类型是否为SOCK_STREAM,
	 *  只有SOCK_STREAM类型的sock才需要进行listen，建立socket后的初始状态为
	 *  SS_UNCONNECTED
	 */
	if (sock->state != SS_UNCONNECTED || sock->type != SOCK_STREAM)
		goto out;

	old_state = sk->sk_state;  // 获取sock的当前状态，后续要变成老状态
	/*
	 *  当前连接的状态需要CLOSED状态和LISTEN状态
	 */
	if (!((1 << old_state) & (TCPF_CLOSE | TCPF_LISTEN)))
		goto out;

	/* Really, if the socket is already in listen state
	 * we can only allow the backlog to be adjusted.
	 */
	/*
	 * 如果现在状态不是监听
	 */
	if (old_state != TCP_LISTEN) {
		err = `inet_csk_listen_start`(sk, backlog); //启用监听功能
		if (err)
			goto out;
	}
	/*
	 * 如果socket的状态已经处于监听状态，这里只是对backlog进行调整
	 */
	sk->sk_max_ack_backlog = backlog; 
	err = 0;

out:
	release_sock(sk);
	return err;
}
```
### **4、inet_csk_listen_start函数** ###
　　该函数使TCP传输控制块进入监听状态，实现监听的过程是：为管理连接请求的散列表分配存储空间，接着使TCP的sock状态迁移到LISTEN状态，然后将sock加入到监听散列表中。
`inet_csk_listen_start`函数  // net/ipv4/inet_connection_sock.c        line:645
```c
int inet_csk_listen_start(struct sock *sk, const int nr_table_entries)
{
	struct inet_sock *inet = inet_sk(sk);
	struct inet_connection_sock *icsk = inet_csk(sk);
     /*
      *  初始化全连接队列
      */
	int rc = `reqsk_queue_alloc`(&icsk->icsk_accept_queue, nr_table_entries); 
	if (rc != 0)
		return rc;

	sk->sk_max_ack_backlog = 0;  // 最大的全连接队列
	sk->sk_ack_backlog = 0;   // 当前的全连接队列
	inet_csk_delack_init(sk);

	/* There is race window here: we announce ourselves listening,
	 * but this transition is still not validated by get_port().
	 * It is OK, because this socket enters to hash table only
	 * after validation is complete.
	 */
	sk->sk_state = TCP_LISTEN;  // 设置现在的状态为TCP_LISTEN状态
	/* 
	 * 检查端口号是否可用，防止bind后修改
	 *  struct proto tcp_prot = {
	 *        .unhash = inet_unhash,
	 *        .get_port = inet_csk_get_port,}
	 *  调用get_port函数与bind时调用的是同一个函数如果正确返回为0，其中inet_num
	 *  就是bind的端口，如果没有绑定端口就进行绑定端口操作。
	 */
	if (!sk->sk_prot->get_port(sk, inet->inet_num)) {
		inet->inet_sport = htons(inet->inet_num);

		sk_dst_reset(sk);
		/*
		 *   把socket添加到监听HASH表中，strutc proto tcp_prot = {
		 *        .hash = inet_hash
		 *    }
		 */
		`sk->sk_prot->hash`(sk); 

		return 0;
	}

	sk->sk_state = TCP_CLOSE; //如果端口不再可用，设置socket的状态为TCP_CLOSE,并销毁全连接队列
	__reqsk_queue_destroy(&icsk->icsk_accept_queue);
	return -EADDRINUSE;
}
```
#### **4.1、reqsk_queue_alloc函数** ####
`reqsk_queue_aclloc`  // net/core/request_sock.c		line:37
```c
int reqsk_queue_alloc(struct request_sock_queue *queue,
		      unsigned int nr_table_entries)
{
	size_t lopt_size = sizeof(struct listen_sock);
	struct listen_sock *lopt;

	/*
	 *  这里nr_table_entries 最大值传进来时128，sysctl_max_backlog值为256，所以
	 *	这里最小值不会小于8，最大值不会大于128，在[8,128]之间
	 */
	nr_table_entries = min_t(u32, nr_table_entries, sysctl_max_syn_backlog);
	nr_table_entries = max_t(u32, nr_table_entries, 8);
	/* 
	 * 取一个最接近z^n的值赋给nr_table_entries
	 */
	nr_table_entries = roundup_pow_of_two(nr_table_entries + 1);
	lopt_size += nr_table_entries * sizeof(struct request_sock *); //确定队列大小
	if (lopt_size > PAGE_SIZE)
		lopt = __vmalloc(lopt_size,
			GFP_KERNEL | __GFP_HIGHMEM | __GFP_ZERO,
			PAGE_KERNEL);//如果申请得空间大于1页，则神奇虚拟地址空间连续
	else
		lopt = kzalloc(lopt_size, GFP_KERNEL);//小于1页，在常规内存中分配内存
	if (lopt == NULL)
		return -ENOMEM;

	/*
	 * for循环计算nr_table_entries已2为底的对数，计算结果就存储在max_qlen_log成员中，
	 * eg:如果nr_table_entries = 1024,max_qlen_log = 10
	 */
	for (lopt->max_qlen_log = 3; \
		(1 << lopt->max_qlen_log) < nr_table_entries; \
		lopt->max_qlen_log++);

	/*
	*上面的代码实际上是确认了半连接队列的长度，这个值还受系统配置sysctl_max_syn_backlog的
	 * 影响，所以如果想调大监听套接字的半连接队列，除了增大listen()的backlog参数外，还需要调整
	 * sysctl_max_syn_backlog系统配置的值，proc文件为 /proc/sys/net/ipv4/tcp_max_syn_backlog
	 */
	get_random_bytes(&lopt->hash_rnd, sizeof(lopt->hash_rnd));  //得到一个随机数，用于HASH
	rwlock_init(&queue->syn_wait_lock);
	queue->rskq_accept_head = NULL; //全连接队列置为空
	lopt->nr_table_entries = nr_table_entries; //半连接队列的最大长度

	write_lock_bh(&queue->syn_wait_lock);
	queue->listen_opt = lopt; //初始化半连接队列，其实就是icsk_accept_queue.listen_opt->syn_table
	write_unlock_bh(&queue->syn_wait_lock);

	return 0;
}
```
#### **4.2、inet_hash函数** ####
`inet_hash`函数  // net/ipv4/inet_hashtables.c 		line:401
```c
void inet_hash(struct sock *sk)
{
	if (sk->sk_state != TCP_CLOSE) {
		local_bh_disable();
		`__inet_hash`(sk);
		local_bh_enable();
	}
}
```
```c
static void __inet_hash(struct sock *sk)
{
	struct inet_hashinfo *hashinfo = sk->sk_prot->h.hashinfo;
	struct inet_listen_hashbucket *ilb;

	if (sk->sk_state != TCP_LISTEN) { // socket不处于监听状态
		__inet_hash_nolisten(sk, NULL);
		return;
	}

	WARN_ON(!sk_unhashed(sk));
	/*
	 * 根据监听端口号，查找相对应的HASH
	 */
	ilb = &hashinfo->listening_hash[inet_sk_listen_hashfn(sk)];

	spin_lock(&ilb->lock);
	/*
	 * 把sock添加到监听HASH桶的头部，连接到sk->sk_nulls_node 
	 */
	__sk_nulls_add_node_rcu(sk, &ilb->head);
	sock_prot_inuse_add(sock_net(sk), sk->sk_prot, 1);
	spin_unlock(&ilb->lock);
}
```

### **5、监听listen代码流程图** ###

<div align="center">

![](/img/note_0b/07.png)
</div>

 - (1)listen初始化了半连接队列和全连接队列
 - (2)实现侦听，使TCP传输控制块的状态迁移到LISTEN状态，然后将传输控制块添加到侦听散列表中



[1]:http://blog.csdn.net/wangpengqi/article/details/9156083
[2]:http://www.cnblogs.com/image-eye/archive/2012/01/05/2313383.html
[3]:http://anders0913.iteye.com/blog/411986
[4]:http://blog.51cto.com/weiguozhihui/1585297
[5]:http://blog.51cto.com/weiguozhihui/1586777
[6]:http://blog.chinaunix.net/uid-10167808-id-3807060.html
[7]:https://blog.csdn.net/zhangskd/article/details/13631715
[8]:http://tsecer.blog.163.com/blog/static/1501817201281211321031
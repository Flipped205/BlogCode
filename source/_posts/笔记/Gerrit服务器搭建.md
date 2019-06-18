---
title: Gerrit服务器的搭建与使用
categories:
- 笔记
tags:
- Gerrit
other: note_09 
date: 2019-05-31 
---

## 一、前期准备 ##

### 1、java ###
```bash
sudo add-apt-repository ppa:openjdk-r/ppa

sudo apt-get update

sudo apt-get install openjdk-8-jdk
```

### 2、git ###
```bash
sudo apt-get install git
```

### 3、apache2 ###
```bash
sudo apt-get install apache2

sudo /etc/init.d/apach2 start  #是否可正常启动
```
### 4、下载gerrit ##
[gerrit.2.15.2百度盘][gerrit.2.15.2] 提取码：otlq 
[官方下载地址][官方]

## 二、搭建Gerrit ##
### 1、新建用户 ###
使用独立的账户，来配置gerrit
```bash
sudo adduser gerrit
```
将`gerrit`加入到`sudo`权限
```bash
sudo chmod 777 /etc/sudoers
sudo vim /etc/sudoers
```
添加下面一句
```bash
gerrit  ALL=(ALL:ALL)ALL
```

切换用户为`gerrit`
```bash
su gerrit
```

### 2、安装gerrit ###
```bash
java -jar gerrit.2.15.2.war init --batch --dev -d ~/gerrittest

```
出现`Starting Gerrit Code Review: OK`，表示`Gerrit`服务正在运行。

### 3、反向代理 ###
#### 3.1、修改gerrit配置 ####
`vim gerrittest/etc/gerrit.config`:
修改为以下内容
`192.168.40.130`为本机ip地址，通过`ifconfig`可查看
```sh
[gerrit]
    basePath = git
    serverId = c5447167-daf0-49e2-a79f-e154d0841461
    canonicalWebUrl = http://192.168.40.130:8081/  # 修改为ip:8081
[database]
    type = h2
    database = /home/gerrittest/gerrit/db/ReviewDB
[noteDb "changes"]
    disableReviewDb = true
    primaryStorage = note db
    read = true
    sequence = true
    write = true
[index]
    type = LUCENE
[auth]
    type = HTTP #DEVELOPMENT_BECOME_ANY_ACCOUNT # 修改为HTTP
[receive]
    enableSignedPush = false
[sendemail]
    smtpServer = localhost
[container]
    user = gerrittest
    javaHome = /usr/lib/jvm/java-8-oracle/jre
[sshd]
    listenAddress = *:29418
[httpd]
    listenUrl = proxy-http://192.168.40.130:8081/ # 修改proxy-http://ip:8081
[cache]
    directory = cache
[plugins]
    allowRemoteAdmin = true

```

#### 3.2 Apacge2配置 ####
需要使能必要的Apache2模块：
```sh
a2enmod proxy_http
a2dissite 000-default
a2enmod ssl          ; # 可选，HTTPS或SSL需要
```
`sudo vim /etc/apache2/apache2.conf`
最后面，添加一下内容：
```sh
<VirtualHost *:8080>
    ServerName 192.168.40.130
    ProxyRequests Off
    ProxyVia Off
    ProxyPreserveHost On
    <Proxy *>
        Require all granted
    </Proxy>

    <Location "/">
        AuthType Basic
        AuthName "Gerrit Code Review"
        Require valid-user
    AuthBasicProvider file
        AuthUserFile /etc/apache2/passwords
    </Location>

    AllowEncodedSlashes On
    ProxyPass /  http://192.168.40.130:8081/ nocanon
    ProxyPassReverse / http://192.168.40.130:8081/ nocanon

    ErrorLog /var/log/apache2/gerrit.error.log
    CustomLog /var/log/apache2/gerrit.access.log combined
</VirtualHost>
```
`sudo vim /etc/apache2/ports.conf`
添加：
```sh
Listen 8080
```

#### 3.3 设置Gerrit账户和密码####
```sh
sudo touch /etc/apache2/passwords
sudo htpasswd -b /etc/apache2/passwords admin 123456 # administrator
sudo htpasswd -b /etc/apache2/passwords gerrit1 123456 # general usr
```
启动gerrit & apache2
```sh
sudo ~/gerrittest/bin/gerrit.sh restart
sudo /etc/init.d/apache2 restart
```

### 4、使用Gerrit ###
使用浏览器登录`http:192.168.40.130:8080`
登录`admin`

登录成功后，该用户为管理员

#### 1、SSH登录 ###
```sh
cd 
ssh-keygen -t rsa   #生成ssk key 
cat ~/.ssh/id_rsa.pub  #查看ssh key
```
```sh
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDBlBpZtMRBI/O077EM0fqrhUrzCRP7yxLMrSfKXMO2BK5pb5ITnnyiEMdurxo31iD9uaF3y/+Yr/H8K4IRtBdHM4ZQseAqmz9Z/X7Q97PkrI8rwocIbs4BUSYap2j/lUzHGcRdzYGR/8XpXCSIwO4OFjsBJZluOKpuNNJUq8o5ZAS7NTQTi83JwgiKQrByuUYPpVqzgf6RGEI0lmesLxRNIbA5FMxfDuKyPIGPvuz4BRayREcwdkeBrJyKVgQf16lPlvJxzCOgnY01xsdCMXEF5Ri2MLYfysYlhehs+UCabLwmTi+Xpe3ioDOe6YnYx7QQzvi/YuXXew8SYwRGKxod gerrit@ubuntu
```
使用`其他`浏览器登录`gerrit1`账户
<div align="left">![](/img/note_08/01.png)</div>

验证ssh key是否配置成功
```sh
ssh gerrit1@192.168.40.130 -p 29418
```
出现下面内容表示成功：
```sh
 ****    Welcome to Gerrit Code Review    ****

  Hi gerrit1, you have successfully connected over SSH.

  Unfortunately, interactive shells are disabled.
  To clone a hosted Git repository, use:

  git clone ssh://gerrit1@192.168.40.130:29418/REPOSITORY_NAME.git

Connection to 192.168.40.130 closed.
```

#### 2、添加项目 ####
使用`admin`账户，在gerrit管理页面进行添加账户
<div align="left">![](/img/note_08/02.png)</div>

#### 3、代码修改 ####
拉取代码
```sh
mkdir code
cd code
git clone ssh://gerrit1@192.168.40.130:29418/demo
```
<div align="left">![](/img/note_08/03.png)</div>

更新git hooks
```sh
gitdir=$(git rev-parse --git-dir); scp -p -P 29418 gerrit1@192.168.40.130:hooks/commit-msg ${gitdir}/hooks/
```

```sh
echo  "init code">ReadMe.txt  # 创建新文件
git add ReadMe.txt  # 添加新文件
git commit -m "init code commit"
```
`git commit`出错，提示需要设置`user.email`,`user.name`这里需要注意，先设置`gerrit.config`的`sendemail`

```sh
vim ~/gerrittest/etc/gerrit.config
```
修改`sendemail`
```sh
[sendemail]
        enable = true
        smtpServer = smtp.163.com
        smtpServerPort = 465
        smtpEncryption = ssl
        smtpUser = 【邮箱账号】
        smtpPass = 【授权密码】  #授权密码
        sslVerify = false
        from = 【邮箱账号】
```

```sh
vim ~/gerrittest/etc/secure.config
```
添加`sendemail`
```sh
[sendemail]
        smtpPass = 【授权密码】
```

之后重启`gerrit`，`apache`
```sh
~/gerrittest/bin/gerrit.sh restart
/etc/init.d/apache2 restart
```

随后设置`gerrit1`的`user.email`,`user.name`
```sh
git config --global user.email "gerrit205@163.com"
git config --global user.name "gerrit1"
```

```sh
git commit
git push origin HEAD:refs/for/master
```
`git push`出现错误,这里需要`gerrit1`登录gerrit管理页面，设置`name`和`email`
<div align="left">![](/img/note_08/07.png)</div>
<div align="left">![](/img/note_08/08.png)</div>
随后会收到通过`gerrit.config`中添加的邮箱发送的邮件，复制收到的链接，在`gerrit1`所登录的浏览器，进行验证。随后就可看到上图中显示的邮箱。

随后通过`admin`将`gerrit1`添加到`Administrators`组:
<div align="left">![](/img/note_08/04.png)</div>

之后重新`git push`
```sh
git push origin HEAD:refs/for/master
```
成功如下：
```sh
Counting objects: 3, done.
Writing objects: 100% (3/3), 284 bytes | 0 bytes/s, done.
Total 3 (delta 0), reused 0 (delta 0)
remote: Processing changes: new: 1, done    
remote: 
remote: New Changes:
remote:   http://192.168.40.130:8081/#/c/demo/+/21 init code commit
remote: 
To ssh://gerrit1@192.168.40.130:29418/demo
 * [new branch]      HEAD -> refs/for/master
```

通过`gerrit1`进入gerrit管理页面
<div align="left">![](/img/note_08/05.png)</div>
<div align="left">![](/img/note_08/06.png)</div>
添加`Reviewers`
<div align="left">![](/img/note_08/09.png)</div>

`gerrit1`整个代码就提交完成了，剩下的就是Reviewers人员进行代码评审和入库。
这里是`admin`用户进行入库
<div align="left">![](/img/note_08/10.png)</div>
<div align="left">![](/img/note_08/11.png)</div>

整个代码就入库完成。

[gerrit.2.15.2]: https://pan.baidu.com/s/1GwVTqH_YVLO38_PYUpusXw 
[官方]: https://www.gerritcodereview.com/2.15.html
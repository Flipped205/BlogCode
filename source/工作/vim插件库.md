title: vim插件库
categories:
- 工作
tags:
- wim
other: work_10
date: 2018-09-04
---
你用VIM就不能不知道这个网站（不是很稳定，有时候需要翻墙）

http://vimawesome.com/

这个网站是干什么的？

> Vim Awesome is a directory of Vim plugins sourced from GitHub, Vim.org, and user submissions. Plugin usage data is extracted from dotfiles repos on GitHub.

 

最后记得用vundle来管理你的VIM插件

## **开发环境的搭建**
附件中有个压缩包，包含了我自己当前正在使用的开发环境。说白了，就是一些配置文件，如：vimrc的配置，tmux的配置，markdown的配置等等。这些配置也是之前steal from 欧神的，我个人觉得对于提高生产力还是挺有帮助的，有需要的同事可以安装一下，已经做到了比较好的自动化。
安装方法：
- １．随便在home目录下建立一个目录，如：dev_env
- ２．cd ~/dev_env
- ３．将dotfiles.tar拷贝到该目录下，tar xvf dotfiles.tar
- ４．cd dotfiles/
- ５．修改git/gitconfig文件如下user部分，替换成自己的名字就可以了
    [user]
    email = ming.xing@feixun.com.cn
    name = ming.xing
- 6．sudo apt-get install tmux//如果没有安装tmux，则执行该命令安装一下
- 7．./setup.sh　执行该文件就OK了

PS.需要注意的是，执行shell的过程中可能会从网上拉一些文件，要求是你的环境能上网，可以执行sudo apt-get install命令。
如果环境不能上网，大家可以自己根据shell的内容，自定义安装某些工具。
[dotfiles.tar][dotfiles.tar]

常用快捷键（根据如上配置完成）：

vim自身集成的快捷键有很多，在这里也不好一一列举，还是看别人分享的吧：http://www.cnblogs.com/tianyajuanke/archive/2012/04/25/2470002.html

下面有一些根据自己的配置，设置的一些快捷键，想到几个写几个，以后慢慢更新吧……

如果大家有用到上一个帖子里的配置的话，需要先对系统上的键盘快捷键做些设置如：

１．去掉系统自身的ALT快捷键的功能：

点击右上角设置按钮->打开system settings->Keyboard->Shortcuts
<div align="center">![](/img/work_10/01.png)</div>

鼠标移动到Key to show the HUD选项，敲击退格键（backspace)，值会变成Disabled.然后退出即可。

２．随便打开一个终端，点击左上角Terminal，下拉菜单中选择Preferences,去掉第二项“Enable mnemonics(xxxx……）”，如下图：
<div align="center">![](/img/work_10/02.png)</div>

PS.这各选项在不同的ubuntu版本中的位置可能会不一样。

F4:vim随便打开一个Ｃ文件，按下F4，会调出function list，如：
<div align="center">![](/img/work_10/03.png)</div>
跳转到左侧窗口，移动鼠标到相应的function，点击'o'即可跳转到相应的函数定义的地方。

F8:此时，按下F8，会调出当前目录下的目录树，如：

<div align="center">![](/img/work_10/04.png)</div>
将鼠标移动到'▸'上，键盘敲击o打开展开或折叠目录；鼠标移动到文件上，敲击ｏ会打开相应的文件。

CTRL+[h,j,k,l]：各窗口之间切换，[h,j,k,l]分别映射方向键[←，↓，↑，→]。PS.大家要强迫自己慢慢的适应这几个字母，而不是去按“上下左右”

VIM复制＆粘贴：

简单的复制和粘贴，通过y和p，以及各种衍生的组合键即可完成。这里介绍一下，如何从vim打开的文件，复制选中的内容到”系统的”剪切板（不是vim内置的buffer哦）：

1.复制：vim随便打开一个文件，通过v或者shift v等快捷键，选中想要复制的内容，按下【',' + 'y'】，即“逗号＋y”组合。此时buffer已经在系统剪切板中了。

2.粘贴：如果想要将系统剪贴板中的内容复制到terminal窗口下，或者其他vim打开的文件中，可以同时按下:CTRL+SHIFT+v组合键；粘贴到其他位置（如搜索引擎），直接CTRL+v即可

如果是实在万不得已，一定要用鼠标选中要复制的内容，也是有办法的：在鼠标选中要复制的内容前，按下shift键不松手就行了。（为什么变得复杂了？答：为了彻底抛弃鼠标！）

阅读代码相关的快捷键：

想要比较方便的在各个函数调用之间来回穿越，离不开cscope工具。

举例：可能会花大量的时间阅读某一块代码，如内核代码。

1：打TAG。进入kernel目录，执行cscope -Rb，完成后该目录下会多出个cscope.out文件
<div align="center">![](/img/work_10/05.png)</div>
2：打开一个文件，如drivers/gpio/gpio-xrx500.c，阅读到了285行，想要知道pinctrl_xrx500_get_range_size函数是如何实现的。鼠标移动到该函数上，按下CTRL+']'，即可跳转到函数定义处。（跳转到宏定义处，方法相同）
<div align="center">![](/img/work_10/06.png)</div>
跳转回来：CTRL+'t'。

3：如上图第296行，想要知道都有哪些地方调用了该函数。鼠标移动到该函数任意位置--->按下CTRL+'\'+c组合键---->出现函数调用列表---->选择对应数字即可打开

4：想要打开某个引用的头文件。将光标移动到该头文件的引用处----->按下按下CTRL+'\'+f组合键----->文件列表

tmux相关：

打开一个terminal，输入tmux命令即可进入tmux的shell环境

ALT + '='：可以创建多个tmux窗口,如上图中最下边的状态栏（中间）１,2,3---6

ALE+E＋’number'：ALE+E是tmux快捷建中的一个“前导键”（tmux默认前导键是CTRL+b，太不人性了，所以才有了上边对keyboard的设置），也就是说，绝大多数的tmux快捷键都要一个ALE+E开头，然后再加上一个功能键

<div align="center">![](/img/work_10/07.png)</div>

ALE+E执行完后，左下角会出现PREFIX（如左图）的阴影。接下来，就可以按下功能键了，如果此时按下"2"，则会打开第二个tmux pannel。

ALE+'w'：向前打开一个window

ALE+'q'：向后打开一个window

ALT+'\'：打开上一次打开的window

ALE+'x':删除当前pannel

ALT+'-':删除当前window

下边说明tmux快捷键的时候，统统用PRE代指“ALT+E”

在同一个tmux窗口下创建多个pannel的方法：

1.pannel上下分布：PRE+'_'，这里的'_'指下划线

2.pannel左右分布：PRE+'|'

3.
<div align="center">![](/img/work_10/08.png)</div>
如图：执行了PRE+'_'和PRE+'|'后，会把窗口分割成３各pannel。

跳转：假设当前光标在２号pannel

　　　跳转到１号pannel：PRE+k（↑）

　　　跳转到３号pannel：PRE+l（→）

　　　跳回来则进行相反的操作即可。

如果窗口较多，如：
<div align="center">![](/img/work_10/09.png)</div>
想要从９号调到１号的话，如果利用上面的方法，显然就太拙劣了。tmux提供了自然是提供了更方便的办法：

按下PRE+q后，tmux会对每一个pannel进行编号，此时按下数字几，就会跳转到相应的pannel。

删除当前的pannel：CTRL+d。暂时，我没有找到删掉“除当前pannel之外的其他pannel"的办法，有谁想到了，告诉我……

tmux复制＆粘贴：

PRE+'['：进入tmux的浏览模式下，此时的光标移动跟打开vim时一样，”↑↓←→“通用。光标移动到”leds-rb532.c“，点击'v'进入visual模式（跟vim一样），选中该字符串，点击'y'。此时会自动退出该浏览模式，字符串已经保存在了tmux相关buffer里。如：
<div align="center">![](/img/work_10/10.png)</div>

[dotfiles.tar]: file/work_10/dotfiles.tar
---
title: 使用Markdown撰写文档的解决方案
categories:
- 工作
tags:
- Markdown
other: work_06
date: 2018-08-03
---

## **1 前言**
最近看到有些人在用Markdown来写文档，所以这里分享一下我的解决方案。

介绍工具之前，我先谈谈对使用Markdown的优劣的思考：

**优势**

- 1. 轻量
    - 使用相对简单。随便打开一个文本编辑器你就可以开始干活了，也不像word有这么多的选项，减少你很多排版的时间。这里加了一个“相对”，原因是如果使用Markdown扩展的话，其实语法逐渐开始有一些复杂了。
    - 由于是纯文本的，有利于查看历史修订，有利于跟版本控制集成，便于维护。
    - 易于部署。除了渲染需要专门的工具，编辑和查看不依赖复杂的工具，甚至你不需要将Markdown渲染成html，也能完全看得懂
- 2. 由于轻量，让Markdown非常适合跟随代码，作为工程/模块的README
- 3. 算是一项技能。目前越来越多的地方支持类Markdown的标记语言，例如github、一些主流的RESTful API接口文档撰写工具（API Blueprint、swagger editor）、有道云笔记、锤子笔记以及我们之前用的代码评审工具phabricator等等

**劣势**
- 1. 标准Markdown语法太简单，不太好用，导致各种Markdown变体的产生，所以现在最大的问题就是没有标准。记得14年看到过一篇文章《Standard Flavored Markdown》，现在再去看看，发现进展并不是很顺利，看来Markdown离大一统还有很长的路要走orz
- 2. word和Markdown的学习曲线是刚好颠倒的，Markdown上手前需要了解的一些基础的语法，甚至是一些扩展语法，导致很多人一开始就是排斥的，这也导致Markdown并不适合大团队作为标准的文档格式，因为总有人（特别是非研发岗）用不好甚至是不会写Markdown，那么文档的传承和维护就成了大问题
- 3. 作图不方便，如果用visio之类的工具转成图片又不利于维护，所以除非你已经非常擅长画ascii图，否则尽量不要用Markdown来写复杂的文档
所以现在的我并不十分推崇将Markdown作为整个团队的文档标准，我更倾向于将它用在随代码的README以及一些非正式的文档中

## **2 vim插件**
我使用vim作为编辑器，编写Markdown文本时需要一些插件，插件均使用vundle来管理

### **2.1 gabrielelana/vim-Markdown**
**2.1.1 作用**
完善了vim的Markdown语法高亮，标准的Markdown的语法高亮早以无法满足大部分扩展Markdown语法，导致你用vim默认的 Markdown syntax 文件查看Markdown文本的时候经常会看到一些错误的高亮内容

<div align="center">![Markdown Preview](/img/work_06/01.gif)</div>

**2.1.2 vim配置**
```shell
Bundle 'gabrielelana/vim-Markdown'
let g:Markdown_enable_spell_checking = 0
let g:Markdown_enable_mappings = 0
```
### **2.2 iamcco/Markdown-preview.vim**
**2.2.1 作用**
能帮助那些初学Markdown的童鞋写文档，但要注意一点，这个工具的Markdown渲染器与我最终要使用的渲染器是不同的，所以语法有细微差别

**2.2.2 vim配置**
```shell
Bundle 'iamcco/Markdown-preview.vim'
```
### **2.3 jszakmeister/Markdown2ctags**
**2.3.1 作用**
需要配合ctag一起使用，让ctag识别Markdown文本中的标签

**2.3.2 vim配置**
```
" Markdown
Bundle 'jszakmeister/Markdown2ctags'
" Add support for Markdown files in tagbar.
let g:tagbar_type_Markdown = {
    \ 'ctagstype': 'Markdown',
    \ 'ctagsbin' : '/home/oyxy/.vim/bundle/Markdown2ctags/Markdown2ctags.py',
    \ 'ctagsargs' : '-f - --sort=yes',
    \ 'kinds' : [
        \ 's:sections',
        \ 'i:images'
    \ ],
    \ 'sro' : '|',
    \ 'kind2scope' : {
        \ 's' : 'section',
    \ },
    \ 'sort': 0,
\ }
```
注意示例配置中的路径要改一下

## **3 学习 pandoc Markdown 语法**
> pandoc是什么? pandoc is a universal document converter.
> 
> pandoc可以渲染很多类型的标记语言文档，Markdown只是其中一种。我看重它的原因有：
> - 它对Markdown的语法支持很全，支持多种主流Markdown变体（Markdown的语法扩展）
> - 开放了很多定制，所以非常灵活，能方便我实现完整的文档渲染方案
> - 支持图片的"self-contained"，能让包含图片的Markdown也能生成单一的html文件，极大地方便了发布

学习pandoc Markdown语法，需要阅读官方[手册][1]

## **4 使用我定制的模板和pandoc命令封装**
- 安装pandoc（附件是ubuntu 64bit的安装包，你也可以从 https://github.com/jgm/pandoc/releases 下载）

>【注意】一定不要使用apt-get安装pandoc，因为那个版本太老了，缺失一些重要特性

- 解压 xpandoc.tgz，并执行`install4ubuntu64.sh`一键加载环境

## **5 如何使用**
假如你的Markdown文件名为a.md，执行命令和结果如下，生成的a.html的文件即为最终文件，如果需要发布pdf的版本，可以直接用浏览器的打印功能
```shell
$ pandoc_md.sh a.md
converting a.md
pandoc -f markdown+ignore_line_breaks -t html a.md > a.html -c /home/xiongyi.ouyang/.pandoc/pandoc_css/ie7unnel.css -c /home/xiongyi.ouyang/.pandoc/pandoc_css/nav.css -c /home/xiongyi.ouyang/.pandoc/pandoc_css/tplink_accondion.css --toc --template=phicomm.html --number-sections --highlight-style=haddock --self-contained
output: create a.html
```
附件有两个示例文件，其中`a.md`即为本贴的Markdown源文件，供参考

[pandoc_MANUAL.pdf][pandoc_MANUAL.pdf]

[a.tgz][a.tgz]

[示例2.tgz][示例2.tgz]

[xpandoc.tgz][xpandoc.tgz]



[1]: http://pandoc.org/MANUAL.pdf
[pandoc_MANUAL.pdf]: /file/work_05/pandoc_MANUAL.pdf
[a.tgz]: /file/work_05/a.tgz
[示例2.tgz]: /file/work_05/示例2.tgz
[xpandoc.tgz]: /file/work_05/xpandoc.tgz
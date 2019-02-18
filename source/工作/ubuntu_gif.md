---
title: ubuntu下录屏＆gif制作教程
categories:
- 工作
tags:
- 录屏
- gif
other: work_07
date: 2018-08-03
---

## **安装所需软件**
- 安装屏幕录像器 kazam
```shell
sudo apt-get install kazam
```
- 安装mplayer，转换视频文件
```shell
sudo apt-get install mplayer
```
- 安装imagemagick
```shell
sudo apt-get install imagemagick
```
## **屏幕录制**
- 打开一个shell，执行cazam命令
出现如下窗口
<div align="center">![](/img/work_07/01.png)</div>

选中“Mouse cursor”，会把鼠标的运动轨迹也记录下来；其他的选项，见名知意，不多赘述
- 想要录制下敲代码的过程，只希望录制终端窗口
    - 1.选中“Window”选项卡。如：
    <div align="center">![](/img/work_07/02.png)</div>
    出现该画面后，鼠标点击一下terminal终端。那么后边就只会对终端窗口进行录制了。
    - 2.点击capture开始录制，会出现如下倒计时窗口：
    <div align="center">![](/img/work_07/03.png)</div>
    - 3.倒计时结束后自动进行录制。此时，你在终端下的动作都会被记录下来。
    - 4.当录制完成，想要终止录屏，则点击右上角摄像头图标，出现下拉菜单，选择finish即可。当然，如果选择pause，会暂停录制。
    <div align="center">![](/img/work_07/04.png)</div>
    - 5.结束录制后，出现如下弹窗
    <div align="center">![](/img/work_07/05.png)</div>
    - 6.点击continue，将录制的视频保存下来，如:
    <div align="center">![](/img/work_07/06.png)</div>

- 把录制下来的视频制作成gif动画
```shell
#将视频转换为图片们
mplayer -ao null test.avi -vo jpeg:outdir=./pics

#将图片们打包为gif,resize代表图片缩放比例
convert ./pics/*.jpg -resize 45% test.gif

#发现图片太大，压缩图片
convert test.gif -fuzz 10% -layers Optimize newTest.gif
```
这样，整个从录屏到制作gif过程就讲完了。为了简化大家的操作，我写了个脚本，对上述几条命令打了个包。在附件中，欢迎大家下载使用
[v2gif.sh][v2gif.sh]

[v2gif.sh]: /file/work_07/v2gif.sh
---
title: Git常用命令
categories:
- 工具
tags:
- linux工具
other: tools_01
---

> 安装Git

```shell
sudo apt-get install git
```

> 设置Git

```shell
git config --global user.name "username"
git config --global user.email "user@example.com"
```

> 仓库，提交代码

本地仓库
```shell
echo "# test" >> README.md
git init
git add README.md
git commit -m "first commit"
git remote add origin https://github.com/***/*.git
git push -u origin master
```


克隆远程仓库
```shell
git clone https://github.com/***/*.git
```

> 其他命令

创建分支
```shell
git checkout -b branch_a
```

切换为主分支
```shell
git checkout master
```

删除分支
```shell
git checkout -d branch_a
```


更新代码
```shell
git pull
```

查看修改文件状态
```shell
git status
```

查看修改内容
```shell
git diff filename
```



> 日志

查看仓库历史：
```shell
git log
```

要以每个提交一行的样式查看日志，你可以用：
```shell
git log --pretty=oneline
```

或者也许你想要看一个所有分支的 ASCII 艺术树，带有标签和分支名：
```shell
git log --graph --oneline --decorate --all
```

如果你只想看哪些文件改动过：
```shell
git log --name-status
```

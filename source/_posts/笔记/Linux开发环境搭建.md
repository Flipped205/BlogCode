---
title: Linux系统开发环境搭建
categories:
- 笔记
tags:
- samba
- ssh
- tmux
other: note_10 
date: 2019-06-18 
---

&emsp;&emsp;经常使用linux系统(Ubuntu),默认都会安装一些软件，方便开发。记录一下常用的一些软件配置和开发环境搭建。包括`samba`,`ssh`,`tmux`等

### 一、PS1 ###
修改`PS1`

```sh
vi ~/.bashrc
```
添加以下内容
```sh
PS1="╔║${debian_chroot:+($debian_chroot)}\[\033[1;35m\]\w\[\033[00m\]\n╚═>>"
```

### 二.vim,bundle ###
```sh
sudo apt-get install vim
sudo apt-get install git
sudo apt-get install ctags
git clone https://github.com/gmarik/vundle.git ~/.vim/bundle/Vundle.vim
```
新建文件`.vimrc`
```
vim ~/.vimrc
```
添加以下内容
```sh
set nu
set ts=4
set noexpandtab
%retab!
set list
set listchars=tab:>-,trail:-
set listchars=tab:>-,trail:-
set tags=tags;



" 定义快捷键的前缀，即<Leader>
let mapleader=";"

" 开启文件类型侦测
filetype on
" 根据侦测到不同类型加载对应插件
filetype plugin on
" 定义快捷键到行首和行尾
nmap LB 0
nmap LE $
" 设置快捷将选中文本块复制到系统剪贴板
vnoremap <Leader>y "+y
" 设置快捷键将系统剪贴板内容粘贴至vim
nmap <Leader>p "+p
" 定义快捷键关闭当前分割窗口
nmap <Leader>q :q<CR>
" 定义快捷键保存当前窗口内容
nmap <Leader>w :w<CR>
" 定义快捷键保存所有窗口内容并退出vim
nmap <Leader>WQ :wa<CR>:q<CR>
" 不做任何保存，直接退出
nmap <Leader>Q :qa!<CR>
" 依次遍历子窗口
nnoremap nw <C-W><C-W>
" 跳转至右方窗口
nnoremap <Leader>lw <C-W>l
" 跳转至左方窗口
nnoremap <Leader>hw <C-W>h
" 跳转至上方窗口
nnoremap <Leader>kw <C-W>k
" 跳转至下方窗口
nnoremap <Leader>jw <C-W>j
" 定义快捷键在结对符之间跳转
nmap <Leader>M %

" 开启实时搜索功能
set incsearch
" 搜索时大小写不敏感
set ignorecase
" 关闭兼容模式
set nocompatible
" vim 自身命令行模式智能补全
set wildmenu

" 将外部命令 wmctrl 控制窗口最大化的命令行参数封装成一个 vim 的函数
fun! ToggleFullscreen()
		call system("wmctrl -ir " . v:windowid . " -b toggle,fullscreen")
endf
" 全屏开/关快捷键
map <silent> <F11> :call ToggleFullscreen()<CR>
" 启动 vim 时自动全屏
autocmd VimEnter * call ToggleFullscreen()

"总是显示状态栏
set laststatus=2
" 显示光标当前位置
set ruler
" 高亮当前行/列
set cursorline
"set cursorcolumn
" 高亮显示搜索结果
set hlsearch

" 禁止折行
set nowrap

" 开启语法高亮功能
syntax enable
" 允许用指定语法高亮配色方案替换默认方案
syntax on

" 自适应不同语言的只能缩进
filetype indent on



" vundle 环境设置
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
" vundle管理的插件列表必须位于vundle#begin()和vundle#end()之间
call vundle#begin()

Plugin 'taglist.vim'
Bundle 'majutsushi/tagbar'
Plugin 'OmniCppComplete'
Plugin 'AutoComplPop'
Plugin 'a.vim'
Bundle 'gabrielelana/vim-Markdown'
Bundle 'iamcco/Markdown-preview.vim'
" Markdown
Bundle 'jszakmeister/Markdown2ctags'
" Add support for Markdown files in tagbar.
let g:tagbar_type_Markdown = {
    \ 'ctagstype': 'Markdown',
    \ 'ctagsbin' : '/home/***/.vim/bundle/Markdown2ctags/Markdown2ctags.py',
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


let g:Markdown_enable_spell_cheking=0
let g:Markdown_enable_mappings=0

" 插件列表结束
call vundle#end()
filetype plugin indent on

let Tlist_Show_One_File=1
let Tlist_Exit_OnlyWindow=1


" 设置tagbar使用的ctags的插件，必须要设置对
let g:tagbar_ctags_bin='/usr/bin/ctags'
" 设置tagbar的窗口宽度
let g:tagbar_width=30
" 设置tagbar的窗口显示的位置，为右边
let g:tagbar_left=1
" 打开文件自动 打开tagbar
autocmd BufReadPost *.cpp,*.c,*.h,*.hpp,*.cc,*.cxx call tagbar#autoopen()

set nocompatible
set backspace=indent,eol,start
set completeopt=longest,menu

" 头文件/源文件切换 
nnoremap <silent> <F12> :A<CR>
" 切换至光标所在文件
nnoremap <silent> <F11> :IHV<CR> 

autocmd BufWritePost $MYVIMRC source $MYVIMRC

set nopaste
set noautoindent
set nosmartindent
```
随后使用安装插件
```sh
vim
:BundleInstall
```
### 三、tmux ###
```sh
sudo apt-get install tmux
vim ~/.tmux.conf
```
添加以下内容
```sh
######################
# general
######################
set -g xterm-keys on
set -g display-panes-time 3000
set -g base-index 1
set -g pane-base-index 1
set -g mouse-resize-pane on
set -g mouse-select-pane on
set -g mouse-select-window on
set -g pane-active-border-fg white
set -g pane-active-border-bg white
set -g pane-border-fg blue
set -g pane-border-bg black
setw -g mode-mouse on
bind r source-file ~/.tmux.conf \; display-message "Config reloaded..."
set -g renumber-windows on
set -g history-limit 20000

# it is terrible for using vim
set -g escape-time 0

######################
# status bar
######################
set -g status-position bottom
set -g status on
set -g status-bg colour103
set -g status-fg colour232
set -g status-key vi
set -g status-interval 1
set -g status-utf8 on
set -g status-justify "centre"
set -g status-left-length 60
set -g status-right-length 90
set -g status-left "#(~/.tmux-pl-src/powerline.sh left)"'#{?client_prefix,  #[reverse bold] PREFIX ,          }'
set -g status-right "#(~/.tmux-pl-src/powerline.sh right)"
setw -g window-status-current-bg colour15
setw -g window-status-current-fg colour124
setw -g window-status-current-attr italics,bold
setw -g window-status-current-format ' #I '
setw -g window-status-format ' #I '

######################
# vim
######################
setw -g mode-keys vi
bind -t vi-copy v begin-selection
bind -t vi-copy y copy-selection
bind -t vi-copy = end-of-line
bind -t vi-copy - start-of-line

######################
# general key map
######################
set -g repeat-time 1500
set -g prefix M-e
unbind-key C-b
bind M-e send-prefix
bind -n M-2 display-panes
bind -n M-3 command-prompt "select-window -t :'%%'"
bind -n M-Right next-window
bind -n M-Left previous-window
bind -n M-\ last-window
bind -n M-= new-window -c "#{pane_current_path}"
bind -n M-- kill-window
bind -n M-x kill-pane
bind -n M-c copy-mode
bind -n M-] paste-buffer
bind c new-windows -c "#{pane_current_path}"
bind _ split-window -v -c "#{pane_current_path}"
bind | split-window -h -c "#{pane_current_path}"
bind '"' select-layout tiled
bind -r h select-layout main-horizontal \; swap-pane -D
bind -r v select-layout main-vertical \; swap-pane -D
bind -n F1 save-buffer -b 0 ~/.sdbuf \; run "cat ~/.sdbuf | sdcv"

bind k select-pane -U           #选择上窗口
bind j select-pane -D           #选择下窗口
bind h select-pane -L           #选择左窗口
bind l select-pane -R           #选择右窗口


# rename window
setw -g automatic-rename on
set-window-option -g window-status-format '#[dim]#I:#[default]#W#[fg=grev,dim]'
set-window-option -g window-status-current-format '#[fg=red,bold]#I#[fg=red]:#[fg=red]#W#[fg=dim]'

#List of plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'

# tmux-resurrect
set -g @resurrect-save-bash-history 'on'
set -g @resurrect-capture-pane-contents 'on'
set -g @resurrect-strategy-vim 'session'

set -g @resurrect-save 'S'
set -g @resurrect-restore 'R'
#Initialize TMUX plugin manager (keep this line at the bottom)

bind K kill-server

run '~/.tmux/plugins/tpm/tpm'

```
`tmux`常用操作
```sh
alt+e  #快捷前缀 prefix
prefix new #新建会话
prefix s #列出会话，切换会话
prefix $ #重命名会话
prefix | #分割窗口
prefix c #新建窗口
prefix num #切换窗口
prefix , #重命名窗口
exit #退出
```
其他快捷键，查看配置
### 四、samba,ssh ###
```sh
sudo apt-get install samba samba-common
sudo vim /etc/samba/smb.conf
```
添加以下内容
```sh
[test]
  path = /home/test
  valid users = test
  browseable = yes
  writable = yes
  public = no
```
为此用户`test`设置密码
```sh
sudo smbpasswd -a test
```
重启服务器
```sh
sudo /etc/init.d/samba restart
```
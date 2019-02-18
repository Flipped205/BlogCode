#!/bin/bash

set -e

fini(){
    log "Aborted!"
    trap - EXIT
    exit 0
}

log(){
    echo "[@] $@"
}

trap fini EXIT INT TERM

if [[ -z $1 ]]; then
    echo "Arg 1 need source video full path name. e.g. /home/chong.zhao/Videos/test.avi"
    exit 1
fi
videopath=$1

targetpath="$1"".gif"

#将视频转换为图片们
mplayer -ao null $videopath -vo jpeg:outdir=/tmp/pics

#将图片们打包为gif,resize代表图片缩放比例
convert /tmp/pics/*.jpg -resize 45% /tmp/tmp.gif

#压缩图片
convert /tmp/tmp.gif -fuzz 10% -layers Optimize $targetpath

#只保留最终产物
rm -rf /tmp/pics $videopath

trap - EXIT
log "Done!"

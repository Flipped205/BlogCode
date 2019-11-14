---
title: Luci配置界面开发框架
categories:
- 前端
tags:
- Luci
other: web_01
date: 2018-05-24
updated: 2018-05-24
---

Luci配置界面开发框架

MVC:
> Model(/usr/lib/lua/luci/model/cbi)   
> Controller(/usr/lib/lua/luci/controller)  
> View()

```sh
/usr/sbin/uhttpd -f -h /www -r LEDE -x /cgi-bin -u /ubus -t 60 -T 30 -k 20 -A 1 -n 3 -N 100 -R -p 0.0.0.0:80 -p [::]:80
```

uhttpd是基于ubox ubus json-c的，如果加上ssl,还需要openssl库

## openwrt libubox：
libubox是openwrt新版本中的一个基础库，在openwrt中有很多应用程序是基于libubox开发的。（如uhttpd, linubus）。

### libubox:  
> - 提供一套基于事件驱动的机制  
> - 提供多种开发支持接口。（如链表、kv聊表、平衡查找二叉树、md5、json）

使用libubox开发的好处有如下几点：
> - 1、可以是程序基于事件驱动，从而可实现在单进程中处理多个任务
> - 2、基于libubox提供的开发API可以加快开发进度的同时提高程序的稳定性
> - 3、能更好的将程序融入openwrt的开发架构中，因为新的openwrt得很多应用和库都基于libubox开发的

## openwrt ubus
ubus是最新openwrt引入的一个消息总线，主要作用是实现不同应用程序之间的信息交互。  
ubus启动后会在后台运行ubusd进程，该进程监听一个unix套接字用于与其他应用程序通信。其他应用程序可基于libubox提供的接口（或自己实现）与其通信。

使用ubus的方式主要有：  
> - 1、向其注册消息或控制接口。  
> - 2、向其调用其他应用程序的消息或控制接口。  
> - 3、向其注册关心事件

[ubus (OpenWrt micro bus 架构)][1]


```
/usr/sbin/uhttpd -f -h /www -r LEDE -x /cgi-bin -u /ubus -t 60 -T 30 -k 20 -A 1 -n 3 -N 100 -R -p 0.0.0.0:80 -p [::]:80
```
## 1、Luci配置界面开发框架(Controller)
Controller定义模块的入口

```lua
module("luci.controller.控制器名",package.seeall)

function index()
        entry(路径,调用目标,_("显示名称"),显示顺序)
        end
```
>第一行说明了程序和模块的名称，eg:controller/目录下创建parentctrl.lua,那么久应该写成"luci.controller.parentctrl"。如果程序较多，可以分为好几个模块，那么可以在controller下再创建一个子目录，eg:controller/app/,那么就可以下城"luci.controller.app.parentctrl"。  

>entry表示一个模块的入口，官方给出entry的定义如下：  
`entry(path, target, title=nil, order=nil)`  
path为访问路径，路径按字符串数组给定的，eg:{"admin","more_set","parentctrl"},那么在浏览器里访问“http://192.168.2.1/cgi-bin/luci/admin/more_set/parentctrl” 来访问该脚本。  
- 第一种直接调用指定函数，比如直接重启路由器，eg:写成“`call("function_name")`”，然后又在Lua文件中编写名为function_name的函数就可以调用了。
- 第二种可以访问指定页面，eg:“`template("pc/parentctrl")`”就可以调用/usr/lib/lua/luci/view/pc/parentctrl.html。
- 配置界面，第三种方法无非最方便的，eg:“`cbi("app/parentctrl")`”就可以调用/usr/lib/lua/luci/model/cbi/app/parentctrl.lua。

eg:创建/usr/lib/lua/luci/controller/njitclient.lua
```lua 
module("luci.controller.njitclient",package.seeall)

function index()
    entry({"admin", "network", "njitclient"}, cbi("njitclient") , _("NJITClient"), 100)
    end
```

## 2、用Lua和UCI接口开发LuCI配置模块(Model)
功能描述：希望将用户名、密码等信息存储在路由器文件中，同时路由器开机时能根据设定的配置自动运行njitclient,同时希望动态的禁止和启用njitclient等等。所有最好的方式使用`CBI Module`,创建model文件，/usr/lib/lua/luci/model/cbi/njitclient.lua

开发LuCI的配置模块的有很多方式，比较基本的可以用SimpleForm，就跟开发普通的Web应用类似，当然最方便的还是使用UCI（Unified Configuration Interface,统一配置接口）的方式，因为使用UCI接口可以使得在LuCI中无需考虑配置文件如何存储和读取(这种方式也会自动创建“保存&应用”、“保存”以及“复位”三个按钮)。同时在Bash文件中也可以非常方便的存储和读取。

## 对于UCI方式

(1)、创建配置文件，存储于/etc/config。eg:`/etc/config/njitclient`
```sh
config login
    option username ''
    option password ''
    option ifname 'eth0'
    option domain ''
```
配置文件的编写参见[UCI系统文档][1]

(2)、然后在CBI Module的lua文件中首先需要映射与存储文件的关系
eg:
```Lua
m = Map(njitclient,"NJIT Client", Configure NJIT 802.11x client.")
```
m = Map("配置文件名","配置页面标题","配置页面说明")
> 第一个参数即为配置文件存储的文件名，不包含路径。  
> 第二个参数和第三个参数用于页面显示。

<div align="center">
<img src="/img/web_01/01.png" />
</div>

(3)、创建与配置文件中对应的`Section`，Section分两种，`NamedSection`和`TypedSection`前者根据配置文件中的Section名，后者根据配置文件中的Section类型。这里使用后者。代码如下，同时设置不允许增加或删除Section(".addremove=false"),以及不显示Section名称(".anonymous=true")。
```lua
s = m:section(TypedSection, "login", "")
s.addremove = false
s.anonymous = true
```
(4)、接下来创建Section中不同内容的交互（创建Option），常见的比如有Value(文本框)、ListValue(下拉框)、Flag(选择框)等等。详见官方参考文档[CBI][2]

创建Option的过程非常简单，创建后无需考虑读写配置问题，系统都会自动处理，但是根据上述的要求，我们在应用配置后希望启用、晋中或重启njitclient，所有我们需要在页面最后判断用户是否点击“应用”按钮，以及点击后的动作。  

```lua
local apply = luci.http.formvlaue("cbi.apply")
if apply then
    --[[
        需要处理的代码
    ]]--
end
```
model文件完整代码njitclient.lua
```lua
require("luci.sys")

m = Map("njitclient", translate("NJIT Client"), translate("Configure NJIT 802.11x Client"))

s = m:section(TypedSection, "login", "")
s.addremove = false
s.anonymous = true

enable = s:option(Flag,"enable", translate("Enable"))
name = s:option(Value, "username", translate("Username"))
pass = s:option(Value, "password", translate("Password"))
pass.password = true
domain = s:option(Value, "domain", translate("Domain"))

ifname = s:option(ListValue, "ifname", translate("Interface"))

for k, v in ipairs(luci.sys.net.devices()) do
    if v ~= "lo" then
        ifname:value(v)
    end
end

local apply = luci.http.formvalue("cbi.apply")
if apply the
    io.popen("/etc/init.d/njitclient restart")
end
return m
```
其中Luci全部库类的函数定义和使用说明，可以参考[Luci API][3]

## 3、Bash文件中调用UCI接口
接下来编写njitclient脚本，使得程序最终运行起来。关于UCI接口的脚本文档中官方参考资料[Configuration in scripts][4]

(1)、使用UCI调用脚本，第一步需要读取配置文件，命令为“`config_load 配置文件名`”。
```bash
config_load njitclient
```
(2)、接下来遍历配置中的Section，可以使用“`config_foreach 遍历函数名为Section类型`”。
```
config_foreach run_njit login
```
(3)、编写名为`run_njit`函数，在这个函数中，可以使用“`config_get 变量名 Section名 Section参数名`”获取变量的值，或者使用“`config_get_bool变量名 Section名 Section参数名`”获取布尔的值。

njitclient完整脚本如下

```lua
#!/bin/sh /etc/rc.common
START=50
run_njit()
{
    local enable
    config_get bool enable $1 enable

    if [$enable]; then
        local username
        local password
        local domain
        local ifname

        config_get username $1 username
        config_get password $1 password
        config_get domain $1 domain
        config_get ifname $1 ifname

        if [ "$domain" !="" ]; then
            njit-client $username@$domain $password $ifname &
        else 
            njit-client $username $password $ifname &
        fi

        echo "NJIT Client hase started."
}

start()
{
    config_load njitclient
    config_foreach run_njit login

}
stop()
{
    killall njit-client
    killall udhcpc

    echo "NJIT Client has stoped."
}
```

[1]: https://wiki.openwrt.org/zh-cn/doc/uci
[2]: http://luci.subsignal.org/trac/wiki/Documentation/CBI
[3]: http://luci.subsignal.org/api/luci/index.html
[4]: https://wiki.openwrt.org/doc/devel/config-scripting


openwrt uhttpd交互流程  
docroot 为/www   
```c
root@LEDE:/www# ls -l
drwxrwxr-x    2 root     root            27 Aug 12 00:12 cgi-bin
-rw-rw-r--    1 root     root           495 Aug 12 00:12 index.html
drwxrwxr-x    4 root     root            49 Aug 12 00:12 luci-static
```
(1)、默认index.html,该文件内容如下
```html
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Cache-Control" content="no-cache" />
        <meta http-equiv="refresh" content="0; URL=/cgi-bin/luci" />
    </head>
    <body style="background-color: white">
        <a style="color: black; font-family: arial, helvetica, sans-serif;" href="/cgi-bin/luci">LuCI - Lua Configuration Interface</a>
    </body>
</html>
```
默认跳转/cgi-bin/luci，注：luci该文件相对于docroot而言的路径，即相对于/www。
(2)、则实际路径为/www/cgi-bin/luci。该文件内容如下：
```lua
#!/usr/bin/lua  --执行命令的路径
require "luci.cacheloader"   --导入cacheloader包
require "luci.sgi.cgi"       --导入sgi.sgi包
luci.dispatcher.indexcache = "/tmp/luci-indexcache" --cache缓存路径地址
luci.sgi.cgi.run()  --执行run方法，此方法于/usr/lib/lua/luci/sgi/cgi.lua
```
(3)、cgi.lua文件内容 /usr/lib/lua/luci/sgi/cgi.lua   
[cgi.lua文件完整内容](#cgi)

代码解释：  
> 首先执行的是run()函数:

```lua
local r = luci.http.Request(...)   --把Web请求放于r中，（包括环境变量，web请求，出错处理接口）
```
>create出另一个执行体`httpdispatch`,每次httpdispatch执行yield返回一些数据时，run()函数读取这些数据，做相应处理，然后再次执行resume(httpdispatch),...如此直到httpdispatch执行完毕。

```lua
local x = coroutine.create(luci.dispatcher.httpdispatch)  --创建一个协同程序
local res, id, data1, data2 = coroutine.resume(x, r) --运行创建的协同进程，即运行httpdispatch，参数为上面的local r变量

if id == 1 then
    io.write("Status: " .. tostring(data1) .. " " .. data2 .. "\r\n")
elseif id == 2 then
    hcache = hcache .. data1 .. ": " .. data2 .. "\r\n"  --准备header
elseif id == 3 then    --写header 、blank
    io.write(hcache)   --默认到stdout
    io.write("\r\n")
elseif id == 4 then
    io.write(tostring(data1 or ""))  --写入body
elseif id == 5 then
    io.flush()
    io.close()
    active = false
elseif id == 6 then
    data1:copyz(nixio.stdout, data2)
    data1:close()
end

```
(4)、httpdispatch函数 /usr/lib/lua/luci/dispatcher.lua   
[dispatcher.lua文件完整代码](#dispatcher).

代码说明：整个代码主要关注一下函数
> 1、httpdispatch函数   

```lua
function httpdispatch(request, prefix)
    http.context.request = request

    local r = {}
    context.request = r

    local pathinfo = http.urldecode(request:getenv("PATH_INFO") or "", true)

    if prefix then
        for _, node in ipairs(prefix) do
            r[#r+1] = node
        end
    end

    for node in pathinfo:gmatch("[^/]+") do
        r[#r+1] = node
    end

    local stat, err = util.coxpcall(function()
        dispatch(context.request)
    end, error500)

    http.close()

    --context._disable_memtrace()
end
```
> 2、dispatch函数，

```lua
function dispatch(request)
    --context._disable_memtrace = require "luci.debug".trap_memtrace("l")
    local ctx = context
    ctx.path = request

    local conf = require "luci.config"
    assert(conf.main,
        "/etc/config/luci seems to be corrupt, unable to find section 'main'")

    local i18n = require "luci.i18n"
    local lang = conf.main.lang or "auto"
    if lang == "auto" then
        local aclang = http.getenv("HTTP_ACCEPT_LANGUAGE") or ""
        for lpat in aclang:gmatch("[%w-]+") do
            lpat = lpat and lpat:gsub("-", "_")
            if conf.languages[lpat] then
                lang = lpat
                break
            end
        end
    end
    if lang == "auto" then
        lang = i18n.default
    end
    i18n.setlanguage(lang)

    local c = ctx.tree
    local stat
    if not c then
        c = createtree()
    end

    local track = {}
    local args = {}
    ctx.args = args
    ctx.requestargs = ctx.requestargs or args
    local n
    local preq = {}
    local freq = {}

    for i, s in ipairs(request) do
        preq[#preq+1] = s
        freq[#freq+1] = s
        c = c.nodes[s]
        n = i
        if not c then
            break
        end

        util.update(track, c)

        if c.leaf then
            break
        end
    end

    if c and c.leaf then
        for j=n+1, #request do
            args[#args+1] = request[j]
            freq[#freq+1] = request[j]
        end
    end

    ctx.requestpath = ctx.requestpath or freq
    ctx.path = preq

    if track.i18n then
        i18n.loadc(track.i18n)
    end

    -- Init template engine
    if (c and c.index) or not track.notemplate then
        local tpl = require("luci.template")
        local media = track.mediaurlbase or luci.config.main.mediaurlbase
        if not pcall(tpl.Template, "themes/%s/header" % fs.basename(media)) then
            media = nil
            for name, theme in pairs(luci.config.themes) do
                if name:sub(1,1) ~= "." and pcall(tpl.Template,
                 "themes/%s/header" % fs.basename(theme)) then
                    media = theme
                end
            end
            assert(media, "No valid theme found")
        end

        local function _ifattr(cond, key, val)
            if cond then
                local env = getfenv(3)
                local scope = (type(env.self) == "table") and env.self
                if type(val) == "table" then
                    if not next(val) then
                        return ''
                    else
                        val = util.serialize_json(val)
                    end
                end
                return string.format(
                    ' %s="%s"', tostring(key),
                    util.pcdata(tostring( val
                     or (type(env[key]) ~= "function" and env[key])
                     or (scope and type(scope[key]) ~= "function" and scope[key])
                     or "" ))
                )
            else
                return ''
            end
        end

        tpl.context.viewns = setmetatable({
           write       = http.write;
           include     = function(name) tpl.Template(name):render(getfenv(2)) end;
           translate   = i18n.translate;
           translatef  = i18n.translatef;
           export      = function(k, v) if tpl.context.viewns[k] == nil then tpl.context.viewns[k] = v end end;
           striptags   = util.striptags;
           pcdata      = util.pcdata;
           media       = media;
           theme       = fs.basename(media);
           resource    = luci.config.main.resourcebase;
           ifattr      = function(...) return _ifattr(...) end;
           attr        = function(...) return _ifattr(true, ...) end;
           url         = build_url;
        }, {__index=function(table, key)
            if key == "controller" then
                return build_url()
            elseif key == "REQUEST_URI" then
                return build_url(unpack(ctx.requestpath))
            elseif key == "token" then
                return ctx.authtoken
            else
                return rawget(table, key) or _G[key]
            end
        end})
    end

    track.dependent = (track.dependent ~= false)
    assert(not track.dependent or not track.auto,
        "Access Violation\nThe page at '" .. table.concat(request, "/") .. "/' " ..
        "has no parent node so the access to this location has been denied.\n" ..
        "This is a software bug, please report this message at " ..
        "https://github.com/openwrt/luci/issues"
    )

    if track.sysauth then
        local authen = track.sysauth_authenticator
        local _, sid, sdat, default_user, allowed_users

        if type(authen) == "string" and authen ~= "htmlauth" then
            error500("Unsupported authenticator %q configured" % authen)
            return
        end

        if type(track.sysauth) == "table" then
            default_user, allowed_users = nil, track.sysauth
        else
            default_user, allowed_users = track.sysauth, { track.sysauth }
        end

        if type(authen) == "function" then
            _, sid = authen(sys.user.checkpasswd, allowed_users)
        else
            sid = http.getcookie("sysauth")
        end

        sid, sdat = session_retrieve(sid, allowed_users)

        if not (sid and sdat) and authen == "htmlauth" then
            local user = http.getenv("HTTP_AUTH_USER")
            local pass = http.getenv("HTTP_AUTH_PASS")

            if user == nil and pass == nil then
                user = http.formvalue("luci_username")
                pass = http.formvalue("luci_password")
            end

            sid, sdat = session_setup(user, pass, allowed_users)

            if not sid then
                local tmpl = require "luci.template"

                context.path = {}

                http.status(403, "Forbidden")
                tmpl.render(track.sysauth_template or "sysauth", {
                    duser = default_user,
                    fuser = user
                })

                return
            end

            http.header("Set-Cookie", 'sysauth=%s; path=%s' %{ sid, build_url() })
            http.redirect(build_url(unpack(ctx.requestpath)))
        end

        if not sid or not sdat then
            http.status(403, "Forbidden")
            return
        end

        ctx.authsession = sid
        ctx.authtoken = sdat.token
        ctx.authuser = sdat.username
    end

    if c and require_post_security(c.target) then
        if not test_post_security(c) then
            return
        end
    end

    if track.setgroup then
        sys.process.setgroup(track.setgroup)
    end

    if track.setuser then
        sys.process.setuser(track.setuser)
    end

    local target = nil
    if c then
        if type(c.target) == "function" then
            target = c.target
        elseif type(c.target) == "table" then
            target = c.target.target
        end
    end

    if c and (c.index or type(target) == "function") then
        ctx.dispatched = c
        ctx.requested = ctx.requested or ctx.dispatched
    end

    if c and c.index then
        local tpl = require "luci.template"

        if util.copcall(tpl.render, "indexer", {}) then
            return true
        end
    end

    if type(target) == "function" then
        util.copcall(function()
            local oldenv = getfenv(target)
            local module = require(c.module)
            local env = setmetatable({}, {__index=

            function(tbl, key)
                return rawget(tbl, key) or module[key] or oldenv[key]
            end})

            setfenv(target, env)
        end)

        local ok, err
        if type(c.target) == "table" then
            ok, err = util.copcall(target, c.target, unpack(args))
        else
            ok, err = util.copcall(target, unpack(args))
        end
        assert(ok,
               "Failed to execute " .. (type(c.target) == "function" and "function" or c.target.type or "unknown") ..
               " dispatcher target for entry '/" .. table.concat(request, "/") .. "'.\n" ..
               "The called action terminated with an exception:\n" .. tostring(err or "(unknown)"))
    else
        local root = node()
        if not root or not root.target then
            error404("No root node was registered, this usually happens if no module was installed.\n" ..
                     "Install luci-mod-admin-full and retry. " ..
                     "If the module is already installed, try removing the /tmp/luci-indexcache file.")
        else
            error404("No page is registered at '/" .. table.concat(request, "/") .. "'.\n" ..
                     "If this url belongs to an extension, make sure it is properly installed.\n" ..
                     "If the extension was recently installed, try removing the /tmp/luci-indexcache file.")
        end
    end
end
``` 


代码：

<div id="cgi">cgi.lua完整代码如下：</div>

```lua
-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Licensed to the public under the Apache License 2.0.

exectime = os.clock()
module("luci.sgi.cgi", package.seeall)
local ltn12 = require("luci.ltn12")
require("nixio.util")
require("luci.http")
require("luci.sys")
require("luci.dispatcher")

-- Limited source to avoid endless blocking
local function limitsource(handle, limit)
    limit = limit or 0
    local BLOCKSIZE = ltn12.BLOCKSIZE

    return function()
        if limit < 1 then
            handle:close()
            return nil
        else
            local read = (limit > BLOCKSIZE) and BLOCKSIZE or limit
            limit = limit - read

            local chunk = handle:read(read)
            if not chunk then handle:close() end
            return chunk
        end
    end
end

function run()
    local r = luci.http.Request(
        luci.sys.getenv(),
        limitsource(io.stdin, tonumber(luci.sys.getenv("CONTENT_LENGTH"))),
        ltn12.sink.file(io.stderr)
    )
    
    local x = coroutine.create(luci.dispatcher.httpdispatch)
    local hcache = ""
    local active = true
    
    while coroutine.status(x) ~= "dead" do
        local res, id, data1, data2 = coroutine.resume(x, r)

        if not res then
            print("Status: 500 Internal Server Error")
            print("Content-Type: text/plain\n")
            print(id)
            break;
        end

        if active then
            if id == 1 then
                io.write("Status: " .. tostring(data1) .. " " .. data2 .. "\r\n")
            elseif id == 2 then
                hcache = hcache .. data1 .. ": " .. data2 .. "\r\n"
            elseif id == 3 then
                io.write(hcache)
                io.write("\r\n")
            elseif id == 4 then
                io.write(tostring(data1 or ""))
            elseif id == 5 then
                io.flush()
                io.close()
                active = false
            elseif id == 6 then
                data1:copyz(nixio.stdout, data2)
                data1:close()
            end
        end
    end
end
```

<div id="dispatcher">dispatcher.lua完整代码如下：</div>

```lua
-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Copyright 2008-2015 Jo-Philipp Wich <jow@openwrt.org>
-- Licensed to the public under the Apache License 2.0.

local fs = require "nixio.fs"
local sys = require "luci.sys"
local util = require "luci.util"
local http = require "luci.http"
local nixio = require "nixio", require "nixio.util"

module("luci.dispatcher", package.seeall)
context = util.threadlocal()
uci = require "luci.model.uci"
i18n = require "luci.i18n"
_M.fs = fs

-- Index table
local index = nil

-- Fastindex
local fi


function build_url(...)
    local path = {...}
    local url = { http.getenv("SCRIPT_NAME") or "" }

    local p
    for _, p in ipairs(path) do
        if p:match("^[a-zA-Z0-9_%-%.%%/,;]+$") then
            url[#url+1] = "/"
            url[#url+1] = p
        end
    end

    if #path == 0 then
        url[#url+1] = "/"
    end

    return table.concat(url, "")
end

function node_visible(node)
   if node then
      return not (
         (not node.title or #node.title == 0) or
         (not node.target or node.hidden == true) or
         (type(node.target) == "table" and node.target.type == "firstchild" and
          (type(node.nodes) ~= "table" or not next(node.nodes)))
      )
   end
   return false
end

function node_childs(node)
    local rv = { }
    if node then
        local k, v
        for k, v in util.spairs(node.nodes,
            function(a, b)
                return (node.nodes[a].order or 100)
                     < (node.nodes[b].order or 100)
            end)
        do
            if node_visible(v) then
                rv[#rv+1] = k
            end
        end
    end
    return rv
end


function error404(message)
    http.status(404, "Not Found")
    message = message or "Not Found"

    require("luci.template")
    if not util.copcall(luci.template.render, "error404") then
        http.prepare_content("text/plain")
        http.write(message)
    end
    return false
end

function error500(message)
    util.perror(message)
    if not context.template_header_sent then
        http.status(500, "Internal Server Error")
        http.prepare_content("text/plain")
        http.write(message)
    else
        require("luci.template")
        if not util.copcall(luci.template.render, "error500", {message=message}) then
            http.prepare_content("text/plain")
            http.write(message)
        end
    end
    return false
end

function httpdispatch(request, prefix)
    http.context.request = request

    local r = {}
    context.request = r

    local pathinfo = http.urldecode(request:getenv("PATH_INFO") or "", true)

    if prefix then
        for _, node in ipairs(prefix) do
            r[#r+1] = node
        end
    end

    for node in pathinfo:gmatch("[^/]+") do
        r[#r+1] = node
    end

    local stat, err = util.coxpcall(function()
        dispatch(context.request)
    end, error500)

    http.close()

    --context._disable_memtrace()
end

local function require_post_security(target)
    if type(target) == "table" then
        if type(target.post) == "table" then
            local param_name, required_val, request_val

            for param_name, required_val in pairs(target.post) do
                request_val = http.formvalue(param_name)

                if (type(required_val) == "string" and
                    request_val ~= required_val) or
                   (required_val == true and
                    (request_val == nil or request_val == ""))
                then
                    return false
                end
            end

            return true
        end

        return (target.post == true)
    end

    return false
end

function test_post_security()
    if http.getenv("REQUEST_METHOD") ~= "POST" then
        http.status(405, "Method Not Allowed")
        http.header("Allow", "POST")
        return false
    end

    if http.formvalue("token") ~= context.authtoken then
        http.status(403, "Forbidden")
        luci.template.render("csrftoken")
        return false
    end

    return true
end

local function session_retrieve(sid, allowed_users)
    local sdat = util.ubus("session", "get", { ubus_rpc_session = sid })

    if type(sdat) == "table" and
       type(sdat.values) == "table" and
       type(sdat.values.token) == "string" and
       (not allowed_users or
        util.contains(allowed_users, sdat.values.username))
    then
        return sid, sdat.values
    end

    return nil, nil
end

local function session_setup(user, pass, allowed_users)
    if util.contains(allowed_users, user) then
        local login = util.ubus("session", "login", {
            username = user,
            password = pass,
            timeout  = tonumber(luci.config.sauth.sessiontime)
        })

        if type(login) == "table" and
           type(login.ubus_rpc_session) == "string"
        then
            util.ubus("session", "set", {
                ubus_rpc_session = login.ubus_rpc_session,
                values = { token = sys.uniqueid(16) }
            })

            return session_retrieve(login.ubus_rpc_session)
        end
    end

    return nil, nil
end

function dispatch(request)
    --context._disable_memtrace = require "luci.debug".trap_memtrace("l")
    local ctx = context
    ctx.path = request

    local conf = require "luci.config"
    assert(conf.main,
        "/etc/config/luci seems to be corrupt, unable to find section 'main'")

    local i18n = require "luci.i18n"
    local lang = conf.main.lang or "auto"
    if lang == "auto" then
        local aclang = http.getenv("HTTP_ACCEPT_LANGUAGE") or ""
        for lpat in aclang:gmatch("[%w-]+") do
            lpat = lpat and lpat:gsub("-", "_")
            if conf.languages[lpat] then
                lang = lpat
                break
            end
        end
    end
    if lang == "auto" then
        lang = i18n.default
    end
    i18n.setlanguage(lang)

    local c = ctx.tree
    local stat
    if not c then
        c = createtree()
    end

    local track = {}
    local args = {}
    ctx.args = args
    ctx.requestargs = ctx.requestargs or args
    local n
    local preq = {}
    local freq = {}

    for i, s in ipairs(request) do
        preq[#preq+1] = s
        freq[#freq+1] = s
        c = c.nodes[s]
        n = i
        if not c then
            break
        end

        util.update(track, c)

        if c.leaf then
            break
        end
    end

    if c and c.leaf then
        for j=n+1, #request do
            args[#args+1] = request[j]
            freq[#freq+1] = request[j]
        end
    end

    ctx.requestpath = ctx.requestpath or freq
    ctx.path = preq

    if track.i18n then
        i18n.loadc(track.i18n)
    end

    -- Init template engine
    if (c and c.index) or not track.notemplate then
        local tpl = require("luci.template")
        local media = track.mediaurlbase or luci.config.main.mediaurlbase
        if not pcall(tpl.Template, "themes/%s/header" % fs.basename(media)) then
            media = nil
            for name, theme in pairs(luci.config.themes) do
                if name:sub(1,1) ~= "." and pcall(tpl.Template,
                 "themes/%s/header" % fs.basename(theme)) then
                    media = theme
                end
            end
            assert(media, "No valid theme found")
        end

        local function _ifattr(cond, key, val)
            if cond then
                local env = getfenv(3)
                local scope = (type(env.self) == "table") and env.self
                if type(val) == "table" then
                    if not next(val) then
                        return ''
                    else
                        val = util.serialize_json(val)
                    end
                end
                return string.format(
                    ' %s="%s"', tostring(key),
                    util.pcdata(tostring( val
                     or (type(env[key]) ~= "function" and env[key])
                     or (scope and type(scope[key]) ~= "function" and scope[key])
                     or "" ))
                )
            else
                return ''
            end
        end

        tpl.context.viewns = setmetatable({
           write       = http.write;
           include     = function(name) tpl.Template(name):render(getfenv(2)) end;
           translate   = i18n.translate;
           translatef  = i18n.translatef;
           export      = function(k, v) if tpl.context.viewns[k] == nil then tpl.context.viewns[k] = v end end;
           striptags   = util.striptags;
           pcdata      = util.pcdata;
           media       = media;
           theme       = fs.basename(media);
           resource    = luci.config.main.resourcebase;
           ifattr      = function(...) return _ifattr(...) end;
           attr        = function(...) return _ifattr(true, ...) end;
           url         = build_url;
        }, {__index=function(table, key)
            if key == "controller" then
                return build_url()
            elseif key == "REQUEST_URI" then
                return build_url(unpack(ctx.requestpath))
            elseif key == "token" then
                return ctx.authtoken
            else
                return rawget(table, key) or _G[key]
            end
        end})
    end

    track.dependent = (track.dependent ~= false)
    assert(not track.dependent or not track.auto,
        "Access Violation\nThe page at '" .. table.concat(request, "/") .. "/' " ..
        "has no parent node so the access to this location has been denied.\n" ..
        "This is a software bug, please report this message at " ..
        "https://github.com/openwrt/luci/issues"
    )

    if track.sysauth then
        local authen = track.sysauth_authenticator
        local _, sid, sdat, default_user, allowed_users

        if type(authen) == "string" and authen ~= "htmlauth" then
            error500("Unsupported authenticator %q configured" % authen)
            return
        end

        if type(track.sysauth) == "table" then
            default_user, allowed_users = nil, track.sysauth
        else
            default_user, allowed_users = track.sysauth, { track.sysauth }
        end

        if type(authen) == "function" then
            _, sid = authen(sys.user.checkpasswd, allowed_users)
        else
            sid = http.getcookie("sysauth")
        end

        sid, sdat = session_retrieve(sid, allowed_users)

        if not (sid and sdat) and authen == "htmlauth" then
            local user = http.getenv("HTTP_AUTH_USER")
            local pass = http.getenv("HTTP_AUTH_PASS")

            if user == nil and pass == nil then
                user = http.formvalue("luci_username")
                pass = http.formvalue("luci_password")
            end

            sid, sdat = session_setup(user, pass, allowed_users)

            if not sid then
                local tmpl = require "luci.template"

                context.path = {}

                http.status(403, "Forbidden")
                tmpl.render(track.sysauth_template or "sysauth", {
                    duser = default_user,
                    fuser = user
                })

                return
            end

            http.header("Set-Cookie", 'sysauth=%s; path=%s' %{ sid, build_url() })
            http.redirect(build_url(unpack(ctx.requestpath)))
        end

        if not sid or not sdat then
            http.status(403, "Forbidden")
            return
        end

        ctx.authsession = sid
        ctx.authtoken = sdat.token
        ctx.authuser = sdat.username
    end

    if c and require_post_security(c.target) then
        if not test_post_security(c) then
            return
        end
    end

    if track.setgroup then
        sys.process.setgroup(track.setgroup)
    end

    if track.setuser then
        sys.process.setuser(track.setuser)
    end

    local target = nil
    if c then
        if type(c.target) == "function" then
            target = c.target
        elseif type(c.target) == "table" then
            target = c.target.target
        end
    end

    if c and (c.index or type(target) == "function") then
        ctx.dispatched = c
        ctx.requested = ctx.requested or ctx.dispatched
    end

    if c and c.index then
        local tpl = require "luci.template"

        if util.copcall(tpl.render, "indexer", {}) then
            return true
        end
    end

    if type(target) == "function" then
        util.copcall(function()
            local oldenv = getfenv(target)
            local module = require(c.module)
            local env = setmetatable({}, {__index=

            function(tbl, key)
                return rawget(tbl, key) or module[key] or oldenv[key]
            end})

            setfenv(target, env)
        end)

        local ok, err
        if type(c.target) == "table" then
            ok, err = util.copcall(target, c.target, unpack(args))
        else
            ok, err = util.copcall(target, unpack(args))
        end
        assert(ok,
               "Failed to execute " .. (type(c.target) == "function" and "function" or c.target.type or "unknown") ..
               " dispatcher target for entry '/" .. table.concat(request, "/") .. "'.\n" ..
               "The called action terminated with an exception:\n" .. tostring(err or "(unknown)"))
    else
        local root = node()
        if not root or not root.target then
            error404("No root node was registered, this usually happens if no module was installed.\n" ..
                     "Install luci-mod-admin-full and retry. " ..
                     "If the module is already installed, try removing the /tmp/luci-indexcache file.")
        else
            error404("No page is registered at '/" .. table.concat(request, "/") .. "'.\n" ..
                     "If this url belongs to an extension, make sure it is properly installed.\n" ..
                     "If the extension was recently installed, try removing the /tmp/luci-indexcache file.")
        end
    end
end

function createindex()
    local controllers = { }
    local base = "%s/controller/" % util.libpath()
    local _, path

    for path in (fs.glob("%s*.lua" % base) or function() end) do
        controllers[#controllers+1] = path
    end

    for path in (fs.glob("%s*/*.lua" % base) or function() end) do
        controllers[#controllers+1] = path
    end

    if indexcache then
        local cachedate = fs.stat(indexcache, "mtime")
        if cachedate then
            local realdate = 0
            for _, obj in ipairs(controllers) do
                local omtime = fs.stat(obj, "mtime")
                realdate = (omtime and omtime > realdate) and omtime or realdate
            end

            if cachedate > realdate and sys.process.info("uid") == 0 then
                assert(
                    sys.process.info("uid") == fs.stat(indexcache, "uid")
                    and fs.stat(indexcache, "modestr") == "rw-------",
                    "Fatal: Indexcache is not sane!"
                )

                index = loadfile(indexcache)()
                return index
            end
        end
    end

    index = {}

    for _, path in ipairs(controllers) do
        local modname = "luci.controller." .. path:sub(#base+1, #path-4):gsub("/", ".")
        local mod = require(modname)
        assert(mod ~= true,
               "Invalid controller file found\n" ..
               "The file '" .. path .. "' contains an invalid module line.\n" ..
               "Please verify whether the module name is set to '" .. modname ..
               "' - It must correspond to the file path!")

        local idx = mod.index
        assert(type(idx) == "function",
               "Invalid controller file found\n" ..
               "The file '" .. path .. "' contains no index() function.\n" ..
               "Please make sure that the controller contains a valid " ..
               "index function and verify the spelling!")

        index[modname] = idx
    end

    if indexcache then
        local f = nixio.open(indexcache, "w", 600)
        f:writeall(util.get_bytecode(index))
        f:close()
    end
end

-- Build the index before if it does not exist yet.
function createtree()
    if not index then
        createindex()
    end

    local ctx  = context
    local tree = {nodes={}, inreq=true}
    local modi = {}

    ctx.treecache = setmetatable({}, {__mode="v"})
    ctx.tree = tree
    ctx.modifiers = modi

    -- Load default translation
    require "luci.i18n".loadc("base")

    local scope = setmetatable({}, {__index = luci.dispatcher})

    for k, v in pairs(index) do
        scope._NAME = k
        setfenv(v, scope)
        v()
    end

    local function modisort(a,b)
        return modi[a].order < modi[b].order
    end

    for _, v in util.spairs(modi, modisort) do
        scope._NAME = v.module
        setfenv(v.func, scope)
        v.func()
    end

    return tree
end

function modifier(func, order)
    context.modifiers[#context.modifiers+1] = {
        func = func,
        order = order or 0,
        module
            = getfenv(2)._NAME
    }
end

function assign(path, clone, title, order)
    local obj  = node(unpack(path))
    obj.nodes  = nil
    obj.module = nil

    obj.title = title
    obj.order = order

    setmetatable(obj, {__index = _create_node(clone)})

    return obj
end

function entry(path, target, title, order)
    local c = node(unpack(path))

    c.target = target
    c.title  = title
    c.order  = order
    c.module = getfenv(2)._NAME

    return c
end

-- enabling the node.
function get(...)
    return _create_node({...})
end

function node(...)
    local c = _create_node({...})

    c.module = getfenv(2)._NAME
    c.auto = nil

    return c
end

function _create_node(path)
    if #path == 0 then
        return context.tree
    end

    local name = table.concat(path, ".")
    local c = context.treecache[name]

    if not c then
        local last = table.remove(path)
        local parent = _create_node(path)

        c = {nodes={}, auto=true}
        -- the node is "in request" if the request path matches
        -- at least up to the length of the node path
        if parent.inreq and context.path[#path+1] == last then
          c.inreq = true
        end
        parent.nodes[last] = c
        context.treecache[name] = c
    end
    return c
end

-- Subdispatchers --

function _firstchild()
   local path = { unpack(context.path) }
   local name = table.concat(path, ".")
   local node = context.treecache[name]

   local lowest
   if node and node.nodes and next(node.nodes) then
      local k, v
      for k, v in pairs(node.nodes) do
         if not lowest or
            (v.order or 100) < (node.nodes[lowest].order or 100)
         then
            lowest = k
         end
      end
   end

   assert(lowest ~= nil,
          "The requested node contains no childs, unable to redispatch")

   path[#path+1] = lowest
   dispatch(path)
end

function firstchild()
   return { type = "firstchild", target = _firstchild }
end

function alias(...)
    local req = {...}
    return function(...)
        for _, r in ipairs({...}) do
            req[#req+1] = r
        end

        dispatch(req)
    end
end

function rewrite(n, ...)
    local req = {...}
    return function(...)
        local dispatched = util.clone(context.dispatched)

        for i=1,n do
            table.remove(dispatched, 1)
        end

        for i, r in ipairs(req) do
            table.insert(dispatched, i, r)
        end

        for _, r in ipairs({...}) do
            dispatched[#dispatched+1] = r
        end

        dispatch(dispatched)
    end
end


local function _call(self, ...)
    local func = getfenv()[self.name]
    assert(func ~= nil,
           'Cannot resolve function "' .. self.name .. '". Is it misspelled or local?')

    assert(type(func) == "function",
           'The symbol "' .. self.name .. '" does not refer to a function but data ' ..
           'of type "' .. type(func) .. '".')

    if #self.argv > 0 then
        return func(unpack(self.argv), ...)
    else
        return func(...)
    end
end

function call(name, ...)
    return {type = "call", argv = {...}, name = name, target = _call}
end

function post_on(params, name, ...)
    return {
        type = "call",
        post = params,
        argv = { ... },
        name = name,
        target = _call
    }
end

function post(...)
    return post_on(true, ...)
end


local _template = function(self, ...)
    require "luci.template".render(self.view)
end

function template(name)
    return {type = "template", view = name, target = _template}
end


local function _cbi(self, ...)
    local cbi = require "luci.cbi"
    local tpl = require "luci.template"
    local http = require "luci.http"

    local config = self.config or {}
    local maps = cbi.load(self.model, ...)

    local state = nil

    for i, res in ipairs(maps) do
        res.flow = config
        local cstate = res:parse()
        if cstate and (not state or cstate < state) then
            state = cstate
        end
    end

    local function _resolve_path(path)
        return type(path) == "table" and build_url(unpack(path)) or path
    end

    if config.on_valid_to and state and state > 0 and state < 2 then
        http.redirect(_resolve_path(config.on_valid_to))
        return
    end

    if config.on_changed_to and state and state > 1 then
        http.redirect(_resolve_path(config.on_changed_to))
        return
    end

    if config.on_success_to and state and state > 0 then
        http.redirect(_resolve_path(config.on_success_to))
        return
    end

    if config.state_handler then
        if not config.state_handler(state, maps) then
            return
        end
    end

    http.header("X-CBI-State", state or 0)

    if not config.noheader then
        tpl.render("cbi/header", {state = state})
    end

    local redirect
    local messages
    local applymap   = false
    local pageaction = true
    local parsechain = { }

    for i, res in ipairs(maps) do
        if res.apply_needed and res.parsechain then
            local c
            for _, c in ipairs(res.parsechain) do
                parsechain[#parsechain+1] = c
            end
            applymap = true
        end

        if res.redirect then
            redirect = redirect or res.redirect
        end

        if res.pageaction == false then
            pageaction = false
        end

        if res.message then
            messages = messages or { }
            messages[#messages+1] = res.message
        end
    end

    for i, res in ipairs(maps) do
        res:render({
            firstmap   = (i == 1),
            applymap   = applymap,
            redirect   = redirect,
            messages   = messages,
            pageaction = pageaction,
            parsechain = parsechain
        })
    end

    if not config.nofooter then
        tpl.render("cbi/footer", {
            flow       = config,
            pageaction = pageaction,
            redirect   = redirect,
            state      = state,
            autoapply  = config.autoapply
        })
    end
end

function cbi(model, config)
    return {
        type = "cbi",
        post = { ["cbi.submit"] = "1" },
        config = config,
        model = model,
        target = _cbi
    }
end


local function _arcombine(self, ...)
    local argv = {...}
    local target = #argv > 0 and self.targets[2] or self.targets[1]
    setfenv(target.target, self.env)
    target:target(unpack(argv))
end

function arcombine(trg1, trg2)
    return {type = "arcombine", env = getfenv(), target = _arcombine, targets = {trg1, trg2}}
end


local function _form(self, ...)
    local cbi = require "luci.cbi"
    local tpl = require "luci.template"
    local http = require "luci.http"

    local maps = luci.cbi.load(self.model, ...)
    local state = nil

    for i, res in ipairs(maps) do
        local cstate = res:parse()
        if cstate and (not state or cstate < state) then
            state = cstate
        end
    end

    http.header("X-CBI-State", state or 0)
    tpl.render("header")
    for i, res in ipairs(maps) do
        res:render()
    end
    tpl.render("footer")
end

function form(model)
    return {
        type = "cbi",
        post = { ["cbi.submit"] = "1" },
        model = model,
        target = _form
    }
end

translate = i18n.translate

-- This function does not actually translate the given argument but
-- is used by build/i18n-scan.pl to find translatable entries.
function _(text)
    return text
end

```

[1]: https://wiki.openwrt.org/zh-cn/doc/techref/ubus
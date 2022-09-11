---
title: "Systemd部署多Filebeat以配置不同output"
excerpt: ""
date: "2022-6-16"
locale: "zh"
tags: [GCP, ELK, Linux]
ogImage: https://picsum.photos/500/300?random=1
coverImage: https://picsum.photos/800/300?random=1
---

**阅读前需要的基础知识**：会编写 Dockerfile 来构建 docker image



## 前情提要

一、目前的后端架构是 GLB(Google Load Balance) ←→ Nginx ←→backend，服务的监控是通过GCP（Google Cloud Platform）本身的Monitoring功能做的，包括接口服务可用性、各个`http_status` 占比，接口latency、等。但GLB产生的日志太多，Google的收费又贵，而检控业务又依赖这部分日志，于是考虑直接监控Nginx的日志实现以上功能。

二、考虑把监控业务从Google Monitoring上搬下来的另外一个原因是：GLB是云平台的服务，在这个级别上去做监控，大部分时候会看到GLB本身的波动（阈值调的比较低，500 error是0.01/s，当然也可以把阈值调高，不过这不是核心原因）。而当真正监控服务出问题时———是后端服务本身出了问题。那么这个时候我无论从后端的日志，Nginx的日志，都可以监控到错误。而如果仅仅是GLB出错，而Nginx以下的服务都没有问题，那么我除了干着急也没有什么办法（GLB也是服务，也会受到各种网络因素、硬件因素导致服务异常。用云就是这么操蛋，并且还没有赔偿（业务量不够不给赔））。综上看来，GLB层面的监控属实有点鸡肋，且耗钱

## 进入正题

目前后端的监控用的是FELKG（Filebeat、ElasticSearch、Logstash、Kibana、Grafana）

即用Filebeat抓取后端日志发送至Logstash，在Logstash通过判断不同tag以设置不同的index，再发送到ElasticSearch，通过Kibana做日志检索、排查问题，通过Grafana做监控告警。

filebeat监控后段日志配置如下：

```bash
filebeat.inputs:
- type: log
  enabled: true
  paths:
  - /data/log
  tail_files: true
  multiline.pattern: ^\w+\s\[
  multiline.negate: true
  multiline.match: after
  tags: ["xxxxxxx"]                     # 这里的tags，用于在LogStash配置不同索引

- type: log
  enabled: false
  tail_files: true
  paths:
   - /data/logs_to_es/data_collector_log
  tags: ["yyyyyyyy"]

output.logstash:
  hosts: ["10.142.15.249:5044"]

processors:
 - add_host_metadata:
    when.not.contains.tags: forwarded
 # - add_cloud_metadata: ~
 # - add_docker_metadata: ~
 # - add_kubernetes_metadata: ~
```

一开始考虑的是像上面一样直接当作log日志抓取并发送到LogStash，并且一个filebeat配置里可以同时添加多个input，但ES的mapping要自己重新写（类似MySQL建表时字段、字段类型等）。查阅了文档，Filebeat原生支持Nginx模块，启用模块之后，自动启用Nginx 日志到ES的mapping。

具体文档见[这里](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-nginx.html)

## 问题

在配置Filebeat Nginx Module的时候，需要把日志直接发送到ES，而filebeat不支持配置多输出（能支持多输入），经过一番探查，决定通过Systemd来部署多filebeat实例以配置不同的Output

## 开始

### 启用Nginx Module、Copy 目录

因为要启动的服务用的是同一个可执行文件（当时直接apt install安装的filebeat），所以需要在原来的filebeat里先启用Nginx Module，启用后会生成相应的配置文件在`/etc/filebeat/`下，再把整个配置目录复制到另外一个目录

```bash
# 查看支持的modules
filebeat modules list
# 启用nginx
filebeat modules enable nginx
#复制filebeat配置目录，并生成/etc/filebeat-nginx目录
cp -r /etc/filebeat{,-nginx}
```

> 插个嘴，安装了filebeat后默认的配置里是会有 `filebeat.config.modules`的相关配置的，我上面的配置是在部署时自动插入的配置，把`filebeat.config.modules`配置删掉了。不然在运行 `filebeat modules list` 时会出现 `Error in modules manager: modules management requires 'filebeat.config.modules.path' setting` 的`错误`
> 

### 添加systemd服务

配置里的各个参数就不细嗦了，具体可以百度，直接把原来安装filebeat时自动生成的配置拷贝过来，更改目录配置即可。

通过apt安装的filebeat的systemd conf在

```bash
/etc/systemd/system/multi-user.target.wants/filebeat.service
```

生成`/etc/systemd/system/filebeat-nginx.service` 文件

```bash
#/etc/systemd/system/filebeat-nginx.service
[Unit]
Description=Filebeat sends Nginx log files to ElasticSearch
Documentation=https://www.elastic.co/products/beats/filebeat
Wants=network-online.target
After=network-online.target

[Service]

Environment="BEAT_LOG_OPTS="
Environment="BEAT_CONFIG_OPTS=-c /etc/filebeat-nginx/filebeat.yml"
Environment="BEAT_PATH_OPTS=--path.home /usr/share/filebeat --path.config /etc/filebeat-nginx --path.data /var/lib/filebeat-nginx --path.logs /var/log/filebeat-nginx"
ExecStart=/usr/share/filebeat/bin/filebeat --environment systemd $BEAT_LOG_OPTS $BEAT_CONFIG_OPTS $BEAT_PATH_OPTS
Restart=always

[Install]
WantedBy=multi-user.target
```

### 添加filebeat配置文件

`/etc/filebeat-nginx/filebeat.yml`

```bash
filebeat.config.modules:
  # Glob pattern for configuration loading
  path: ${path.config}/modules.d/*.yml

  # Set to true to enable config reloading
  reload.enabled: false

  # Period on which files under path should be checked for changes
  #reload.period: 10s

setup.kibana:
    host: "http://10.142.15.248:5601"

output.elasticsearch:
    hosts: ["https://10.142.15.248:9200"]
    api_key: "XbnYfIIBDM3t3zqSBIWq:yOsvUit_Qvq0dJl0jzvxlA"
    ssl.verification_mode: "none"
    index: "nginx-%{+yyyy.MM.dd}"

setup.template.name: "nginx"             # 使用nginx模板，不需要自己手写mapping
setup.template.pattern: "nginx-%"        
setup.template.overwrite: true          # 此处有坑，但是忘了，最好填true
setup.template.enabled: false
setup.ilm.enabled: false
setup.template.settings:
  index.number_of_shards: 1

processors:
 - add_host_metadata:
    when.not.contains.tags: forwarded
```

### 启动

```bash
systemctl start filebeat-nginx
```

查看Kibana，这时候可以看到Nginx-*索引下有数据进来了

![Untitled](Systemd%E9%83%A8%E7%BD%B2%E5%A4%9AFilebeat%E4%BB%A5%E9%85%8D%E7%BD%AE%E4%B8%8D%E5%90%8Coutput%2021c3ced34b7340e2966c83f3434f67c5/Untitled.png)

## 坑点！！！！！！！

注意上图，这篇日志写的时间是晚上2022/08/31 21:29分，我从头到尾按照上面的顺序又跑了一遍，那为什么我这里的日志是2022/08/31日 08:00 开始呢？！！！

因为Filebeat Nginx Module 默认使用Nginx log的时间作为ES的 timestamp，也就是日志是什么时间点在ES里就是什么时间点。

又因为Kibana打开时默认时查看最近15分钟的日志，所以如果Nginx Log文件开头日志的时间点比较早的话，Filebeat需要挺长一段时间把一整天的数据全部抓取到ES。也就是当你把所有步骤都整明白之后，发现Kibana里最近15分钟没有数据，你会以为自己中间哪里搞错了！！！！（我查了半天TAT），这个时候只需要查看下 `/var/log/nginx/access.log`文件开头的时间点，然后再到Kibana里调宽些时间范围即可！！！！！！（我查了半天啊啊啊TAT）

参考文章 [https://www.jianshu.com/p/26ddc38fcb2d](https://www.jianshu.com/p/26ddc38fcb2d)
---
title: "GLB下部署的Sanic应用获取用户ip"
excerpt: ""
date: "2022-6-16"
locale: "zh"
tags: [GCP, Python, Linux, Sanic]
ogImage: https://picsum.photos/500/300?random=2
coverImage: https://picsum.photos/800/300?random=2
---

## 前情提要

最近要把给部署的机器都升级，从Debian9升级到Debian10. Debian9的默认python版本是python3.5，而Debian10的默认版本是python3.7，为了部署方便和日后升级，我把要部署的Sanic应用也从python3.5升级到python3.7了。

升级完之后，在测试的时候却发现，`request.remote_addr`不能像往常一样获取客户端IP了，经过一番折腾，终于搞定。



## 环境

我们的应用架构较为简单，GLB --> Nginx --> Sanic.

- GLB：`Google Load Balancing`. 谷歌的全球范围的负载均衡器，我们通过GLB，来进行路由转发、流量分发到相应的`backend`。每个`backend`是一个实例组，实例组下面有若干个VM实例(VM，既虚拟机)。

- Nginx：不多说。每个实例运行Nginx进行机器内部的负载均衡，把流量分发到机器内部的若干个Sanic进程

- Sanic：一个python高性能web异步框架，框架特性开箱即用，无需像Flask一样需要部署`Gunicone` 或者`uWISG`之类的Web Server。此时升级是从 `Sanic 19.3.1`升级到`Sanic==21.6.0`

#### Nginx 配置如下

  ```
      location / {
          proxy_pass_header Server;
          proxy_set_header Host $http_host;
          proxy_redirect off;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Scheme $scheme;
  
          real_ip_header    X-Forwarded-For;
          real_ip_recursive on;
          proxy_pass http://backend_hosts;
          proxy_http_version 1.1;
          proxy_set_header Connection "";
      }
  ```



## 源码解析

  查看Sanic源码，发现从 `Sanic 19.3.1`升级到`Sanic==21.6.0`后，`request.remote_addr`代码有所更改。

  ### remote_addr

  ```
  # Sanic 19.3.1
  @property
  def remote_addr(self):
      """Attempt to return the original client ip based on X-Forwarded-For.
      :return: original client ip.
      """
      if not hasattr(self, "_remote_addr"):
          forwarded_for = self.headers.get("X-Forwarded-For", "").split(",")
          remote_addrs = [
              addr
              for addr in [addr.strip() for addr in forwarded_for]
              if addr
          ]
          if len(remote_addrs) > 0:
              self._remote_addr = remote_addrs[0]
          else:
              self._remote_addr = ""
      return self._remote_addr
  ```

  ```
  # Sanic 21.6.0
      @property
      def remote_addr(self) -> str:
          """
          Client IP address, if available.
          1. proxied remote address `self.forwarded['for']`
          2. local remote address `self.ip`
  
          :return: IPv4, bracketed IPv6, UNIX socket name or arbitrary string
          :rtype: str
          """
          if not hasattr(self, "_remote_addr"):
              self._remote_addr = str(
                  self.forwarded.get("for", "")
              )  # or self.ip
          return self._remote_addr
  ```

  从源码看来，在`19.3.1`版本获取ip时，是直接从http header获取`X-Forwarded-For`字段，并且如果`X-Forwarded-For`里面存在多个ip，取第一个。而升级到了`21.6.0`的时候，则多了一些处理。

  ### forwarded

  ```
      @property
      def forwarded(self) -> Options:
          """
          Active proxy information obtained from request headers, as specified in
          Sanic configuration.
  
          Field names by, for, proto, host, port and path are normalized.
          - for and by IPv6 addresses are bracketed
          - port (int) is only set by port headers, not from host.
          - path is url-unencoded
  
          Additional values may be available from new style Forwarded headers.
  
          :return: forwarded address info
          :rtype: Dict[str, str]
          """
          if self.parsed_forwarded is None:
              self.parsed_forwarded = (
                  parse_forwarded(self.headers, self.app.config)      # 注释1
                  or parse_xforwarded(self.headers, self.app.config)  # 注释2
                  or {}
              )
          return self.parsed_forwarded
  ```

  注释1是从http header的`forwarded`字段解析， `forwarded`可以简单理解成`X-Forwarded-For, X-Forwarded-Host,X-Forwarded-Proto`的结合体，我们结合GLB下的使用，通过`X-Forwarded-For` 和`X-Real-Ip`获取客户端ip。

  ### parse_xforwarded

  ```
  def parse_xforwarded(headers, config) -> Optional[Options]:
      """Parse traditional proxy headers."""
      real_ip_header = config.REAL_IP_HEADER
      proxies_count = config.PROXIES_COUNT
      addr = real_ip_header and headers.getone(real_ip_header, None)
      if not addr and proxies_count:
          assert proxies_count > 0
          try:
              # Combine, split and filter multiple headers' entries
              forwarded_for = headers.getall(config.FORWARDED_FOR_HEADER)
              proxies = [
                  p
                  for p in (
                      p.strip() for h in forwarded_for for p in h.split(",")
                  )
                  if p
              ]
              addr = proxies[-proxies_count]
          except (KeyError, IndexError):
              pass
      # No processing of other headers if no address is found
      if not addr:
          return None
        
      def options():
          yield "for", addr
          for key, header in (
              ("proto", "x-scheme"),
              ("proto", "x-forwarded-proto"),  # Overrides X-Scheme if present
              ("host", "x-forwarded-host"),
              ("port", "x-forwarded-port"),
              ("path", "x-forwarded-path"),
          ):
              yield key, headers.getone(header, None)
  
      return fwd_normalize(options())
  ```

  看到这里突然发现多了`config.REAL_IP_HEADER`和`config.PROXIES_COUNT`这两个东西。到[官网](https://sanicframework.org/zh/guide/advanced/proxy-headers.html#转发头-forwarded-header)一看才发现，Sanic基于安全考虑，在后面升级的版本，也就是在`("19.3.1", "20.6.0")`这两个版本的中间的版本加入了这个功能：反向代理后的服务必须要设置如下一项或多项 [配置](https://sanicframework.org/zh/guide/deployment/configuration.html)， 才能正常获取用户ip，以防止一些恶意客户端可能会使用代理头来隐藏自己的 IP。

  - `FORWARDED_SECRET`

  - `REAL_IP_HEADER`

  - `PROXIES_COUNT`

## 测试

测试代码如下：
```
@app.route("/")
    async def index(request):
        logging.info(request.headers)
        logging.info(request.remote_addr)
        return sanic.response.text("Ok")
```

通过X-Forwarded-For获取,在启动参数加入以下

```
app.config.PROXIES_COUNT = 2
```

结果如下：


```
INFO [2021-11-28 11:15:07,597][16889][root] <Header('host': 'xxx.com', 'x-real-ip': '35.190.xx.xx','x-scheme': 'http', 'user-agent': 'curl/7.64.1', 'accept': '*/*',  'x-forwarded-for': '113.118.xxx.xxx, 35.190.xx.xx', 'x-forwarded-proto': 'https')>
INFO [2021-11-28 11:15:07,597][16889][root] 113.118.xxx.xxx
```

通过X-Real-IP获取,在启动参数加入以下

```
app.config.REAL_IP_HEADER = "X-Real-IP"
```

结果如下:
```
INFO [2021-11-28 11:35:36,176][18851][root] <Header('host': 'test.roiquery.com', 'x-real-ip': '35.190.xx.xx', 'x-scheme': 'http', 'user-agent': 'curl/7.64.1', 'accept': '*/*', 'x-cloud-trace-context': '62fee86592b6df1704b808585d1098b8/4774134022823104383', 'via': '1.1 google', 'x-forwarded-for': '113.118.x x x.xxx, 35.190.xxx.xxx', 'x-forwarded-proto': 'https')>
INFO [2021-11-28 11:35:36,176][18851][root] 35.190.xx.xx
```

发现问题，`request.remote_addr`获取到的ip是GLB的ip。为什么呢？

理解这个问题首先要知道Nginx配置里面的几个常用配置的含义

```
proxy_set_header X-Real-IP $remote_addr;
real_ip_header    X-Forwarded-For;                        
real_ip_recursive on;
```

- proxy_set_header X-Real-IP $remote_addr;
  
      $remote_addr表示Nginx获取到的用户ip，并把ip放到http header的`X-Real-IP`字段里，传到下一端。在我们的架构中，Nginx上一层是GLB
  
- real_ip_header X-Forwarded-For;
  
      是指从接收到报文的哪个http首部去获取前代理传送的用户ip。参考GLB文档，GLB会把客户端ip和GLB自身ip设置到http header的`X-Forwarded-For`里。
  
- real_ip_recursive on;
  ```
  If recursive search is disabled, the original client address that matches one of the trusted addresses is replaced by the last address sent in the request header field defined by the [real_ip_header](http://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_header) directive. If recursive search is enabled, the original client address that matches one of the trusted addresses is replaced by the last non-trusted address sent in the request header field.
  当real_ip_recursive为off时，nginx会把real_ip_header指定的HTTP头中的最后一个IP当成真实IP，当real_ip_recursive为on时,nginx会把real_ip_header指定的HTTP头中的最后一个不是信任服务器的IP当成真实IP。在我们的测试场景下，`X-Forwarded-For`值为'113.118.x x x.xxx, 35.190.xxx.xxx'。
  ```

那什么是信任服务器呢？这就得提到另外一个配置：`set_real_ip_from`

- set_real_ip_from
  ```
  Defines trusted addresses that are known to send correct replacement addresses.
    
  定义已知可发送正确替换地址的可信地址。有些拗口，大概的意思是告诉Nginx，这个配置的ip不是真正的用户ip，这个ip的服务器是信任的服务器。
  ```

也就是说，其实在我这次测试场景中，real_ip_recursive 不管是off还是on，最终获取的ip都是`35.190.xx.xx`。因为`35.190.xxx.xxx`是最后一个ip。而当我把以下配置加上

```
set_real_ip_from 35.190.00.00/16;
```
 最终结果如下
```
INFO [2021-11-28 12:10:41,205][16889][root] <Header('host': 'xxx.com', 'x-real-ip': '113.118.xxx.xxx','x-scheme': 'http', 'user-agent': 'curl/7.64.1', 'accept': '*/*',  'x-forwarded-for': '113.118.xxx.xxx, 35.190.xx.xx', 'x-forwarded-proto': 'https')>
INFO [2021-11-28 12:10:41,205][16889][root] 113.118.xxx.xxx
```

## 总结

获取ip的这个两种方式的区别就不说了，大伙儿按需选择，网上众说纷云，稍微查下就有答案。

参考链接：
    - [nginx经过多层代理后获取真实来源ip - chenjianwen - 博客园](https://www.cnblogs.com/chenjw-note/p/10785181.html)
    - https://cloud.google.com/load-balancing/docs/https
    - [Forwarded - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded)
    - [Module ngx_http_realip_module](http://nginx.org/en/docs/http/ngx_http_realip_module.html)

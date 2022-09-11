---
title: "Sanic中间件的一次使用以及浅复制的实际应用"
excerpt: ""
date: "2022-6-16"
locale: "zh"
tags: [Python, Sanic]
ogImage: https://picsum.photos/500/300?random=3
coverImage: https://picsum.photos/800/300?random=3
---
## 关于Sanic中间件的一次使用报错及debug

#### 前情提要

开发的接口有个需求，需要把传参内容里面的int型key的dict，改成str型key。由于接口已经写的七七八八，每个都重新改有点不现实，所以想着用一个中间件去做，刚好Sanic本身也有中间件。

> Sanic中间件的官方文档点[这里](https://sanic.readthedocs.io/en/19.03.1/sanic/middleware.html)



#### 中间件代码如下

```python
@app.middleware("request")
async def change_int_key_to_str(request):
    try:
        body = request.form
        item = body.get('props')
        if item:
            item = eval(item)
            if isinstance(item, dict):
                new_item = {}
                for k in item:
                    new_item[str(k)] = item[k]
                body['props'] = new_item
            elif isinstance(item, list):
                pass
            else:
                raise SyntaxError
        request.form = body 					 # 最开始的想法时改完参数再把原先的替换掉
    except Exception as e:
        print(traceback.format_exc())  # 输出捕捉的异常的traceback
```

由于部分字段在不同接口传的参数会有不同，所以做了`type`判定，以兼容所有接口。这里我用了`eval`，为了预防错误传参，如果既不是`dict`也不是`list`，就直接raise一个`SyntaxError`让except捕捉做异常处理。



#### 部分接口代码如下

```python
@app.route("/api/test", methods=['POST'])
async def test(request):
    body = request.form
    did = body.get("did")
    props = body.get("props")
    
```



#### POSTMAN传参如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210405014924533.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2hjY2gwMjA0,size_16,color_FFFFFF,t_70#pic_center)



#### 结果

果不其然：报错了，而且报错信息有点长。

```shell
[2021-04-04 15:07:31 +0800] [10829] [INFO] Starting worker [10829]
Traceback (most recent call last):
  File "/Users/vivi/Desktop/all_code/middleware_test.py", line 23, in change_int_key_to_str
    request.form = body
AttributeError: can't set attribute

[2021-04-04 15:07:33 +0800] [10829] [ERROR] Exception occurred while handling uri: 'http://localhost:8000/api/test'
Traceback (most recent call last):
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/site-packages/sanic/app.py", line 917, in handle_request
    response = await response
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/asyncio/coroutines.py", line 109, in __next__
    return self.gen.send(None)
  File "/Users/vivi/Desktop/all_code/middleware_test.py", line 32, in test
    props = body.get("props")
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/site-packages/sanic/request.py", line 46, in get
    return super().get(name, [default])[0]
KeyError: 0
[2021-04-04 15:07:33 +0800] - (sanic.access)[INFO][127.0.0.1:59727]: POST http://localhost:8000/api/test  500 273
```

我们先来看前半部分的`AttributeError: can't set attribute`，说明`request.form`没有`setter`方法。我们点进去看`request`的源码。

#### request.form以及RequestParameters源码

```python
    @property
    def form(self):
        if self.parsed_form is None:
            self.parsed_form = RequestParameters()     	
            self.parsed_files = RequestParameters()
            content_type = self.headers.get(					
                "Content-Type", DEFAULT_HTTP_CONTENT_TYPE	
            )
            content_type, parameters = parse_header(content_type)
            try:
                if content_type == "application/x-www-form-urlencoded":
                    self.parsed_form = RequestParameters(
                        parse_qs(self.body.decode("utf-8"))
                    )
                elif content_type == "multipart/form-data":
                    # TODO: Stream this instead of reading to/from memory
                    boundary = parameters["boundary"].encode("utf-8")
                    self.parsed_form, self.parsed_files = parse_multipart_form(
                        self.body, boundary
                    )
            except Exception:
                error_logger.exception("Failed when parsing form")

        return self.parsed_form
```

```python
class RequestParameters(dict):
    """Hosts a dict with lists as values where get returns the first
    value of the list and getlist returns the whole shebang
    """

    def get(self, name, default=None):
        """Return the first value, either the default or actual"""
        return super().get(name, [default])[0]

    def getlist(self, name, default=None):
        """Return the entire list"""
        return super().get(name, default)
```

可以看到：

- `request.form`方法使用了`@property`装饰器，做一个`getter`。

- 返回的`self.parsed_form`是一个`RequestParameters`对象，同时发现`RequestParameters`是`dict`的子类，封装了两个方法`get`、`getlist`。

- 根据请求的http头部信息，获取`content_type`，再由`content_type`的类型来用请求的body来对`RequestParameters`做一个初始化。这一点需要注意，**POSTMAN传的参数数据类型跟实际线上获取到的参数类型可能不一致，这个需要跟开发人员去协商沟通的。**

那么就很好处理了，`body = request.form`拿到的信息是经过处理的`RequestParameters`对象，我只要把我需要修改的字段做修改key类型处理之后，再放回去就行

#### 修改后的中间件代码如下

```python
@app.middleware("request")
async def change_int_key_to_str(request):
    try:
        body = request.form
        item = body.get('props')
        if item:
            item = eval(item)
            if isinstance(item, dict):
                new_item = {}
                for k in item:
                    new_item[str(k)] = item[k]
                body['props'] = new_item
            elif isinstance(item, list):
                pass
            else:
                raise SyntaxError
        request.parsed_form = body 		 # 这里换成parse_form
    except Exception as e:
        print(traceback.format_exc()) 
```

`request.parsed_form`设置完之后，后面的接口调用`request.form`就能直接返回。看这次的返回结果, 这次我们打印body信息：

```python
@app.route("/api/test", methods=['POST'])
async def test(request):
    body = request.form
    print(body)
    did = body.get("did")
    props = body.get("props")
    return response.json({"status": 200})
```

```shell
[2021-04-04 16:33:51 +0800] [11073] [INFO] Starting worker [11073]
{'did': ['test123'], 'props': {'1': [1, 3]}}
[2021-04-04 16:33:53 +0800] [11073] [ERROR] Exception occurred while handling uri: 'http://localhost:8000/api/test'
Traceback (most recent call last):
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/site-packages/sanic/app.py", line 917, in handle_request
    response = await response
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/asyncio/coroutines.py", line 109, in __next__
    return self.gen.send(None)
  File "/Users/vivi/Desktop/all_code/middleware_test.py", line 33, in test
    props = body.get("props")
  File "/Users/vivi/opt/miniconda3/envs/py35/lib/python3.5/site-packages/sanic/request.py", line 46, in get
    return super().get(name, [default])[0]
KeyError: 0
```

注意到在获取`body`内信息的时候，报了`KeyError`，再看我们上面po出来`RequestParameters`对象

```python
class RequestParameters(dict):
    """Hosts a dict with lists as values where get returns the first
    value of the list and getlist returns the whole shebang
    """

    def get(self, name, default=None):
        """Return the first value, either the default or actual"""
        return super().get(name, [default])[0]

    def getlist(self, name, default=None):
        """Return the entire list"""
        return super().get(name, default)
```

`RequestParameters`对象有两个方法，get和getlist，再看上面我们输出的body信息

```
{'did': ['test123'], 'props': {'1': [1, 3]}}
```

`props`对应的value是一个`dict`，而`did`对应的value是一个`list`，这里的结构封装是在`request.form`方法里面做的，而`RequestParameters`对象封装的`get`方法是返回第`list`里的第一个attribute, 而我传的参数是`dict`,。所以对于`props`，应该使用`getlist`方法。

改过来之后，输出正常了

```bash
[2021-04-05 01:00:45 +0800] [11374] [INFO] Starting worker [11374]
{'props': {'1': [1, 3]}, 'did': ['test123']}
[2021-04-05 01:00:49 +0800] - (sanic.access)[INFO][127.0.0.1:63045]: POST http://localhost:8000/api/test  200 14
```



## 浅复制在Sanic中间件中的实际应用

以上的代码是自己重新敲了个demo来做展示的，那么在debug这个demo的时候，突然发现有点不对劲，把源码看了一遍还是没找到问题，看这代码的时候突然就发现了自己忘记了一个重要的事情------**浅拷贝**

#### 代码如下

```python
@app.middleware("request")
async def change_int_key_to_str(request):
    try:
        body = request.form
        print("middleware body: ", body)
        item = body.get('props')
        if item:
            item = eval(item)
            if isinstance(item, dict):
                new_item = {}
                for k in item:
                    new_item[str(k)] = item[k]
                body['props'] = new_item
            elif isinstance(item, list):
                pass
            else:
                raise SyntaxError
    except Exception as e:
        print(traceback.format_exc())
        

@app.route("/api/test", methods=['POST'])
async def test(request):
    body = request.form
    print("interface body: ", body)
    did = body.get("did")
    props = body.getlist("props")
    return response.json({"status": 200})
```

跟上面代码不一样的是，我这里对`body`修改完了之后，并没有把`body`放回去。也就是说按照我的设想，我只是做了个本地修改，当这个中间件的生命周期结束的时候，`body`也就没有了。然而我还是能够打印到被修改后的数据，如下：

```shell
[2021-04-05 01:10:14 +0800] [11421] [INFO] Starting worker [11421]
middleware body:  {'did': ['test123'], 'props': ['{1: [1, 3]}']}
interface body:  {'did': ['test123'], 'props': {'1': [1, 3]}}
[2021-04-05 01:10:17 +0800] - (sanic.access)[INFO][127.0.0.1:63210]: POST http://localhost:8000/api/test  200 14
```

注意到，`props`里，key的类型已经从`int`型转换为`str`型。

看了一遍源码之后没找到问题，盯着`body = request.form`这行代码的时候才突然想起来，这是python的浅拷贝！！！----------- 我对`body`里面字段的属性做的修改，其实也就是对`request.form`做的修改。因为`body`只是`request.form`的一个引用。（TAT, 搞了好久才发现这个问题QAQ。）

同时又有一个新发现，`props`里的数据已经从一个`list`变成了`dict`，这是因为在中间件里做修改处理的时候，对`request.form`返回的 `RequestParameters`里存储的数据的默认类型做了修改。

当然也不必纠结做了修改的这件事，在接口里面把所有参数传递过来是`dict`的调用的方法`get`换成`getlist`就行。这里主要是意识到python的浅copy在实际上的应用场景，给自己做一个记录。



#### 关于浅拷贝

网上一堆解说，这里就不做赘叙了。
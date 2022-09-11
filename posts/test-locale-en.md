---
title: "locale en md test"
excerpt: "构建出的 docker image 往往不会在本机上使用。你往往会上传到公共的 registry，如 docker hub，或部署在内网的 registry， 如 harbor。在基础设施较为落后的开发环境中，你还有可能需要 save 到本地，然后传输给你的同事 / 服务器。 基于上述，为了更快的分发你构建的 image, 更小的 image size 是非常有必要的。"
date: "2022-6-15"
locale: "en"
tags: [docker, dockerfile, JavaScript, Rust, Next.js]
ogImage: https://picsum.photos/500/300?random=1
---

**阅读前需要的基础知识**：会编写 Dockerfile 来构建 docker image

## 为什么需要更小的 Docker image

构建出的 docker image 往往不会在本机上使用。你往往会上传到公共的 registry，如 docker hub，或部署在内网的 registry， 如 harbor。在基础设施较为落后的开发环境中，你还有可能需要 save 到本地，然后传输给你的同事 / 服务器。 基于上述，为了更快的分发你构建的 image, 更小的 image size 是非常有必要的。

## 基于 Alpine Linux 来构建

以 node.js 的 [docker image](https://hub.docker.com/_/node) 来举例子，你在为一个 node.js 程序编写 Dockerfile 时，可能会在第一行写下 `FROM node:18` 。 `FROM node:18` 是不会产生心理负担的选项，可以在你初学 docker，或者不想把过多的注意力放在 docker 上时使用。但是如果你阅读了 node.js 这个 image 在 docker hub 上的[主页](https://hub.docker.com/_/node)中 Image Variant 这一节，你就会知道，默认的 `18` tag 包含了很多你不会需要的 debian 包，这会导致你构建出的 image 包含了很多你不需要的东西。为自己不需要的东西承担成本（存储成本，传输成本）是很傻的行为，为了避免你在别人眼中看起来很傻，你可以使用基于只有 5MB 大小的 Alpine Linux 构建的 `18-apline` node.js image 来构建你的 node.js 项目。

基于 Apline Linux 来构建项目需要注意 Alpine Linux 使用 [musl](https://musl.libc.org/) 而不是 [glibc](https://www.gnu.org/software/libc/)（虽然但是，web 开发基本接触不到这个层面 **🤗**）。

## 减少 layer 层数

每个 `RUN, COPY, FROM` 指令都会添加额外的 layer，额外的 layer 会增加构建时间和 image 大小。

举个最佳实践：

```docker
RUN apt update -y
RUN apt upgrade -y
RUN apt install build-essential -y
```

应该替换成：

```docker
RUN apt update -y && apt upgrade -y && apt install --no-install-recommends build-essential -y
```

## \* 多阶段构建

多阶段构建是缩小 image 大小的重点。

我们的程序的构建需要的环境往往和运行时需要的环境是不一样的，如果不使用多阶段构建，即全程都是基于 Dockerfile 第一行的 `FROM xx:xx` 来构建，会导致构建时产生的很多没有意义的 layer 会被打包到最终生成的 image 中。所以此时，使用多阶段构建，即将程序各个阶段 base 不同的 image 可以剔除很多不需要的 layer， 大大缩小 image 体积。举例：

```docker
FROM node:18 as BUILD_STAGE
## 举例，在此处编译你的程序，产出了 /dist
...

FROM node:alpine as MAIN
## 从 BUILD_STAGE 中拿到 /dist 产物：
COPY --from=BUILD_STAGE /dist /
```

## 别忘了使用 .dockerignore

使用 .dockerignore 来忽略一些不需要放到 image 中的文件是非常有必要的。

## 总结

1. 基于 [Alpine](https://hub.docker.com/_/alpine) 的 Image 来构建
2. 减少 layer 层数
3. 多阶段构建
4. 记得使用 dockerignore

理论上是可以生成对于你的程序而言**最小**的 docker image。无非就是基于你程序需要的最小运行时环境，保持干净的 layer，image 里不要带任何运行时不需要的文件。

## BONUS

node.js 或 SSR 的前端项目可以在 image 构建时使用 [node-prune](https://github.com/tj/node-prune) 来减少 node_modules 的大小（注意，node-prune 和 `npm prune —production` 的[作用](https://docs.npmjs.com/cli/v8/commands/npm-prune)是不同的）。

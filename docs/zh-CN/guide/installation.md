<!--
 * @Author: WangLi
 * @Date: 2026-04-09 04:38:47
 * @LastEditors: WangLi
 * @LastEditTime: 2026-04-09 06:05:16
-->

# 安装

## 使用包管理器

我们建议您使用包管理器 (如 NPM、Yarn 或 pnpm) 安装 CZHY WebRTC，然后您就可以使用打包工具，例如 Vite 或 webpack。

::: code-group

```bash [pnpm]
pnpm add czhy-webrtc
```

```bash [yarn]
yarn add czhy-webrtc
```

```bash [npm]
npm install czhy-webrtc
```

:::

## 浏览器直接引入 <Badge type="tip" text="^0.0.21" />

直接通过浏览器的 HTML 标签导入 CZHY WebRTC，然后就可以使用全局变量 `Vue3baiduMapGl` 了。

不同的 CDN 提供商有不同的引入方式，我们在这里以 [unpkg](https://unpkg.com) 和 [jsDelivr](https://www.jsdelivr.com) 举例。你也可以使用其它的 CDN 供应商。

::: code-group

```html [unpkg]
<head>
  <meta charset="utf-8" />
  <!-- Import Vue3 -->
  <script src="https://unpkg.com/vue@3"></script>
  <!-- Import CZHY WebRTC -->
  <!-- Would use latest version, you'd better specify a version -->
  <script src="https://unpkg.com/czhy-webrtc"></script>
</head>
```

```html [jsDelivr]
<head>
  <!-- Import Vue 3 -->
  <script src="https//cdn.jsdelivr.net/npm/vue@3"></script>
  <!-- Import CZHY WebRTC -->
  <script src="https://cdn.jsdelivr.net/npm/czhy-webrtc"></script>
</head>
```

:::

::: tip 提示
我们建议使用 CDN 引入 CZHY WebRTC 的用户在链接地址上锁定版本，以免将来 Vue3BaiduMapGL 升级时受到非兼容性更新的影响
:::

## Hello World

[在线演示](https://codepen.io/wangli1991/pen/PwGdBXY)

<iframe allow="accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write;" allowfullscreen="true" allowpaymentrequest="true" height="500" style="width: 100%;" scrolling="no" title="CZHY WebRTC" src="https://codepen.io/wangli1991/embed/PwGdBXY?default-tab=html%2Cresult" frameborder="no" loading="lazy">
</iframe>

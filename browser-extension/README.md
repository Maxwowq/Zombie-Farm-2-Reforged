# 简体中文浏览器扩展（实验版）

在上游游戏网页中加载中文显示层，使用已有浏览器即可，不需要等待
国际化 PR 合并，也不需要安装 Chromium 或部署自己的游戏服务器。
扩展是独立的本地原型，尚未上架扩展商店。

## 安装

1. 用 Chrome 或 Edge 打开扩展管理页面：`chrome://extensions` 或
   `edge://extensions`。
2. 开启「开发者模式」，选择「加载已解压的扩展」。
3. 选择构建生成的 `browser-extension/dist` 目录（包含 `manifest.json`）。
4. 刷新 `https://zombiefarmreforged.com/`，扩展会自动应用中文。

关闭扩展并刷新页面即可恢复原来的显示。游戏依然运行在原网站地址上，
使用原网站的存档及登录状态；扩展没有读写 localStorage、Cookie、账号或
游戏服务器的代码，也不调用在线翻译服务。

## 范围

- 复用 IPA 原始中文表和独立维护的 Reforged 补译。
- 翻译 DOM 文本、悬停说明、占位文字及无障碍标签。
- 在 Canvas / OffscreenCanvas 的文字测量和绘制入口同时处理中文，
  覆盖 PixiJS 先绘制成纹理、再显示到 WebGL 画布上的文字。
- 保留输入值、下拉选项的原始值和已适配位置的玩家/僵尸自定义名字。
  不翻译图片中的文字或运营公告。
- 权限范围限于游戏域名及原 GitHub Pages 地址；没有后台进程或全站权限。

这是显示层适配，不能等同于源码版国际化的完整覆盖。长句换行、个别动态
拼接文案及新出现的名字位置仍需逐项检查；上游修改 UI 后也可能需要更新
适配。原生国际化 PR 仍是长期更可靠的方案。

## 构建与验证

在仓库根目录安装既有 Node 依赖后：

```sh
npx tsc -p browser-extension/tsconfig.json
node tools/build-browser-extension.mjs
```

生成内容约 0.5 MB，不包含游戏本体、图片、音频、IPA 或浏览器。
资源来源见包内的 `translation-source.json` 和 `NOTICE.txt`。

浏览器冒烟脚本 `browser-extension/smoke.mjs` 复用本机 Edge。它通过开发调试
接口加载真正的解压扩展，在严格 CSP 页面验证 DOM、选项值、名字、动态
更新、Canvas / OffscreenCanvas 像素及测量一致性，并在未汉化的上游生产
构建中验证实际游戏。测试使用独立临时浏览器配置，不接触日常浏览器数据。
运行前需要本地 Playwright 包和在 `http://localhost:4180` 提供的上游构建，
不需要另外下载浏览器：

```sh
node tools/build-browser-extension.mjs --test-origins
ZF_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
ZF_TEST_DIST=/absolute/path/to/upstream/dist \
node browser-extension/smoke.mjs
```

`--test-origins` 仅为测试添加 localhost 匹配项。分发前重新运行不带此参数的
构建命令，分发包不会请求 localhost 权限。

本改动无需部署 Worker，也无需数据库迁移。

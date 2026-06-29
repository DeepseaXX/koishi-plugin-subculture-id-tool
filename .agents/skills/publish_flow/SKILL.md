---
name: publish_flow
description: 指引如何在对次文化 ID 生成器插件进行修改后，规范且正确地打包编译并发布新版本到 NPM。
---

# 次文化 ID 生成器插件修改后的发布流程

当你对插件完成功能修改或 Bug 修复，并且准备发布新版本时，必须严格执行以下三步操作：

### 1. 修改版本号
在插件目录下的 [package.json](file:///d:/CODE/koishi-app/external/subculture-id-tool/package.json) 中修改 `version` 属性：
* 修改原则：根据代码变化的级别修改版本号（常规 Bug 修复或小优化修改小版本，如 `0.2.0` -> `0.2.1`）。

### 2. 编译构建项目
在 koishi 项目的根目录下（即 `d:\CODE\koishi-app`），使用 npm 编译打包项目：
* 运行指令：
  ```bash
  npm run build
  ```
* 这会调用 yakumo 编译整个 monorepo，将最新的 TypeScript 源码编译成运行时的 JavaScript 文件并生成 `lib` 目录。

### 3. 发布插件
在 koishi 项目 of 根目录下（即 `d:\CODE\koishi-app`），使用 npm 运行发布指令：
* 运行指令：
  ```bash
  npm run pub --verbose
  ```
* 这会将最新的代码发布包发布到 NPM 注册表，并在终端输出详细的 verbose 日志。

### 4. 提交并推送至 GitHub
完成 NPM 发布后，及时将版本修改及代码提交并推送到远程 GitHub 仓库：
* 运行指令：
  ```bash
  git add .
  git commit -m "chore: bump version to x.y.z"
  git push
  ```


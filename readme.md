# koishi-plugin-subculture-id-tool

用于生成次文化特色网名/ID 的生成器。通过清晰的 **三层处理体系**，生成充满中二风、非主流色彩的独创 ID。

---

## 🏷️ 双层处理体系

插件在生成次文化 ID 时，会按照以下两个层级进行处理：

1. **核心变换层 (Core Transformation)**：对输入的关键词主体文字进行形变。
   * **[T1] 简转繁 (Traditional)**：将简体汉字转换为繁体汉字（代号：`t1` / `trad` / `1`）。
   * **[T2] 火星文 (Martian)**：将汉字转换为非主流火星文（代号：`t2` / `mart` / `2`）。
   * **[T3] 拼音化 (Pinyin)**：将中文字符转换为拼音字母，并在首尾附带拼音印记，拼音字符间生成分隔符（代号：`t3` / `piny` / `3`）。
   * **[T4] 极客文 (Leet)**：将英文字母/拼音转换为 Leetspeak 风格代码数字，并在字符间随机填充夹心（代号：`t4` / `leet` / `4`）。
2. **修饰与外挂层 (Decorations & Affixes)**：在已完成核心变换的文字两端嵌套各类首尾修饰符。
   * 支持内置与自定义的前置挂件 (`prefix`)、后置挂件 (`suffix`)、火星包边 (`martian`) 以及各类自定义修饰分类（按 `martian` -> 自定义分类 -> `prefix`/`suffix` 从内向外叠加包裹）。

---

## 💬 指令列表

### 1. 生成 ID：`subid [keyword]`
生成一个专属的次文化特色 ID。如果未指定关键词，将提示输入。

#### 选项 (Options)
* `-p, --prefix <prefix>`：快捷指定 **前置挂件**。
  * 可输入数字编号选用预设（如 `-p 1`）。
  * 可输入 `none` 禁用前置挂件。
  * 可直接输入自定义前缀文本。
* `-s, --suffix <suffix>`：快捷指定 **后置挂件**。
  * 可输入数字编号选用预设（如 `-s 1`）。
  * 可输入 `none` 禁用后置挂件。
  * 可直接输入自定义后缀文本。
* `-a, --affix <affix>`：指定特定分类类型的修饰符。
  * 格式为 `type:value`（支持逗号分隔，如 `--affix vip:1,martian:none`）。
* `-t, --trans <trans>`：指定 **核心变换** 样式与叠加顺序。
  * 支持逗号分隔的标识符（如 `t1,t2`、`trad,mart` 或兼容数字编号 `1,2`）。
  * 输入 `none` 禁用核心变换，仅保留原始文本。
* `-d, --decor <decor>`：控制 **火星包边** 左右修饰符配对模式。
  * `none`：禁用火星包边。
  * `mix`：开启火星包边左右随机混搭。
  * `pair`：开启火星包边左右对称配对。
  * `all` (或缺省)：使用插件全局配置。
* `-i, --iter <iter>`：指定核心变换的叠加迭代次数，硬上限为 10 次。
* `-l, --list`：显示支持的变换样式、修饰与外挂分类列表及编号代号。

#### 示例
* `subid 雪芝麻糊 -p 1 -s none -t t3 --affix martian:none`
  固定首位预设前置挂件，禁用后置挂件与火星包边，并应用拼音化核心变换。

---

### 2. 查看支持列表：`subid-list`
查看支持的变换样式、修饰与外挂分类列表以及对应的编号与代号。

---

- **GitHub 主页**: [GitHub 仓库](https://github.com/DeepseaXX/koishi-plugin-subculture-id-tool)
- **NPM 页面**: [NPM 详细页面](https://www.npmjs.com/package/@deepseaxx/koishi-plugin-subculture-id-tool)


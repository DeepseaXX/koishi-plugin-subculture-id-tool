import { Context, Schema } from "koishi";
import {
  CHAR_DB,
  PREFIXES,
  SUFFIXES,
  MARTIAN_DECORATORS,
  LEET_MAP
} from "./dict";

export const name = "subculture-id-tool";

export const usage = `
## 🏷️ ID 生成三层级体系
生成一个次文化 ID 会依次经历以下三个处理层级：

1. **核心变换层 (Core Transformation)**：对关键词主体字形进行样式形变
   - **[T1] 简转繁 (Traditional)**（代号: \`t1\` / \`trad\` / \`1\`）
   - **[T2] 火星文 (Martian)**（代号: \`t2\` / \`mart\` / \`2\`）
   - **[T3] 拼音化 (Pinyin)**（代号: \`t3\` / \`piny\` / \`3\`）
   - **[T4] 极客文 (Leet)**（代号: \`t4\` / \`leet\` / \`4\`）
2. **文字伴侣层 (Text Embellishment)**：在文字中嵌入或首尾装饰修饰符
   - **[D1] 火星包边 (Martian Border)**（如 \`oοО ... Оοo\`）
   - **[D2] 拼音印记 (Pinyin Badge)**（如 \`★...★\`）
   - **[D3] 极客夹心 (Leet Spacer)**（如 \`ゞ\`、\`✿\`）
3. **首尾外挂层 (Outer Affixes)**：在最外层组装预设或自定义的词缀
   - **[A1] 前置挂件 (Prefix)**
   - **[A2] 后置挂件 (Suffix)**

---

### 🌟 常用指令
- **subid [关键词]**：生成次文化 ID。
  - *-p, --prefix <prefix>*：指定 **[A1] 前置挂件**（输入 1-N 选用预设，\`none\` 禁用，或直接输入自定义文本）。
  - *-s, --suffix <suffix>*：指定 **[A2] 后置挂件**（输入 1-N 选用预设，\`none\` 禁用，或直接输入自定义文本）。
  - *-t, --trans <trans>*：指定 **[T1-T4] 核心变换** 样式与叠加顺序（输入逗号分隔的代号如 \`t1,t2\`，或 \`none\` 禁用）。
  - *-d, --decor <decor>*：控制 **[D1-D3] 文字伴侣** 点缀效果（\`none\` 禁用所有点缀，\`mix\` 混搭，\`pair\` 对齐）。
  - *-i, --iter <iter>*：指定核心变换的叠加迭代次数上限（1-10 次）。
  - *-l, --list*：展示支持的变换样式、文字伴侣、首尾外挂列表及编号代号。
- **subid-list**：查看支持的列表及编号代号。

---

<a target="_blank" href="https://github.com/DeepseaXX/koishi-plugin-subculture-id-tool">➤ GitHub 仓库地址</a>  
<a target="_blank" href="https://www.npmjs.com/package/@deepseaxx/koishi-plugin-subculture-id-tool">➤ NPM 详细文档页面</a>
`;

// 定义配置接口
export interface Config {
  enableTraditional?: boolean;
  enableMartian?: boolean;
  enablePinyin?: boolean;
  enableLeetDecorate?: boolean;
  maxIterations?: number;
  randomCombineDecorators?: boolean;
  disableBuiltinPrefixes?: boolean;
  customPrefixes?: string[];
  disableBuiltinSuffixes?: boolean;
  customSuffixes?: string[];
}

export const Config: Schema<Config> =
  Schema.intersect([
    Schema.object({
      enableTraditional: Schema.boolean().default(true).description("是否启用 [T1] 简转繁"),
      enableMartian: Schema.boolean().default(true).description("是否启用 [T2] 火星文"),
      enablePinyin: Schema.boolean().default(true).description("是否启用 [T3] 拼音化"),
      enableLeetDecorate: Schema.boolean().default(true).description("是否启用 [T4] 极客文"),
    }).description("1️⃣ 核心变换层 (Core Transformation)"),
    Schema.object({
      randomCombineDecorators: Schema.boolean().default(true).description("是否允许 [D1] 火星包边 左右随机混搭（若关闭则两侧对称配对）"),
    }).description("2️⃣ 文字伴侣层 (Text Embellishment)"),
    Schema.object({
      disableBuiltinPrefixes: Schema.boolean().default(false).description("是否禁用内置的 [A1] 前置挂件"),
      customPrefixes: Schema.array(Schema.string()).role('table').default([]).description("自定义额外 [A1] 前置挂件 列表"),
      disableBuiltinSuffixes: Schema.boolean().default(false).description("是否禁用内置的 [A2] 后置挂件"),
      customSuffixes: Schema.array(Schema.string()).role('table').default([]).description("自定义额外 [A2] 后置挂件 列表")
    }).description("3️⃣ 首尾外挂层 (Outer Affixes)"),
    Schema.object({
      maxIterations: Schema.number().default(3).min(1).max(10).description("默认随机核心变换时的最大叠加迭代次数上限 (硬上限 10 次)"),
    }).description("⚙️ 通用生成设置")
  ]);


// 预处理 1: 繁体化
function transformTraditional(text: string): string {
  return Array.from(text)
    .map(char => CHAR_DB[char]?.traditional || char)
    .join("");
}

// 预处理 2: 火星文
function transformMartian(text: string, config: Config, decorOption?: string): string {
  const converted = Array.from(text)
    .map(char => CHAR_DB[char]?.martian || char)
    .join("");

  let left = "";
  let right = "";

  if (decorOption === "none") {
    // 禁用 [D1] 火星包边
    left = "";
    right = "";
  } else {
    const isMix = decorOption === "mix" ? true : (decorOption === "pair" ? false : (config.randomCombineDecorators ?? true));
    if (isMix) {
      // 随机混搭模式
      const leftDeco = MARTIAN_DECORATORS[Math.floor(Math.random() * MARTIAN_DECORATORS.length)];
      const rightDeco = MARTIAN_DECORATORS[Math.floor(Math.random() * MARTIAN_DECORATORS.length)];
      left = leftDeco.left;
      right = rightDeco.right;
    } else {
      // 配对模式
      const deco = MARTIAN_DECORATORS[Math.floor(Math.random() * MARTIAN_DECORATORS.length)];
      left = deco.left;
      right = deco.right;
    }
  }

  return `${left}${converted}${right}`;
}

// 预处理 3: 拼音化与特殊符号装饰
function transformPinyin(text: string, decorOption?: string): string {
  const pinyins: string[] = [];
  for (const char of text) {
    if (CHAR_DB[char]?.pinyin) {
      pinyins.push(CHAR_DB[char].pinyin);
    } else if (/[a-zA-Z0-9]/.test(char)) {
      pinyins.push(char.toLowerCase());
    } else {
      pinyins.push(char);
    }
  }

  const separators = ["_", ".", "v", "o"];
  const sep = separators[Math.floor(Math.random() * separators.length)];

  let start = "";
  let end = "";
  if (decorOption !== "none") {
    const startDecos = ["°", "★", "◇", "✿", ""];
    const endDecos = ["°", "★", "◇", "✿", ""];
    start = startDecos[Math.floor(Math.random() * startDecos.length)];
    end = endDecos[Math.floor(Math.random() * endDecos.length)];
  }

  return `${start}${pinyins.join(sep)}${end}`;
}

// 预处理 4: Leetspeak 与字符加料
function transformLeetAndDecorate(text: string, decorOption?: string): string {
  const parts: string[] = [];
  for (const char of text) {
    if (CHAR_DB[char]?.pinyin) {
      parts.push(CHAR_DB[char].pinyin);
    } else {
      parts.push(char);
    }
  }

  const processed = parts.map(part => {
    return Array.from(part)
      .map(c => LEET_MAP[c] || c)
      .join("");
  });

  let inj = "";
  if (decorOption !== "none") {
    const injectors = ["ゞ", "✿", "★", "~", "•"];
    inj = injectors[Math.floor(Math.random() * injectors.length)];
  }

  return processed.join(inj);
}

// 合并前缀列表
function getMergedPrefixes(config: Config): string[] {
  const builtin = config.disableBuiltinPrefixes ? [] : PREFIXES;
  return [...builtin, ...(config.customPrefixes || [])];
}

// 合并后缀列表
function getMergedSuffixes(config: Config): string[] {
  const builtin = config.disableBuiltinSuffixes ? [] : SUFFIXES;
  return [...builtin, ...(config.customSuffixes || [])];
}

// 解析前缀
function getPrefix(optionVal: string | undefined, config: Config): string {
  const mergedPrefixes = getMergedPrefixes(config);
  if (optionVal === undefined) {
    if (mergedPrefixes.length === 0) return "";
    return mergedPrefixes[Math.floor(Math.random() * mergedPrefixes.length)];
  }
  if (optionVal.toLowerCase() === "none") {
    return "";
  }
  const index = parseInt(optionVal, 10);
  if (!isNaN(index) && index >= 1 && index <= mergedPrefixes.length) {
    return mergedPrefixes[index - 1];
  }
  return optionVal;
}

// 解析后缀
function getSuffix(optionVal: string | undefined, config: Config): string {
  const mergedSuffixes = getMergedSuffixes(config);
  if (optionVal === undefined) {
    if (mergedSuffixes.length === 0) return "";
    return mergedSuffixes[Math.floor(Math.random() * mergedSuffixes.length)];
  }
  if (optionVal.toLowerCase() === "none") {
    return "";
  }
  const index = parseInt(optionVal, 10);
  if (!isNaN(index) && index >= 1 && index <= mergedSuffixes.length) {
    return mergedSuffixes[index - 1];
  }
  return optionVal;
}

// 检查预处理方式是否在后台开启
function isTransEnabled(num: number, config: Config): boolean {
  if (num === 1) return config.enableTraditional ?? true;
  if (num === 2) return config.enableMartian ?? true;
  if (num === 3) return config.enablePinyin ?? true;
  if (num === 4) return config.enableLeetDecorate ?? true;
  return false;
}

// 解析核心变换样式代号或数字
function parseTransToken(token: string): number | null {
  const t = token.trim().toLowerCase();
  if (t === "1" || t === "t1" || t === "trad" || t === "traditional") return 1;
  if (t === "2" || t === "t2" || t === "mart" || t === "martian") return 2;
  if (t === "3" || t === "t3" || t === "piny" || t === "pinyin") return 3;
  if (t === "4" || t === "t4" || t === "leet" || t === "leetspeak") return 4;
  return null;
}

// 应用核心变换组合
function applyTransformers(
  text: string,
  optionVal: string | undefined,
  iterOption: number | undefined,
  decorOption: string | undefined,
  config: Config
): string {
  const transMap: Record<number, (t: string, c: Config, d?: string) => string> = {
    1: (t) => transformTraditional(t),
    2: (t, c, d) => transformMartian(t, c, d),
    3: (t, c, d) => transformPinyin(t, d),
    4: (t, c, d) => transformLeetAndDecorate(t, d)
  };

  const available = [1, 2, 3, 4].filter(n => isTransEnabled(n, config));
  if (available.length === 0) {
    return text;
  }

  // 计算最大限制，配置上限不能超过硬上限 10
  const configMax = Math.min(config.maxIterations ?? 3, 10);

  // 计算实际需要执行的迭代次数
  let actualIterations: number;
  if (iterOption !== undefined && !isNaN(iterOption)) {
    // 命令行显式指定迭代次数，可突破配置上限，但受硬上限 10 限制
    actualIterations = Math.min(Math.max(1, iterOption), 10);
  } else {
    // 随机迭代次数在 1 到 configMax 之间
    actualIterations = Math.floor(Math.random() * configMax) + 1;
  }

  if (actualIterations <= 0) {
    return text;
  }

  let selected: number[] = [];

  if (optionVal === undefined) {
    // 随机选择 actualIterations 个预处理方法，每次都从 available 中随机抽取，允许重复
    for (let i = 0; i < actualIterations; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available[idx]);
    }
  } else {
    if (optionVal.toLowerCase() === "none") {
      return text;
    }

    // 解析用户指定的代号并过滤掉未开启的变换样式
    const fixedNums = optionVal
      .split(",")
      .map(s => parseTransToken(s))
      .filter((n): n is number => n !== null && transMap[n] !== undefined && isTransEnabled(n, config));

    selected = [...fixedNums];
    if (selected.length > actualIterations) {
      selected = selected.slice(0, actualIterations);
    } else {
      // 补充缺失的迭代次数，从所有可用的变换中随机抽取
      while (selected.length < actualIterations) {
        const randomIdx = Math.floor(Math.random() * available.length);
        selected.push(available[randomIdx]);
      }
    }
  }

  let current = text;
  for (const num of selected) {
    current = transMap[num](current, config, decorOption);
  }
  return current;
}

// 获取列表展示信息
function getListMessage(config: Config): string {
  const isEnabledStr = (num: number) => isTransEnabled(num, config) ? "" : " (已全局禁用)";

  let msg = "✨ 次文化 ID 生成器 支持列表 ✨\n\n";
  msg += "1️⃣ 【核心变换层 Core Transformation】(使用 -t 选项或代号指定)\n";
  msg += `• [T1] 简转繁 (trad) - 如: 葉子${isEnabledStr(1)}\n`;
  msg += `• [T2] 火星文 (mart) - 如: oοО 噯 Оοo${isEnabledStr(2)}\n`;
  msg += `• [T3] 拼音化 (piny) - 如: ★ye_zi★${isEnabledStr(3)}\n`;
  msg += `• [T4] 极客文 (leet) - 如: yゞ3ゞzゞ1${isEnabledStr(4)}\n\n`;

  msg += "2️⃣ 【文字伴侣层 Text Embellishment】(使用 -d 选项控制点缀)\n";
  msg += "• [D1] 火星包边 (如: oοО...Оοo)\n";
  msg += "• [D2] 拼音印记 (如: ★...★)\n";
  msg += "• [D3] 极客夹心 (如: ゞ)\n\n";

  const mergedPrefixes = getMergedPrefixes(config);
  msg += "3️⃣ 【首尾外挂层 - [A1] 前置挂件】(使用 -p 选项，输入编号 1-N 选用)\n";
  if (mergedPrefixes.length === 0) {
    msg += "(列表为空，已全局禁用/未配置前置挂件)\n";
  } else {
    mergedPrefixes.forEach((p, i) => {
      msg += `${i + 1}. ${p}  `;
      if ((i + 1) % 5 === 0) msg += "\n";
    });
    if (mergedPrefixes.length % 5 !== 0) msg += "\n";
  }
  msg += "\n";

  const mergedSuffixes = getMergedSuffixes(config);
  msg += "3️⃣ 【首尾外挂层 - [A2] 后置挂件】(使用 -s 选项，输入编号 1-N 选用)\n";
  if (mergedSuffixes.length === 0) {
    msg += "(列表为空，已全局禁用/未配置后置挂件)\n";
  } else {
    mergedSuffixes.forEach((s, i) => {
      msg += `${i + 1}. ${s}  `;
      if ((i + 1) % 5 === 0) msg += "\n";
    });
    if (mergedSuffixes.length % 5 !== 0) msg += "\n";
  }

  msg += "\n💡 提示：使用 -p, -s, -t 选项可以固定外挂挂件与变换组合，输入 none 禁用某项处理。";
  msg += "\n💡 新增：使用 -d none 选项可以去除所有文字伴侣点缀。";
  msg += "\n📝 示例：subid 雪芝麻糊 -p 1 -s none -t trad,mart -d none";
  return msg;
}

export function apply(ctx: Context, config: Config) {
  config = config || {} as Config;

  ctx.command("subid [keyword]", "次文化 ID 生成器")
    .alias("subculture-id")
    .option("prefix", "-p <prefix:string>  指定 [A1] 前置挂件 (输入编号选用预设，none 禁用，或自定义)")
    .option("suffix", "-s <suffix:string>  指定 [A2] 后置挂件 (输入编号选用预设，none 禁用，或自定义)")
    .option("trans", "-t <trans:string>    指定 [T1-T4] 核心变换 (支持逗号分隔的代号如 trad,mart，none 禁用)")
    .option("decor", "-d <decor:string>    控制 [D1-D3] 文字伴侣点缀 (none 禁用点缀，mix 随机混搭，pair 对称配对)")
    .option("iter", "-i <iter:number>      指定叠加迭代次数 (可突破配置上限，硬上限 10 次)")
    .option("list", "-l                    显示支持的变换样式、伴侣和外挂列表及编号代号")
    .example("subid 雪芝麻糊 -p 1 -s none -t trad -d none  (固定前置挂件，禁用后缀，应用简转繁核心变换且禁用文字伴侣点缀)")
    .action(async ({ options, session }, keyword) => {
      if (options.list) {
        return getListMessage(config);
      }

      let targetKeyword = keyword;
      if (!targetKeyword) {
        await session.send("请输入关键词以生成 ID：");
        const replied = await session.prompt(30000);
        if (!replied) {
          return "等待超时（30秒内未收到回复）";
        }
        targetKeyword = replied;
      }

      const prefix = getPrefix(options.prefix, config);
      const suffix = getSuffix(options.suffix, config);
      const processed = applyTransformers(targetKeyword, options.trans, options.iter, options.decor, config);

      return `${prefix}${processed}${suffix}`;
    });

  ctx.command("subid-list", "查看次文化 ID 生成器支持的变换样式、伴侣点缀和首尾外挂列表")
    .action(() => {
      return getListMessage(config);
    });
}

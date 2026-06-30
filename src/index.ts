import { Context, Schema } from "koishi";
import {
  CHAR_DB,
  BUILTIN_AFFIXES,
  LEET_MAP,
  AffixItem
} from "./dict";

export const name = "subculture-id-tool";

export const usage = `
## 🏷️ ID 生成双层级体系
生成一个次文化 ID 会依次经历以下两个处理层级：

1. **核心变换层 (Core Transformation)**：对关键词主体字形进行样式形变
| 核心层级 | 代号选项 | 效果示例 |
| :--- | :--- | :--- |
| **[T1] 简转繁 (Traditional)** | \`t1\` / \`trad\` / \`1\` | \`雪芝麻糊\` ➔ \`雪芝麻糊\` |
| **[T2] 火星文 (Martian)** | \`t2\` / \`mart\` / \`2\` | \`芝麻\` ➔ \`芝麻\` |
| **[T3] 拼音化 (Pinyin)** | \`t3\` / \`piny\` / \`3\` | \`雪\` ➔ \`★xue★\` |
| **[T4] 极客文 (Leet)** | \`t4\` / \`leet\` / \`4\` | \`芝麻\` ➔ \`zh1ゞma\` |
| **[T0] 不做处理 (None)** | \`t0\` / \`none\` / \`0\` | 不改变字形，跳过变换 |

2. **修饰与外挂层 (Decorations & Affixes)**：在已完成核心变换的文字两端嵌套各类首尾修饰符
| 修饰层级 | 代号选项 | 效果示例 |
| :--- | :--- | :--- |
| **[D1] 前置挂件 (Prefix)** | \`d1\` / \`pref\` / \`1\` | \`[prefix]雪芝麻\` ➔ \`ʚ雪芝麻\` |
| **[D2] 后置挂件 (Suffix)** | \`d2\` / \`suff\` / \`2\` | \`雪芝麻[suffix]\` ➔ \`雪芝麻o7\` |
| **[D3] 火星包边 (Martian)** | \`d3\` / \`mart\` / \`3\` | \`[martian]雪芝麻[martian]\` ➔ \`✿雪芝麻✿\` 或 \`ゞ雪芝麻•\` |
| **[D0] 不做处理 (None)** | \`d0\` / \`none\` / \`0\` | 不做任何修饰，保留原样 |

---

### 🌟 常用指令
- **subid [关键词]**：生成次文化 ID（指令后的关键词可使用引号包裹以支持包含空格或换行的文本，支持单双及中英文引号，如 \`subid “雪 芝 麻”\`）。
  - **返回列表选项**
    - *-l, --list*：展示支持的变换样式、修饰与外挂分类列表及编号代号。
  - **核心变换控制 [T层]**
    - *-i, --iter <iter>*：指定核心变换的叠加迭代次数（候选: \`1-10\` 之间的数字，默认从配置读取）。
    - *-t, --trans <trans>*：指定核心变换与叠加顺序（支持逗号分隔，或无逗号纯数字如 \`12\`。候选: \`t1\`/\`trad\`/\`1\` (简转繁)、\`t2\`/\`mart\`/\`2\` (火星文)、\`t3\`/\`piny\`/\`3\` (拼音化)、\`t4\`/\`leet\`/\`4\` (极客文)、\`none\`/\`0\` (不做处理)）。
    - *-c, --core-mode <coreMode>*：指定核心变换处理模式（候选: \`each\` 逐字处理，\`all\` 整段处理）。
  - **修饰与外挂控制 [D层]**
    - *-y, --affix-iter <affixIter>*：指定修饰与外挂层的叠加迭代次数（候选: \`1-10\` 之间的数字，默认从配置读取）。
    - *-d, --decor <decor>*：指定特定类型的修饰符（格式为 \`type:value\`，多项逗号分隔。\`type\` 候选: \`d1\`/\`prefix\`、\`d2\`/\`suffix\`、\`d3\`/\`martian\` 或自定义分类；\`value\` 候选: \`none\` 禁用，或自定义文本。如 \`d1:ʚ,d2:none\`）。
    - *-m, --martian <martian>*：快捷控制火星包边左右配对模式（候选: \`none\` 禁用，\`mix\` 随机混搭，\`pair\` 对称配对）。
- **subid-list**：查看支持 of 列表及编号代号。

---

<a target="_blank" href="https://github.com/DeepseaXX/koishi-plugin-subculture-id-tool">➤ GitHub 仓库地址</a>  
<a target="_blank" href="https://www.npmjs.com/package/@deepseaxx/koishi-plugin-subculture-id-tool">➤ NPM 详细文档页面</a>
`;

// 定义自定义首尾对接口
export interface CustomAffix {
  left?: string;
  right?: string;
  prefix?: string; // 兼容旧版配置
  suffix?: string; // 兼容旧版配置
  type?: string;   // 默认是 "prefix"
}

// 定义配置接口
export interface Config {
  enableTraditional?: boolean;
  enableMartian?: boolean;
  enablePinyin?: boolean;
  enableLeetDecorate?: boolean;
  maxIterations?: number;
  coreTransformMode?: 'each' | 'all';
  weightT0?: number;
  weightT1?: number;
  weightT2?: number;
  weightT3?: number;
  weightT4?: number;
  weightD0?: number;
  weightD1?: number;
  weightD2?: number;
  weightD3?: number;
  martianDecoratorMode?: 'pair' | 'mix' | 'both';
  enabledTypes?: Record<string, boolean>;
  customAffixes?: CustomAffix[];
  maxAffixIterations?: number;
}

export const Config: Schema<Config> =
  Schema.intersect([
    Schema.object({
      maxIterations: Schema.number().default(2).min(0).max(10).description("默认随机核心变换时的最大叠加迭代次数上限 (硬上限 10 次)"),
      coreTransformMode: Schema.union([
        Schema.const('each').description('对每个文字应用不同类型的变换 (逐字处理)'),
        Schema.const('all').description('对所有文字应用同一类型的变换 (整段处理)'),
      ]).default('each').description("核心变换模式 (默认逐字处理)"),
      enableTraditional: Schema.boolean().default(true).description("是否启用 [T1] 简转繁"),
      enableMartian: Schema.boolean().default(true).description("是否启用 [T2] 火星文"),
      enablePinyin: Schema.boolean().default(true).description("是否启用 [T3] 拼音化"),
      enableLeetDecorate: Schema.boolean().default(true).description("是否启用 [T4] 极客文"),
      weightT0: Schema.number().default(1).min(0).description("不做处理 [T0] 的生效权重"),
      weightT1: Schema.number().default(1).min(0).description("简转繁 [T1] 的生效权重"),
      weightT2: Schema.number().default(1).min(0).description("火星文 [T2] 的生效权重"),
      weightT3: Schema.number().default(1).min(0).description("拼音化 [T3] 的生效权重"),
      weightT4: Schema.number().default(1).min(0).description("极客文 [T4] 的生效权重"),
    }).description("1️⃣ 核心变换层 (Core Transformation)"),
    Schema.object({
      maxAffixIterations: Schema.number().default(3).min(0).max(10).description("默认随机修饰与外挂时的最大叠加迭代次数上限 (硬上限 10 次)"),
      enabledTypes: Schema.dict(Schema.boolean()).default({
        prefix: true,
        suffix: true,
        martian: true,
      }).description("启用的修饰/外挂分类（内置分类对应：prefix ➔ [D1] 前置挂件，suffix ➔ [D2] 后置挂件，martian ➔ [D3] 火星包边。也可以在此添加并启用自定义分类）"),
      weightD0: Schema.number().default(1).min(0).description("不做处理 [D0] 的生效权重"),
      weightD1: Schema.number().default(1).min(0).description("前置挂件 [D1] 的生效权重"),
      weightD2: Schema.number().default(1).min(0).description("后置挂件 [D2] 的生效权重"),
      weightD3: Schema.number().default(1).min(0).description("火星包边 [D3] 的生效权重"),
      martianDecoratorMode: Schema.union([
        Schema.const('pair').description('固定配对'),
        Schema.const('mix').description('随机混搭'),
        Schema.const('both').description('混合模式（配对几率占 50%）'),
      ]).default('both').description("火星包边左右修饰符模式"),
      customAffixes: Schema.array(Schema.object({
        left: Schema.string().default('').description('左侧修饰 / 前缀文字'),
        right: Schema.string().default('').description('右侧修饰 / 后缀文字'),
        type: Schema.string().default('prefix').description('分类类型 (如 prefix, suffix, martian 或自定义分类)'),
      })).role('table').default([]).description("自定义额外修饰与外挂对 列表"),
    }).description("2️⃣ 修饰与外挂层 (Decorations & Affixes)"),
  ]);

// 预处理 1: 繁体化
function transformTraditional(text: string): string {
  return Array.from(text)
    .map(char => CHAR_DB[char]?.traditional || char)
    .join("");
}

// 预处理 2: 火星文
function transformMartian(text: string): string {
  return Array.from(text)
    .map(char => CHAR_DB[char]?.martian || char)
    .join("");
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

// 获取所有可用的修饰词 (合并内置与自定义，并支持旧版本属性映射)
function getAvailableAffixes(config: Config): AffixItem[] {
  const customList: AffixItem[] = (config.customAffixes || []).map(a => {
    const left = a.left ?? a.prefix ?? "";
    const right = a.right ?? a.suffix ?? "";
    let type = a.type;
    if (!type) {
      if (a.prefix && !a.suffix) type = "prefix";
      else if (a.suffix && !a.prefix) type = "suffix";
      else type = "prefix"; // 默认
    }
    return { left, right, type };
  });
  return [...BUILTIN_AFFIXES, ...customList];
}

// 根据权重随机选择修饰分类类型 (包含 D0 none)
function getRandomAffixType(config: Config, specified: Record<string, string>): string {
  const items: { type: string; weight: number }[] = [];

  // D0 (none)
  items.push({ type: "none", weight: config.weightD0 ?? 1 });

  // D1 (prefix)
  if ((config.enabledTypes?.prefix ?? true) && specified.prefix !== "none") {
    items.push({ type: "prefix", weight: config.weightD1 ?? 1 });
  }
  // D2 (suffix)
  if ((config.enabledTypes?.suffix ?? true) && specified.suffix !== "none") {
    items.push({ type: "suffix", weight: config.weightD2 ?? 1 });
  }
  // D3 (martian)
  if ((config.enabledTypes?.martian ?? true) && specified.martian !== "none") {
    items.push({ type: "martian", weight: config.weightD3 ?? 1 });
  }

  // 额外自定义类型，如果启用的话，默认权重为 1
  const enabledTypes = config.enabledTypes || { prefix: true, suffix: true, martian: true };
  for (const type of Object.keys(enabledTypes)) {
    if (type !== "prefix" && type !== "suffix" && type !== "martian") {
      if (enabledTypes[type] && specified[type] !== "none") {
        items.push({ type, weight: 1 });
      }
    }
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return "none";
  }

  let r = Math.random() * totalWeight;
  for (const item of items) {
    if (r < item.weight) {
      return item.type;
    }
    r -= item.weight;
  }
  return "none";
}

// 统一应用所有启用的修饰层/外挂层
export function applyAffixes(
  text: string,
  specified: Record<string, string>,
  decorOption: string | undefined,
  config: Config,
  affixIterOption?: number
): string {
  const allAffixes = getAvailableAffixes(config);

  // 1. 收集明确指定的修饰（-p, -s, -a 等指定的且不是 "none" 的修饰）
  const specifiedQueue: AffixItem[] = [];
  const specifiedTypes = Object.keys(specified);

  for (const type of specifiedTypes) {
    const val = specified[type];
    if (val === undefined || val === "none") {
      continue;
    }

    // 如果是 martian 的特殊模式选项 (mix/pair/both)，先不作为固定值处理，让其参与后面的随机/计算逻辑
    const isModeOption = type === "martian" && (val === "mix" || val === "pair" || val === "both");
    if (isModeOption) {
      continue;
    }

    // 去掉 1-N 数字预设编号映射，直接作为自定义文本处理
    if (type === "suffix") {
      specifiedQueue.push({ left: "", right: val, type });
    } else if (type === "martian") {
      specifiedQueue.push({ left: val, right: val, type });
    } else {
      specifiedQueue.push({ left: val, right: "", type });
    }
  }

  // 2. 计算实际需要的迭代次数
  const configMax = Math.min(config.maxAffixIterations ?? 2, 10);
  let actualIterations: number;
  if (affixIterOption !== undefined && !isNaN(affixIterOption)) {
    actualIterations = Math.min(Math.max(0, affixIterOption), 10);
  } else {
    actualIterations = configMax <= 0 ? 0 : Math.floor(Math.random() * configMax) + 1;
  }

  // 3. 构建待应用的修饰队列
  let queue = [...specifiedQueue];

  // 如果队列长度小于目标迭代次数，从候选池中根据权重随机补充
  if (queue.length > actualIterations) {
    // 缩减到目标次数（同核心变换一致，截断）
    queue = queue.slice(0, actualIterations);
  } else if (queue.length < actualIterations) {
    while (queue.length < actualIterations) {
      const selectedType = getRandomAffixType(config, specified);
      if (selectedType === "none") {
        queue.push({ left: "", right: "", type: "none" });
      } else {
        const candidates = allAffixes.filter(a => a.type === selectedType);
        if (candidates.length > 0) {
          const idx = Math.floor(Math.random() * candidates.length);
          queue.push({ ...candidates[idx] });
        } else {
          queue.push({ left: "", right: "", type: "none" });
        }
      }
    }
  }

  // 5. 对最终的队列进行随机打乱（Shuffle），实现“随机组合选择”和“随机顺序嵌套包裹”
  if (queue.length > 1) {
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = queue[i];
      queue[i] = queue[j];
      queue[j] = temp;
    }
  }

  // 6. 依次应用队列中的每个修饰
  let current = text;
  for (const item of queue) {
    let left = item.left;
    let right = item.right;

    // 特殊处理 martian 分类下的混搭模式
    if (item.type === "martian") {
      const specifiedVal = specified["martian"];
      let mode = config.martianDecoratorMode ?? "both";
      const optVal = specifiedVal || decorOption;
      if (optVal === "mix") {
        mode = "mix";
      } else if (optVal === "pair") {
        mode = "pair";
      }

      let isPair = true;
      if (mode === "mix") {
        isPair = false;
      } else if (mode === "pair") {
        isPair = true;
      } else {
        isPair = Math.random() < 0.5;
      }

      if (!isPair) {
        // 随机再挑选一个作为右侧包边
        const martianCandidates = allAffixes.filter(a => a.type === "martian");
        if (martianCandidates.length > 0) {
          const rightDeco = martianCandidates[Math.floor(Math.random() * martianCandidates.length)];
          right = rightDeco.right;
        }
      }
    }

    current = `${left}${current}${right}`;
  }

  return current;
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

// 解析用户指定的核心变换序列
function parseTransOption(optionVal: string, config: Config): number[] {
  const val = optionVal.trim();
  if (val.toLowerCase() === "none") {
    return [];
  }

  let tokens: string[] = [];
  // 优化：如果是纯数字（如 12、124、314），直接按单个字拆分
  if (/^[1-4]+$/.test(val)) {
    tokens = Array.from(val);
  } else {
    tokens = val.split(",");
  }

  return tokens
    .map(s => parseTransToken(s))
    .filter((n): n is number => n !== null && isTransEnabled(n, config));
}

// 根据权重随机选择核心变换 (包含 T0)
function getRandomTransformer(config: Config): number {
  const items: { num: number; weight: number }[] = [];

  // T0 总是可用
  items.push({ num: 0, weight: config.weightT0 ?? 1 });

  if (config.enableTraditional ?? true) {
    items.push({ num: 1, weight: config.weightT1 ?? 1 });
  }
  if (config.enableMartian ?? true) {
    items.push({ num: 2, weight: config.weightT2 ?? 1 });
  }
  if (config.enablePinyin ?? true) {
    items.push({ num: 3, weight: config.weightT3 ?? 1 });
  }
  if (config.enableLeetDecorate ?? true) {
    items.push({ num: 4, weight: config.weightT4 ?? 1 });
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  let r = Math.random() * totalWeight;
  for (const item of items) {
    if (r < item.weight) {
      return item.num;
    }
    r -= item.weight;
  }
  return 0;
}

// 应用核心变换组合
export function applyTransformers(
  text: string,
  optionVal: string | undefined,
  iterOption: number | undefined,
  decorOption: string | undefined,
  config: Config,
  cmdCoreMode?: string
): string {
  const transMap: Record<number, (t: string, c: Config, d?: string) => string> = {
    0: (t) => t,
    1: (t) => transformTraditional(t),
    2: (t) => transformMartian(t),
    3: (t, c, d) => transformPinyin(t, d),
    4: (t, c, d) => transformLeetAndDecorate(t, d)
  };

  // 决定处理模式：优先使用命令行指定的，其次是配置中的，默认是 'each'
  let mode = cmdCoreMode || config.coreTransformMode || 'each';
  if (mode !== 'each' && mode !== 'all') {
    mode = 'each';
  }

  // 计算最大限制，配置上限不能超过硬上限 10
  const configMax = Math.min(config.maxIterations ?? 1, 10);

  // 计算实际需要执行的迭代次数
  let actualIterations: number;
  if (iterOption !== undefined && !isNaN(iterOption)) {
    // 命令行显式指定迭代次数，可突破配置上限，但受硬上限 10 限制
    actualIterations = Math.min(Math.max(0, iterOption), 10);
  } else {
    // 随机迭代次数在 1 到 configMax 之间，若 configMax 为 0 则为 0 次
    actualIterations = configMax <= 0 ? 0 : Math.floor(Math.random() * configMax) + 1;
  }

  if (actualIterations <= 0) {
    return text;
  }

  // 解析用户指定的固定变换（如果有）
  let specified: number[] | null = null;
  if (optionVal !== undefined) {
    specified = parseTransOption(optionVal, config);
    // 如果用户明确指定了 none，就表示不应用变换
    if (optionVal.toLowerCase() === "none") {
      return text;
    }
  }

  // 生成指定长度的变换链（用于单字或者整段）
  const getTransformerChain = (): number[] => {
    let chain: number[] = [];
    if (specified !== null) {
      chain = [...specified];
      if (chain.length > actualIterations) {
        chain = chain.slice(0, actualIterations);
      } else {
        // 补充缺失的迭代次数，根据权重随机选择变换
        while (chain.length < actualIterations) {
          chain.push(getRandomTransformer(config));
        }
      }
    } else {
      // 完全随机生成
      for (let i = 0; i < actualIterations; i++) {
        chain.push(getRandomTransformer(config));
      }
    }
    return chain;
  };

  if (mode === 'each') {
    // 逐字随机/处理
    const chars = Array.from(text);
    const processedChars = chars.map(char => {
      // 每个文字的变换链如果是随机的话，需要各自独立生成
      const chain = getTransformerChain();
      let current = char;
      for (const num of chain) {
        current = transMap[num](current, config, decorOption);
      }
      return current;
    });
    return processedChars.join("");
  } else {
    // 整段处理
    const chain = getTransformerChain();
    let current = text;
    for (const num of chain) {
      current = transMap[num](current, config, decorOption);
    }
    return current;
  }
}

// 获取列表展示信息
export function getListMessage(config: Config): string {
  const isEnabledStr = (num: number) => isTransEnabled(num, config) ? "" : " (已全局禁用)";

  // 计算权重和几率
  const w0 = config.weightT0 ?? 1;
  const w1 = isTransEnabled(1, config) ? (config.weightT1 ?? 1) : 0;
  const w2 = isTransEnabled(2, config) ? (config.weightT2 ?? 1) : 0;
  const w3 = isTransEnabled(3, config) ? (config.weightT3 ?? 1) : 0;
  const w4 = isTransEnabled(4, config) ? (config.weightT4 ?? 1) : 0;
  const total = w0 + w1 + w2 + w3 + w4;

  const pct = (w: number) => total > 0 ? `${((w / total) * 100).toFixed(1)}%` : "0%";

  // 计算修饰外挂层权重和几率
  const wd0 = config.weightD0 ?? 1;
  const wd1 = (config.enabledTypes?.prefix ?? true) ? (config.weightD1 ?? 1) : 0;
  const wd2 = (config.enabledTypes?.suffix ?? true) ? (config.weightD2 ?? 1) : 0;
  const wd3 = (config.enabledTypes?.martian ?? true) ? (config.weightD3 ?? 1) : 0;

  // 加上自定义类型的权重
  let totalD = wd0 + wd1 + wd2 + wd3;
  const enabledTypes = config.enabledTypes || { prefix: true, suffix: true, martian: true };
  const customTypes = Object.keys(enabledTypes).filter(t => t !== 'prefix' && t !== 'suffix' && t !== 'martian');
  const customWeights: Record<string, number> = {};
  for (const type of customTypes) {
    if (enabledTypes[type]) {
      customWeights[type] = 1; // 自定义分类默认权重为 1
      totalD += 1;
    }
  }

  const pctD = (w: number) => totalD > 0 ? `${((w / totalD) * 100).toFixed(1)}%` : "0%";
  const isAffixEnabledStr = (type: string) => (config.enabledTypes?.[type] ?? true) ? "" : " (已全局禁用)";

  let msg = "✨ 次文化 ID 生成器 支持列表 ✨\n\n";
  msg += "1️⃣ 【核心变换层 Core Transformation】(使用 -t 选项或代号指定)\n";
  msg += `• [T0] 不做处理 - 权重: ${w0} (几率: ${pct(w0)})\n`;
  msg += `• [T1] 简转繁 (trad) - 权重: ${w1} (几率: ${pct(w1)})${isEnabledStr(1)}\n`;
  msg += `• [T2] 火星文 (mart) - 权重: ${w2} (几率: ${pct(w2)})${isEnabledStr(2)}\n`;
  msg += `• [T3] 拼音化 (piny) - 权重: ${w3} (几率: ${pct(w3)})${isEnabledStr(3)}\n`;
  msg += `• [T4] 极客文 (leet) - 权重: ${w4} (几率: ${pct(w4)})${isEnabledStr(4)}\n\n`;

  msg += "2️⃣ 【修饰与外挂层 Decorations & Affixes】(可以使用 --affix 指定)\n";
  msg += `• [D0] 不做处理 - 权重: ${wd0} (几率: ${pctD(wd0)})\n`;
  msg += `• [D1] 前置挂件 (prefix) - 权重: ${wd1} (几率: ${pctD(wd1)})${isAffixEnabledStr('prefix')}\n`;
  msg += `• [D2] 后置挂件 (suffix) - 权重: ${wd2} (几率: ${pctD(wd2)})${isAffixEnabledStr('suffix')}\n`;
  msg += `• [D3] 火星包边 (martian) - 权重: ${wd3} (几率: ${pctD(wd3)})${isAffixEnabledStr('martian')}\n`;
  for (const type of customTypes) {
    const w = customWeights[type] || 0;
    msg += `• [自定义] ${type} - 权重: ${w} (几率: ${pctD(w)})${isAffixEnabledStr(type)}\n`;
  }
  msg += "\n";

  const allAffixes = getAvailableAffixes(config);
  const allTypes = Array.from(new Set(allAffixes.map(a => a.type)));

  const sortedTypes = [...allTypes].sort((a, b) => {
    const rank = (t: string) => {
      if (t === "martian") return 1;
      if (t === "prefix") return 2;
      if (t === "suffix") return 3;
      return 4;
    };
    return rank(a) - rank(b);
  });

  for (const type of sortedTypes) {
    const isEnabled = config.enabledTypes?.[type] ?? true;
    const isEnabledLabel = isEnabled ? "" : " (已全局禁用)";
    msg += `• 分类: 【${type}】${isEnabledLabel}\n`;

    const candidates = allAffixes.filter(a => a.type === type);
    if (candidates.length === 0) {
      msg += "  (当前该分类列表为空)\n";
    } else {
      let typeMsg = "  ";
      candidates.forEach((c, i) => {
        const display = c.left && c.right ? `${c.left}...${c.right}` : (c.left || c.right);
        typeMsg += `${i + 1}. ${display}  `;
        if ((i + 1) % 4 === 0) typeMsg += "\n  ";
      });
      if (candidates.length % 4 !== 0) typeMsg += "\n";
      msg += typeMsg;
    }
    msg += "\n";
  }

  msg += "💡 提示：使用 -d, --decor 指定各修饰与外挂层，输入 none 禁用某项。代号 d1 代表 prefix，d2 代表 suffix，d3 代表 martian，如 -d d1:1,d2:none\n";
  msg += "📝 示例：subid 雪芝麻糊 -t trad -d d1:1,d2:none,martian:none";
  return msg;
}

export function apply(ctx: Context, config: Config) {
  config = config || {} as Config;

  ctx.command("subid [keyword]", "次文化 ID 生成器")
    .alias("subculture-id")
    .option("list", "-l                    显示支持的变换样式、修饰与外挂分类列表及编号代号")
    .option("iter", "-i <iter:number>      指定核心变换的叠加迭代次数 (候选: 1-10 之间的数字，默认从配置读取)")
    .option("trans", "-t <trans:string>    指定核心变换与叠加顺序 (支持逗号分隔，或无逗号纯数字如 12。候选: t1/trad/1 (简转繁), t2/mart/2 (火星文), t3/piny/3 (拼音化), t4/leet/4 (极客文), none/0 (不做处理))")
    .option("coreMode", "-c <coreMode:string> 指定核心变换处理模式 (候选: each 逐字处理, all 整段处理)")
    .option("affixIter", "-y <affixIter:number> 指定修饰与外挂层的叠加迭代次数 (候选: 1-10 之间的数字，默认从配置读取)")
    .option("decor", "-d <decor:string>    指定特定类型的修饰符 (格式为 type:value，多项逗号分隔。type 候选: d1/prefix, d2/suffix, d3/martian，或自定义分类；value 候选: none 禁用，或自定义文本。如 d1:ʚ,d2:none)")
    .option("martian", "-m <martian:string>  控制火星包边左右配对模式 (候选: none 禁用, mix 随机混搭, pair 对称配对)")
    .example("subid 雪芝麻糊 -d d1:ʚ,d2:none -t trad -m none (固定前置挂件，禁用后缀，应用简转繁核心变换且禁用火星包边)")
    .example("subid 雪芝麻糊 -t 12 -c all                           (对所有文字整体应用简转繁和火星文变换)")
    .action(async (argv, keyword) => {
      const { options, session } = argv;
      if (options.list) {
        return getListMessage(config);
      }

      let targetKeyword = keyword;

      const hasQuotes = (text: string) => /["'“”‘’]/.test(text);
      const rawSource = (argv as any).source || session?.content || "";
      if (rawSource && hasQuotes(rawSource)) {
        let rawContent = rawSource;
        const cmdName = argv.command?.name;
        if (cmdName && rawContent.startsWith(cmdName)) {
          rawContent = rawContent.slice(cmdName.length).trim();
        } else {
          rawContent = rawContent.replace(/^\S+\s*/, '');
        }
        const quoteRegex = /(?:"([^"]*)"|'([^']*)'|“([^”]*)”|‘([^’]*)’)/s;
        const match = rawContent.match(quoteRegex);
        if (match) {
          targetKeyword = match[1] ?? match[2] ?? match[3] ?? match[4];
        }
      }

      if (!targetKeyword) {
        await session.send("请输入关键词以生成 ID：");
        const replied = await session.prompt(30000);
        if (!replied) {
          return "等待超时（30秒内未收到回复）";
        }
        const quoteRegex = /(?:"([^"]*)"|'([^']*)'|“([^”]*)”|‘([^’]*)’)/s;
        const match = replied.match(quoteRegex);
        if (match) {
          targetKeyword = match[1] ?? match[2] ?? match[3] ?? match[4];
        } else {
          targetKeyword = replied;
        }
      }

      const processed = applyTransformers(targetKeyword, options.trans, options.iter, options.martian, config, options.coreMode);

      const specified: Record<string, string> = {};
      if (options.decor) {
        const parts = options.decor.split(",");
        for (const part of parts) {
          const colonIndex = part.indexOf(":");
          if (colonIndex > 0) {
            let t = part.slice(0, colonIndex).trim().toLowerCase();
            const val = part.slice(colonIndex + 1).trim();

            if (t === "d1" || t === "pref" || t === "1") {
              t = "prefix";
            } else if (t === "d2" || t === "suff" || t === "2") {
              t = "suffix";
            } else if (t === "d3" || t === "mart" || t === "3") {
              t = "martian";
            } else if (t === "d0" || t === "none" || t === "0") {
              t = "none";
            }

            if (t !== "none") {
              specified[t] = val;
            }
          }
        }
      }

      const finalResult = applyAffixes(processed, specified, options.martian, config, options.affixIter);
      return finalResult;
    });

  ctx.command("subid-list", "查看次文化 ID 生成器支持的变换样式、修饰与外挂分类列表")
    .action(() => {
      return getListMessage(config);
    });
}

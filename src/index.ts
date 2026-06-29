import { Context, Schema } from "koishi";
import {
  CHAR_DB,
  PREFIXES,
  SUFFIXES,
  MARTIAN_DECORATORS,
  LEET_MAP
} from "./dict";

export const name = "subculture-id-tool";

// 定义配置接口
export interface Config {
  enableTraditional?: boolean;
  enableMartian?: boolean;
  enablePinyin?: boolean;
  enableLeetDecorate?: boolean;
  randomCombineDecorators?: boolean;
  disableBuiltinPrefixes?: boolean;
  customPrefixes?: string[];
  disableBuiltinSuffixes?: boolean;
  customSuffixes?: string[];
}

// 导出 Koishi 配置面板 Schema
export const Config: Schema<Config> = Schema.object({
  enableTraditional: Schema.boolean().default(true).description("是否启用繁体化预处理 (编号 1)"),
  enableMartian: Schema.boolean().default(true).description("是否启用火星文预处理 (编号 2)"),
  enablePinyin: Schema.boolean().default(true).description("是否启用拼音与符号预处理 (编号 3)"),
  enableLeetDecorate: Schema.boolean().default(true).description("是否启用 Leet 与加料预处理 (编号 4)"),
  randomCombineDecorators: Schema.boolean().default(true).description("是否允许火星文两端修饰符左右随机混搭组合"),
  disableBuiltinPrefixes: Schema.boolean().default(false).description("是否禁用内置的预设前缀"),
  customPrefixes: Schema.array(Schema.string()).default([]).description("自定义额外前缀列表"),
  disableBuiltinSuffixes: Schema.boolean().default(false).description("是否禁用内置的预设后缀"),
  customSuffixes: Schema.array(Schema.string()).default([]).description("自定义额外后缀列表")
});

// 预处理 1: 繁体化
function transformTraditional(text: string): string {
  return Array.from(text)
    .map(char => CHAR_DB[char]?.traditional || char)
    .join("");
}

// 预处理 2: 火星文
function transformMartian(text: string, config: Config): string {
  const converted = Array.from(text)
    .map(char => CHAR_DB[char]?.martian || char)
    .join("");

  let left = "";
  let right = "";

  if (config.randomCombineDecorators ?? true) {
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

  return `${left}${converted}${right}`;
}

// 预处理 3: 拼音化与特殊符号装饰
function transformPinyin(text: string): string {
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

  const startDecos = ["°", "★", "◇", "✿", ""];
  const endDecos = ["°", "★", "◇", "✿", ""];
  const start = startDecos[Math.floor(Math.random() * startDecos.length)];
  const end = endDecos[Math.floor(Math.random() * endDecos.length)];

  return `${start}${pinyins.join(sep)}${end}`;
}

// 预处理 4: Leetspeak 与字符加料
function transformLeetAndDecorate(text: string): string {
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

  const injectors = ["ゞ", "✿", "★", "~", "•"];
  const inj = injectors[Math.floor(Math.random() * injectors.length)];

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

// 应用预处理组合
function applyTransformers(text: string, optionVal: string | undefined, config: Config): string {
  const transMap: Record<number, (t: string, c: Config) => string> = {
    1: (t) => transformTraditional(t),
    2: (t, c) => transformMartian(t, c),
    3: (t) => transformPinyin(t),
    4: (t) => transformLeetAndDecorate(t)
  };

  if (optionVal === undefined) {
    // 过滤出所有开启的预处理方法
    const available = [1, 2, 3, 4].filter(n => isTransEnabled(n, config));
    if (available.length === 0) {
      return text;
    }
    const count = Math.min(Math.floor(Math.random() * 2) + 1, available.length);
    const selected: number[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available.splice(idx, 1)[0]);
    }
    let current = text;
    for (const num of selected) {
      current = transMap[num](current, config);
    }
    return current;
  }

  if (optionVal.toLowerCase() === "none") {
    return text;
  }

  // 解析用户指定的编号并过滤掉未开启的
  const nums = optionVal
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && transMap[n] && isTransEnabled(n, config));

  let current = text;
  for (const num of nums) {
    current = transMap[num](current, config);
  }
  return current;
}

// 获取列表展示信息
function getListMessage(config: Config): string {
  const isEnabledStr = (num: number) => isTransEnabled(num, config) ? "" : " (已全局禁用)";

  let msg = "✨ 次文化 ID 生成器 支持列表 ✨\n\n";
  msg += "【预处理方式】\n";
  msg += `1 - 繁体化 (如: 葉子)${isEnabledStr(1)}\n`;
  msg += `2 - 火星文 (如: oοО 噯 Оοo)${isEnabledStr(2)}\n`;
  msg += `3 - 拼音化 & 符号装饰 (如: ★ye_zi★)${isEnabledStr(3)}\n`;
  msg += `4 - Leetspeak & 字符加料 (如: yゞ3ゞzゞ1)${isEnabledStr(4)}\n\n`;

  const mergedPrefixes = getMergedPrefixes(config);
  msg += "【预设前缀】(使用 -p 选项，输入编号 1-N 选用)\n";
  if (mergedPrefixes.length === 0) {
    msg += "(列表为空，已全局禁用/未配置前缀)\n";
  } else {
    mergedPrefixes.forEach((p, i) => {
      msg += `${i + 1}. ${p}  `;
      if ((i + 1) % 5 === 0) msg += "\n";
    });
    if (mergedPrefixes.length % 5 !== 0) msg += "\n";
  }
  msg += "\n";

  const mergedSuffixes = getMergedSuffixes(config);
  msg += "【预设后缀】(使用 -s 选项，输入编号 1-N 选用)\n";
  if (mergedSuffixes.length === 0) {
    msg += "(列表为空，已全局禁用/未配置后缀)\n";
  } else {
    mergedSuffixes.forEach((s, i) => {
      msg += `${i + 1}. ${s}  `;
      if ((i + 1) % 5 === 0) msg += "\n";
    });
    if (mergedSuffixes.length % 5 !== 0) msg += "\n";
  }

  msg += "\n💡 提示：使用 -p, -s, -t 选项可以固定前置/后置/预处理组合，或输入 none 禁用某项处理。";
  return msg;
}

export function apply(ctx: Context, config: Config) {
  ctx.command("subid [keyword]", "次文化 ID 生成器")
    .alias("subculture-id")
    .option("prefix", "-p <prefix:string>  指定前缀 (输入编号选用预设，none 禁用，或自定义)")
    .option("suffix", "-s <suffix:string>  指定后缀 (输入编号选用预设，none 禁用，或自定义)")
    .option("trans", "-t <trans:string>    指定预处理 (输入逗号分隔的编号如 1,2，none 禁用)")
    .option("list", "-l                    显示支持的预处理和前后缀列表与编号")
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
      const processed = applyTransformers(targetKeyword, options.trans, config);

      return `${prefix}${processed}${suffix}`;
    });

  ctx.command("subid-list", "查看次文化 ID 生成器支持的预处理 and 前后缀列表")
    .action(() => {
      return getListMessage(config);
    });
}

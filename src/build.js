/*
 * 构建脚本：把 开源模块 + 闭源核心 组装成用户脚本
 *
 * 产物：
 *   dist/小红书自动获客助手.user.js            完整可读版（作者本地自用，勿分发）
 *   dist/小红书自动获客助手-obfuscated.user.js 发布版（开源模块可读 + 核心模块混淆）
 *
 * 用法：
 *   npm install javascript-obfuscator
 *   node build.js
 *
 * 注意：本仓库不含核心模块（src/core/core.js）与赞赏码图片（src/assets/donate.png），
 * 完整构建仅作者可执行；本仓库中的 open/ 模块可直接阅读与贡献。
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(SRC, '..', 'dist');
let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require('javascript-obfuscator');
} catch {
  console.error('请先安装依赖: npm install javascript-obfuscator');
  process.exit(1);
}

const metadata = fs.readFileSync(path.join(SRC, 'header.meta.js'), 'utf8').trim();
const openRuntime = fs.readFileSync(path.join(SRC, 'open', '01-runtime.js'), 'utf8');
const core = fs.readFileSync(path.join(SRC, 'core', 'core.js'), 'utf8');
const openPanel = fs.readFileSync(path.join(SRC, 'open', '20-panel.js'), 'utf8');
const openDonate = fs.readFileSync(path.join(SRC, 'open', '40-donate.js'), 'utf8');
const openMain = fs.readFileSync(path.join(SRC, 'open', '30-main.js'), 'utf8');

const donatePng = fs.readFileSync(path.join(SRC, 'assets', 'donate.png'));
const donateDataUrl = 'data:image/png;base64,' + donatePng.toString('base64');
const openDonateWithImage = openDonate.replaceAll('__DONATE_IMG_DATA_URL__', donateDataUrl);

const OPEN_BANNER =
  '// ============================================================\n' +
  '// 开源模块（MIT License）· 源码与文档见项目主页\n' +
  '// ============================================================\n';
const CORE_BANNER =
  '// ============================================================\n' +
  '// 核心引擎（专有代码，已混淆）· 未经授权禁止逆向或二次分发\n' +
  '// ============================================================\n';

function assemble(coreCode) {
  return (
    '(function () {\n' +
    openRuntime + '\n' +
    coreCode + '\n' +
    openPanel + '\n' +
    openDonateWithImage + '\n' +
    openMain + '\n' +
    '})();\n'
  );
}

function obfuscateCore(code) {
  return JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    simplify: true,
    stringArray: true,
    stringArrayThreshold: 1,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersType: 'function',
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    debugProtection: false,
    selfDefending: false,
    disableConsoleOutput: false,
    renameGlobals: false,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  }).getObfuscatedCode();
}

fs.mkdirSync(DIST, { recursive: true });

const dev = metadata + '\n\n' + assemble(CORE_BANNER + core);
fs.writeFileSync(path.join(DIST, '小红书自动获客助手.user.js'), dev, 'utf8');
console.log('完整可读版 -> dist/小红书自动获客助手.user.js (' + Math.round(dev.length / 1024) + ' KB)');

const release =
  metadata + '\n\n' +
  OPEN_BANNER + assemble(CORE_BANNER + '\n' + obfuscateCore(core));
fs.writeFileSync(path.join(DIST, '小红书自动获客助手-obfuscated.user.js'), release, 'utf8');
console.log('混淆发布版 -> dist/小红书自动获客助手-obfuscated.user.js (' + Math.round(release.length / 1024) + ' KB)');

// 同步一份发布版到公开仓库目录（若存在），供 git 提交推送
const REPO_DIST = path.join(SRC, '..', '..', 'XHShuokezhushou', 'dist');
if (fs.existsSync(path.join(REPO_DIST, '..', 'LICENSE'))) {
  fs.mkdirSync(REPO_DIST, { recursive: true });
  fs.writeFileSync(path.join(REPO_DIST, '小红书自动获客助手-obfuscated.user.js'), release, 'utf8');
  console.log('已同步到公开仓库 -> XHShuokezhushou/dist/小红书自动获客助手-obfuscated.user.js');
}

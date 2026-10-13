// 截图脚本:puppeteer-core + 系统 Chrome;拍前把真实 IP 打码为文档地址
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const OUT = "docs/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--lang=zh-CN", "--use-angle=metal"],
});
const page = await browser.newPage();
// 反无头检测补丁:截图展示用
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

// IP 打码:所有文本节点里的 IPv4/IPv6 换成文档地址
const maskIps = async () => {
  await page.evaluate(() => {
    const v4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (v4.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(v4, (m) => (m.startsWith("127.") || m.startsWith("0.") ? m : "203.0.113.66"));
      if (n.nodeValue.includes(":") && /[0-9a-f]{2,4}:[0-9a-f:]+/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\b[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){2,7}\b/gi, "2001:db8::1");
    }
  });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) 首页(hero)
await page.goto("http://localhost:3000/zh", { waitUntil: "networkidle2", timeout: 30000 });
await sleep(1200);
await maskIps();
await page.screenshot({ path: `${OUT}/01-hero.png` });
console.log("01-hero ok");

// 2) 点击开始检测,等结果
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => /开始检测/.test(b.textContent || ""));
  if (btn) btn.click();
});
// 等待进度面板出现再等结果卡
// 进度中截图(检测启动 6 秒后)
await sleep(6000);
await maskIps();
await page.screenshot({ path: `${OUT}/02-progress.png` });
// 等真正完成:模式切换按钮出现 + 出口身份卡标题
try {
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((b) => b.textContent.trim() === "专业") && document.body.textContent.includes("出口身份"), { timeout: 120000 });
} catch {
  console.log("等待结果超时,继续");
}
await sleep(2000);

// 滚动到结果
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("h3")).find((h) => /出口身份/.test(h.previousElementSibling?.textContent || h.parentElement?.textContent || "")) || document.querySelector(".card");
  if (el) el.scrollIntoView({ block: "start" });
});
await sleep(800);
await maskIps();
await page.screenshot({ path: `${OUT}/03-simple-results.png` });
console.log("03 simple ok");

// 滚到研判+建议
await page.evaluate(() => window.scrollBy(0, 700));
await sleep(600);
await maskIps();
await page.screenshot({ path: `${OUT}/04-inference-advice.png` });

// 3) 专业视图
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "专业");
  if (btn) btn.click();
});
await sleep(1200);
await page.evaluate(() => window.scrollTo(0, 350));
await sleep(600);
await maskIps();
await page.screenshot({ path: `${OUT}/05-pro-view.png` });
console.log("05 pro ok");

// 4) 英文
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().toUpperCase() === "EN");
  if (btn) btn.click();
});
await sleep(1500);
await page.evaluate(() => window.scrollTo(0, 350));
await maskIps();
await page.screenshot({ path: `${OUT}/06-en.png` });

// 5) 暗色(回到中文 + 主题切换)
await page.evaluate(() => {
  const zh = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "中");
  if (zh) zh.click();
});
await sleep(1200);
await page.evaluate(() => {
  const theme = document.querySelector('button[aria-label="theme"]');
  if (theme) theme.click();
});
await sleep(800);
await page.evaluate(() => window.scrollTo(0, 300));
await maskIps();
await page.screenshot({ path: `${OUT}/07-dark.png` });
console.log("07 dark ok");

await browser.close();
console.log("all done");

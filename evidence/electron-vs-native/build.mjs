import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const S = new URL("..", import.meta.url).pathname;
const icon = (name, color) => {
  const svg = readFileSync(join(S, "icons", `${name}.svg`), "utf8")
    .replace(/<title>.*?<\/title>/, "")
    .replace("<svg ", `<svg fill="${color}" `);
  return `<img class="ico" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}">`;
};
const mono = (txt, bg) => `<span class="mono" style="background:${bg}">${txt}</span>`;

const ELECTRON = "#7a828e", GPUI = "#e8590c";

const css = `
*{box-sizing:border-box;margin:0}
body{background:transparent;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,sans-serif;color:#1f2328;-webkit-font-smoothing:antialiased}
.card{width:1000px;background:#fff;border:1px solid #d8dee4;border-radius:16px;padding:28px 30px 20px;overflow:hidden}
h1{font-size:21px;font-weight:700;letter-spacing:-.01em}
.sub{color:#59636e;font-size:13px;margin-top:4px}
.legend{display:flex;gap:18px;margin-top:14px;font-size:13px;color:#3d444d}
.legend span{display:inline-flex;align-items:center;gap:7px}
.sw{width:12px;height:12px;border-radius:3px;display:inline-block}
.ico{width:16px;height:16px;vertical-align:-3px}
.mono{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:6px;color:#fff;font-size:10px;font-weight:800;letter-spacing:-.02em}
table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13.5px}
th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:#59636e;font-weight:600;padding:0 10px 9px;border-bottom:1px solid #d8dee4}
td{padding:11px 10px;border-bottom:1px solid #eef1f4;vertical-align:middle}
tr:last-child td{border-bottom:none}
.metric{font-weight:600;white-space:nowrap}
.metric small{display:block;font-weight:400;color:#59636e;font-size:11.5px;margin-top:2px}
.bars{display:grid;grid-template-columns:1fr;gap:4px;min-width:250px}
.bar{white-space:nowrap;display:flex;align-items:center;gap:8px;font-variant-numeric:tabular-nums;font-size:12.5px}
.bar i{display:block;height:9px;border-radius:5px}
.pill{display:inline-block;padding:3px 9px;border-radius:999px;font-weight:700;font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap}
.good{background:#dafbe1;color:#116329}
.foot{margin-top:14px;padding-top:12px;border-top:1px solid #eef1f4;color:#6e7781;font-size:11.5px;line-height:1.5}
.proj{display:flex;align-items:center;gap:10px;font-weight:600;white-space:nowrap}
.proj .ico{width:22px;height:22px}
.proj small{display:block;font-weight:400;color:#59636e;font-size:11.5px}
.path{display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:12.5px}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:7px;background:#f3f4f6;border:1px solid #e5e7eb;font-weight:600}
.chip.to{background:#fff4ec;border-color:#ffd8bf;color:#9a3a06}
.arrow{color:#8c959f}
.res{color:#3d444d;line-height:1.45;font-size:12.5px}
.res b{color:#1f2328}
code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;background:#f3f4f6;padding:1px 4px;border-radius:4px}
.wide{width:1120px}
.q{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:700;white-space:nowrap}
.q-high{background:#dafbe1;color:#116329}.q-med{background:#fff8c5;color:#7d4e00}.q-low{background:#ffebe9;color:#a40e26}.q-sig{background:#ddf4ff;color:#0550ae}
`;

// ---------- Table 1: T3 Electron vs GPUI ----------
const rows1 = [
  ["Time to window shown", "ms, lower is better", [1066, 684], [489, 375], "ms"],
  ["Client memory", "Win: private · macOS: footprint", [381, 140], [625, 260], "MB"],
  ["Resident / working set", "client process tree", [748, 95], [763, 151], "MB"],
  ["Idle CPU", "30 s, display awake", [2.9, 0.05], [4.7, 1.1], "% core"],
  ["Install / app size", "", [761, 129], [487, 124], "MB"],
  ["Client processes", "", [4, 1], [4, 1], ""],
];
const pair = ([e, g], max, unit) => `<div class="bars">
  <div class="bar"><i style="width:${Math.max(3, (e / max) * 170)}px;background:${ELECTRON}"></i>${e} ${unit}</div>
  <div class="bar"><i style="width:${Math.max(3, (g / max) * 170)}px;background:${GPUI}"></i><b>${g} ${unit}</b></div></div>`;
const delta = ([e, g]) => {
  const r = e / g;
  return r >= 3 ? `${r.toFixed(r >= 10 ? 0 : 1)}× less` : `−${Math.round((1 - g / e) * 100)}%`;
};
const t1 = `<div class="card">
<h1>T3 Code desktop client: Electron vs native GPUI prototype</h1>
<div class="sub">Same machine, same seeded database, same server bundle (Nightly 0.1.10-nightly.20261111). Medians of 5 runs. Server process excluded.</div>
<div class="legend"><span><span class="sw" style="background:${ELECTRON}"></span>${icon("electron", ELECTRON)} Electron Nightly</span><span><span class="sw" style="background:${GPUI}"></span>${icon("rust", GPUI)} GPUI build from #32012</span></div>
<table><thead><tr><th>Metric</th><th>Windows 11 · i7-8700K</th><th></th><th>macOS · M3 Pro</th><th></th></tr></thead><tbody>
${rows1.map(([m, s, w, mac, u]) => {
  const max = Math.max(...w, ...mac);
  return `<tr><td class="metric">${m}${s ? `<small>${s}</small>` : ""}</td>
  <td>${pair(w, max, u)}</td><td><span class="pill good">${delta(w)}</span></td>
  <td>${pair(mac, max, u)}</td><td><span class="pill good">${delta(mac)}</span></td></tr>`;
}).join("")}
</tbody></table>
<div class="foot">Source: github.com/pingdotgg/t3code/discussions/32012, measured Nov 11 2026 by the author. n = 1 machine per OS. Server memory differs (GPUI uses system Node): 289 vs 246 MB on Windows, 344 vs 252 MB on macOS. GPUI build lacks some features (dictation, Device panel, installers, signing, auto-update).</div>
</div>`;

// ---------- Table 2: industry migrations ----------
const chip = (ic, label, to) => `<span class="chip${to ? " to" : ""}">${ic}${label}</span>`;
const E = chip(icon("electron", "#47848f"), "Electron");
const sizeBar = (b, a) => b ? `<div class="bars" style="min-width:150px">
  <div class="bar"><i style="width:${(b / 761) * 120}px;background:${ELECTRON}"></i>${b} MB</div>
  <div class="bar"><i style="width:${Math.max(3, (a / 761) * 120)}px;background:${GPUI}"></i><b>${a} MB</b> <span class="pill good" style="padding:1px 7px;font-size:11px">−${Math.round((1 - a / b) * 100)}%</span></div></div>` : `<span style="color:#8c959f;font-size:12px">not published</span>`;
const rows2 = [
  [mono("T3", "#111"), "T3 Code (#32012)", "Nov 2026 · community prototype", E + `<span class="arrow">→</span>` + chip(icon("rust", "#9a3a06"), "GPUI", 1),
    "<b>−58–63% client memory</b>, 23–36% faster window, 4–58× less idle CPU. Controlled A/B on Windows and macOS.", [761, 129], ["q-high", "Controlled A/B"]],
  [icon("discord", "#5865F2"), "Discord", "Nov 4 2026 · CTO announcement", E + `<span class="arrow">→</span>` + chip(icon("rust", "#9a3a06"), "GPUI", 1),
    "Early Windows build at <b>~290 MB</b> with two accounts open. Chose GPUI over Tauri; maintains GPUI patches. Video stays in a webview.", null, ["q-low", "Low: 1 screenshot"]],
  [icon("zedindustries", "#084CCF"), "Zed (Atom team)", "Atom → new editor", chip(icon("electron", "#47848f"), "Atom") + `<span class="arrow">→</span>` + chip(icon("rust", "#9a3a06"), "GPUI", 1),
    "Vendor claims <b>&lt;1 s startup</b>, &lt;10 ms typing latency, 3–4× less RAM than VS Code.", null, ["q-low", "Vendor, no method"]],
  [mono("Fx", "#2563eb"), "Fluxzy Desktop", "May 2026 · after 5 months", E + `<span class="arrow">→</span>` + chip(icon("tauri", "#9a3a06"), "Tauri", 1),
    "Kept Angular UI + .NET sidecar. Startup “dramatically better” (author: no clean benchmark). Needed a bridge release for auto-update.", [190, 55], ["q-med", "Medium"]],
  [mono("Wm", "#0f766e"), "WatchMe", "Sep 2026 · macOS menu-bar app", E + `<span class="arrow">→</span>` + chip(icon("tauri", "#9a3a06"), "Tauri 2", 1),
    "Measured with <code>du -sh</code>. npm deps fell, but <b>+499 Rust crates</b> and 5.8 GB build artifacts.", [289, 15], ["q-med", "Medium: size only"]],
  [mono("Jan", "#18181b"), "Jan", "v0.6.0 · production", E + `<span class="arrow">→</span>` + chip(icon("tauri", "#9a3a06"), "Tauri", 1),
    "Shipped to users with a redesigned UI. No performance numbers published.", null, ["q-sig", "Signal only"]],
  [mono("T", "#4b53bc"), "Microsoft Teams 2.0", "2023", E + `<span class="arrow">→</span>` + chip("", "WebView2", 1),
    "Not Rust, but drops bundled Chromium. Microsoft claims <b>up to 2× faster</b> launch, up to 50% less memory.", null, ["q-low", "Vendor “up to”"]],
];
const t2 = `<div class="card wide">
<h1>Recent migrations away from Electron</h1>
<div class="sub">Direction is consistent; magnitude and rigor vary. Only the T3 row is a controlled comparison.</div>
<table><thead><tr><th>Project</th><th>Path</th><th>Reported result</th><th>App / installer size</th><th>Evidence</th></tr></thead><tbody>
${rows2.map(([ic, name, when, path, res, size, [qc, ql]]) => `<tr>
<td><div class="proj">${ic}<div>${name}<small>${when}</small></div></div></td>
<td><div class="path">${path}</div></td>
<td class="res" style="width:330px">${res}</td>
<td>${size ? sizeBar(...size) : sizeBar()}</td>
<td><span class="q ${qc}">${ql}</span></td></tr>`).join("")}
</tbody></table>
<div class="foot">Sources: t3code#32012 · x.com/svishnevskiy/status/2118081920194203799 and dev.to/jamilxt analysis · zed.dev/compare/vscode · fluxzy.io blog (May 2026) · dev.to/hamdi_laadhari (WatchMe) · Jan v0.6.0 release · Microsoft Tech Community (Mar 2023). Sizes: T3 = Windows install; Fluxzy = Windows installer; WatchMe = macOS .app. Logos are trademarks of their owners, used for identification only.</div>
</div>`;

// ---------- Table 3: startup speed ----------
const MAXMS = 5000;
const msBar = (v, color, label, bold) => `<div class="bar"><i style="width:${Math.max(3, (v / MAXMS) * 170)}px;background:${color}"></i>${bold ? `<b>${label}</b>` : label}</div>`;
const RUST = chip(icon("rust", "#9a3a06"), "Rust", 1), GP = chip(icon("rust", "#9a3a06"), "GPUI", 1), TA = chip(icon("tauri", "#9a3a06"), "Tauri", 1);
const arrow = `<span class="arrow">→</span>`;
const rows3 = [
  [mono("T3", "#111"), "T3 Code (#32012)", "Nov 2026 · Windows 11, i7-8700K", E + arrow + GP, "Launch → window shown", [1066, "1066 ms"], [684, "684 ms"], "−36%", "5-run median, same DB and server", ["q-high", "Instrumented"]],
  [mono("T3", "#111"), "T3 Code (#32012)", "Nov 2026 · macOS, M3 Pro", E + arrow + GP, "Launch → window shown", [489, "489 ms"], [375, "375 ms"], "−23%", "5-run median, same DB and server", ["q-high", "Instrumented"]],
  [mono("RL", "#7c3aed"), "RiftLauncher", "Sep 2026 · Linux, Ryzen 9 9900X", E + arrow + TA, "Spawn → Home interactive", [1164, "1164 ms"], [235, "235 ms"], "5.0× faster", "Same front end, 5 cold runs, GPU off both sides", ["q-high", "Instrumented"]],
  [icon("discord", "#5865F2"), "Discord", "Nov 2026 · Windows 11 ThinkPads", E + arrow + GP, "Launch → usable UI", [5000, "≈5 s"], [3500, "&lt;3.5 s (window &lt;1 s)"], "≥1.4× faster", "Read frame by frame from a 15 s CTO video", ["q-low", "Eyeballed video"]],
  [mono("A1", "#0e7490"), "A1 Slice", "Oct 2026 · Linux x86_64", E + arrow + RUST, "Cold start", [3000, "2.5–3.5 s"], [100, "&lt;100 ms"], "~30× faster", "No method published", ["q-low", "Self-reported"]],
  [icon("zedindustries", "#084CCF"), "Zed vs VS Code", "vendor page, May 2026", chip(icon("electron", "#47848f"), "VS Code") + arrow + GP, "Startup", [4000, "3–5+ s"], [1000, "&lt;1 s"], "3–5× faster", "VS Code with extensions; no method", ["q-low", "Vendor, no method"]],
  [mono("T", "#4b53bc"), "Microsoft Teams 2.0", "2023 · Windows", E + arrow + chip("", "WebView2", 1), "App launch", null, null, "up to 2×", "Microsoft launch benchmark, no absolute times", ["q-low", "Vendor “up to”"]],
];
const t3 = `<div class="card" style="width:1240px">
<h1>Startup speed before and after leaving Electron</h1>
<div class="sub">Every source shows faster startup, from 1.3× to 30×. Only the top three rows were instrumented with repeated runs.</div>
<div class="legend"><span><span class="sw" style="background:${ELECTRON}"></span>${icon("electron", ELECTRON)} Electron (before)</span><span><span class="sw" style="background:${GPUI}"></span>After migration</span><span style="color:#59636e">Bars on one shared scale, 0–5 s</span></div>
<table><thead><tr><th>Project</th><th>Path</th><th>Measured</th><th>Before → after</th><th>Change</th><th>Evidence</th></tr></thead><tbody>
${rows3.map(([ic, name, when, path, what, b, a, d, how, [qc, ql]]) => `<tr>
<td><div class="proj">${ic}<div>${name}<small>${when}</small></div></div></td>
<td><div class="path">${path}</div></td>
<td class="res" style="width:240px"><b>${what}</b><br><span style="color:#59636e;font-size:11.5px">${how}</span></td>
<td>${b ? `<div class="bars" style="min-width:230px">${msBar(b[0], ELECTRON, b[1])}${msBar(a[0], GPUI, a[1], 1)}</div>` : `<span style="color:#8c959f;font-size:12px">no absolute times</span>`}</td>
<td><span class="pill good">${d}</span></td>
<td><span class="q ${qc}">${ql}</span></td></tr>`).join("")}
</tbody></table>
<div class="foot">Sources: t3code#32012 · github.com/StratumServer/RiftLauncher/issues/456 · windowslatest.com (Nov 6 2026, frame-by-frame read of Discord CTO video) · thea1lab.com/blog/replacing-electron-with-rust · zed.dev/compare/vscode · Microsoft Tech Community / TechSpot (2023). End points differ between rows, so compare the change within a row, not across rows. Discord's “after” is an upper bound: the Rust client was launched 1.5 s later and had its friends list loaded when Electron reached its UI.</div>
</div>`;

const browser = await chromium.launch({ executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" });
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1320, height: 800 } });
for (const [name, body] of [["table-t3-electron-vs-gpui", t1], ["table-migrations", t2], ["table-startup-speed", t3]]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div style="padding:0">${body}</div></body></html>`;
  writeFileSync(join(S, `${name}.html`), html);
  await page.setContent(html);
  const card = page.locator(".card");
  const box = await card.boundingBox();
  await card.screenshot({ path: join(S, `${name}.png`), omitBackground: true });
  console.log(name, Math.round(box.width), Math.round(box.height));
}
await browser.close();

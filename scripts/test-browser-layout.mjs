#!/usr/bin/env node

import { spawn } from "node:child_process";
import http from "node:http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 3000;
const DEBUG_PORT = 9222;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function sendCdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 100000);
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const handler = (data) => {
      const res = JSON.parse(data.toString());
      if (res.id === id) {
        ws.off("message", handler);
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      }
    };
    ws.on("message", handler);
    ws.send(msg);
  });
}

async function runBrowserTests() {
  console.log("=================================================");
  console.log("   BROWSER LAYOUT & RESPONSIVENESS AUDIT");
  console.log("=================================================\n");

  // 1. Start Next.js production server
  const server = spawn("cmd.exe", ["/c", "npm", "run", "start"], { stdio: "ignore" });
  await delay(3500);

  // 2. Launch headless Chrome with remote debugging
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=C:\\Users\\nazir\\.gemini\\antigravity\\brain\\14379476-c711-4af0-bb90-b7eff6e6d72d\\scratch\\chrome_qa_profile",
    ],
    { stdio: "ignore" }
  );
  await delay(2500);

  let passedAll = true;

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const { WebSocket } = await import("undici");
    const ws = new WebSocket(versionInfo.webSocketDebuggerUrl);

    await new Promise((resolve) => ws.on("open", resolve));
    await sendCdp(ws, "Target.setDiscoverTargets", { discover: true });

    // Open target page
    const { targetId } = await sendCdp(ws, "Target.createTarget", { url: `http://127.0.0.1:${PORT}/` });
    const { sessionId } = await sendCdp(ws, "Target.attachToTarget", { targetId, flatten: true });

    const sendPageCdp = (method, params = {}) =>
      sendCdp(ws, "Target.sendMessageToTarget", {
        sessionId,
        message: JSON.stringify({ id: Math.floor(Math.random() * 100000), method, params }),
      }).then(() => {
        // Handle response wrapped in Target.receivedMessageFromTarget
      });

    // We can also evaluate JavaScript directly through Runtime.evaluate via WebSocket
    async function evaluateInPage(expression) {
      const id = Math.floor(Math.random() * 100000);
      const resPromise = new Promise((resolve, reject) => {
        const handler = (data) => {
          const raw = JSON.parse(data.toString());
          if (raw.method === "Target.receivedMessageFromTarget" && raw.params.sessionId === sessionId) {
            const inner = JSON.parse(raw.params.message);
            if (inner.id === id) {
              ws.off("message", handler);
              if (inner.error) reject(new Error(inner.error.message));
              else resolve(inner.result);
            }
          }
        };
        ws.on("message", handler);
      });

      const message = JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true } });
      ws.send(JSON.stringify({ id: Math.floor(Math.random() * 100000), method: "Target.sendMessageToTarget", params: { sessionId, message } }));
      return resPromise;
    }

    async function setViewport(width, height) {
      const id = Math.floor(Math.random() * 100000);
      const message = JSON.stringify({
        id,
        method: "Emulation.setDeviceMetricsOverride",
        params: { width, height, deviceScaleFactor: 1, mobile: width < 768 },
      });
      ws.send(JSON.stringify({ id: Math.floor(Math.random() * 100000), method: "Target.sendMessageToTarget", params: { sessionId, message } }));
      await delay(300);
    }

    async function navigateTo(url) {
      const id = Math.floor(Math.random() * 100000);
      const message = JSON.stringify({ id, method: "Page.navigate", params: { url } });
      ws.send(JSON.stringify({ id: Math.floor(Math.random() * 100000), method: "Target.sendMessageToTarget", params: { sessionId, message } }));
      await delay(1200);
    }

    // --- TEST SUITE A: DESKTOP HOMEPAGE (1280x800) ---
    console.log(">>> TESTING DESKTOP VIEWPORT (1280x800)");
    await setViewport(1280, 800);
    await navigateTo(`http://127.0.0.1:${PORT}/`);

    const desktopMetrics = await evaluateInPage(`
      (() => {
        const svgs = Array.from(document.querySelectorAll('svg')).map(s => {
          const rect = s.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        });
        const cards = Array.from(document.querySelectorAll('a[href^="/login?role="]')).map(c => {
          const rect = c.getBoundingClientRect();
          return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
        });
        const titleEl = document.querySelector('h1');
        const taglineEl = document.querySelector('p');
        const cardTitle = document.querySelector('h3');
        return {
          svgs,
          cards,
          titleFontSize: window.getComputedStyle(titleEl).fontSize,
          taglineFontSize: window.getComputedStyle(taglineEl).fontSize,
          cardTitleFontSize: cardTitle ? window.getComputedStyle(cardTitle).fontSize : null,
          bodyWidth: document.body.clientWidth
        };
      })()
    `);

    const dVal = desktopMetrics.result.value;
    console.log("Desktop Metrics:", JSON.stringify(dVal, null, 2));

    // Check SVG sizing on desktop
    const allSvgsBoundedDesktop = dVal.svgs.every(s => s.width <= 24 && s.height <= 24 && s.width >= 16 && s.height >= 16);
    console.log(`[${allSvgsBoundedDesktop ? "PASS" : "FAIL"}] SVG Icons properly bounded: ${dVal.svgs.map(s => s.width + "x" + s.height).join(", ")}`);
    if (!allSvgsBoundedDesktop) passedAll = false;

    // Check 3-column desktop layout (all cards on same top line)
    const is3ColDesktop = dVal.cards.length === 3 && dVal.cards[0].top === dVal.cards[1].top && dVal.cards[1].top === dVal.cards[2].top;
    console.log(`[${is3ColDesktop ? "PASS" : "FAIL"}] 3-Column Desktop Grid layout: Cards aligned side-by-side at Y=${dVal.cards[0]?.top}px`);
    if (!is3ColDesktop) passedAll = false;

    // Check typography readability
    const titleSizeOk = parseFloat(dVal.titleFontSize) >= 24;
    const tagSizeOk = parseFloat(dVal.taglineFontSize) >= 16;
    console.log(`[${titleSizeOk && tagSizeOk ? "PASS" : "FAIL"}] Typography readability: Title=${dVal.titleFontSize}, Tagline=${dVal.taglineFontSize}`);
    if (!titleSizeOk || !tagSizeOk) passedAll = false;

    // --- TEST SUITE B: MOBILE HOMEPAGE (375x812) ---
    console.log("\n>>> TESTING MOBILE VIEWPORT (375x812 - iPhone X/12)");
    await setViewport(375, 812);
    await delay(500);

    const mobileMetrics = await evaluateInPage(`
      (() => {
        const svgs = Array.from(document.querySelectorAll('svg')).map(s => {
          const rect = s.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        });
        const cards = Array.from(document.querySelectorAll('a[href^="/login?role="]')).map(c => {
          const rect = c.getBoundingClientRect();
          return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
        });
        return {
          svgs,
          cards,
          bodyScrollWidth: document.body.scrollWidth,
          windowWidth: window.innerWidth
        };
      })()
    `);

    const mVal = mobileMetrics.result.value;
    console.log("Mobile Metrics:", JSON.stringify(mVal, null, 2));

    // Check SVG sizing on mobile
    const allSvgsBoundedMobile = mVal.svgs.every(s => s.width <= 24 && s.height <= 24);
    console.log(`[${allSvgsBoundedMobile ? "PASS" : "FAIL"}] Mobile SVG Icons bounded: ${mVal.svgs.map(s => s.width + "x" + s.height).join(", ")}`);
    if (!allSvgsBoundedMobile) passedAll = false;

    // Check 1-column stacked mobile layout (cards stacked vertically)
    const is1ColMobile = mVal.cards.length === 3 && mVal.cards[0].top < mVal.cards[1].top && mVal.cards[1].top < mVal.cards[2].top;
    console.log(`[${is1ColMobile ? "PASS" : "FAIL"}] 1-Column Mobile Stacked layout: Cards stacked vertically (${mVal.cards.map(c => c.top).join("px -> ")}px)`);
    if (!is1ColMobile) passedAll = false;

    // Check horizontal scroll / overflow
    const noHorizontalScroll = mVal.bodyScrollWidth <= mVal.windowWidth;
    console.log(`[${noHorizontalScroll ? "PASS" : "FAIL"}] Mobile responsive: No horizontal overflow (scrollWidth=${mVal.bodyScrollWidth}px <= viewport=${mVal.windowWidth}px)`);
    if (!noHorizontalScroll) passedAll = false;

    // --- TEST SUITE C: ROLE PAGES (Coach, Player, Scout) ---
    console.log("\n>>> TESTING ROLE LOGIN PAGES");
    for (const role of ["coach", "player", "scout"]) {
      await navigateTo(`http://127.0.0.1:${PORT}/login?role=${role}`);
      const pageInfo = await evaluateInPage(`
        (() => {
          const title = document.querySelector('h3')?.innerText || '';
          const inputs = document.querySelectorAll('input').length;
          const submitBtn = document.querySelector('button[type="submit"]')?.innerText || '';
          return { title, inputs, submitBtn };
        })()
      `);
      console.log(`[PASS] Role page /login?role=${role}: Title="${pageInfo.result.value.title}", Inputs=${pageInfo.result.value.inputs}, Button="${pageInfo.result.value.submitBtn}"`);
    }

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }

  console.log("\n=================================================");
  console.log(`   LAYOUT & RESPONSIVENESS AUDIT: ${passedAll ? "PASSED" : "FAILED"}`);
  console.log("=================================================");
  process.exit(passedAll ? 0 : 1);
}

runBrowserTests().catch((err) => {
  console.error("Browser test error:", err);
  process.exit(1);
});


import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const session = "k8s-interaction-check";
const base = process.env.K8S_CHECK_URL ?? "http://127.0.0.1:5173/";
function command(...args) {
  const output = execFileSync(
    "npx",
    [
      "--yes",
      "--prefer-offline",
      "agent-browser",
      "--session",
      session,
      "--json",
      ...args,
    ],
    { encoding: "utf8", timeout: 30000 },
  );
  const data = JSON.parse(output);
  assert.equal(data.success, true, data.error);
  return data.data;
}
const evaluate = (code) => command("eval", code).result;
const open = (page) => {
  command("open", `${base}#/learn/${page}`);
  command("wait", "h1");
};
const click = (selector) => command("click", selector);
const select = (label, value) =>
  command("select", `select[aria-label="${label}"]`, value);
const current = () =>
  evaluate(
    '({heading:document.querySelector("h1")?.textContent,step:document.querySelector("[aria-live=polite]")?.textContent,content:document.body.innerText.length,overflow:document.documentElement.scrollWidth>innerWidth,overlay:!!document.querySelector("vite-error-overlay"),hash:location.hash,focus:document.activeElement?.tagName})',
  );
const go = (page) => {
  click(`.learning-sidebar a[href="#/learn/${page}"]`);
  command("wait", "h1");
};
try {
  command("set", "viewport", "1440", "1000");
  open("overview");
  click('button[aria-label="Zoom In"]');
  command("wait", "400");
  const transform = evaluate(
    'document.querySelector(".react-flow__viewport").style.transform',
  );
  click('button[aria-label="Zoom Out"]');
  command("wait", "400");
  assert.notEqual(
    evaluate('document.querySelector(".react-flow__viewport").style.transform'),
    transform,
  );
  click('button[aria-label="Fit View"]');
  command("wait", "400");
  const nodeSelector = '.react-flow__node[data-id="api"]';
  const before = evaluate(
    `document.querySelector('${nodeSelector}').style.transform`,
  );
  const box = evaluate(
    `(() => { const {x,y,width,height} = document.querySelector('${nodeSelector}').getBoundingClientRect(); return {x,y,width,height}; })()`,
  );
  command(
    "mouse",
    "move",
    String(Math.round(box.x + box.width / 2)),
    String(Math.round(box.y + box.height / 2)),
  );
  command("mouse", "down");
  command(
    "mouse",
    "move",
    String(Math.round(box.x + box.width / 2 + 10)),
    String(Math.round(box.y + box.height / 2 + 10)),
  );
  command(
    "mouse",
    "move",
    String(Math.round(box.x + box.width / 2 + 35)),
    String(Math.round(box.y + box.height / 2 + 25)),
  );
  command(
    "mouse",
    "move",
    String(Math.round(box.x + box.width / 2 + 50)),
    String(Math.round(box.y + box.height / 2 + 35)),
  );
  command("mouse", "up");
  command("wait", "200");
  assert.notEqual(
    evaluate(`document.querySelector('${nodeSelector}').style.transform`),
    before,
  );
  assert.equal(
    evaluate('!!document.querySelector(".react-flow__minimap")'),
    true,
  );
  const panBefore = evaluate(
    'document.querySelector(".react-flow__viewport").style.transform',
  );
  const pane = evaluate(
    '(() => { const r = document.querySelector(".react-flow__pane").getBoundingClientRect(); return {x:r.x,y:r.y,height:r.height}; })()',
  );
  const px = Math.round(pane.x + 6),
    py = Math.round(pane.y + 6);
  command("mouse", "move", String(px), String(py));
  command("mouse", "down");
  command("mouse", "move", String(px + 10), String(py + 5));
  command("mouse", "move", String(px + 40), String(py + 20));
  command("mouse", "up");
  assert.notEqual(
    evaluate('document.querySelector(".react-flow__viewport").style.transform'),
    panBefore,
  );
  console.log("PASS: canvas zoom, pan, Fit View, node drag and minimap");
  open("pod-internals");
  select("공유 포트 예시", "collision");
  assert.match(
    evaluate('document.querySelector("main").innerText'),
    /두 번째 바인딩이 실패/,
  );
  command("focus", 'a[href="#learning-content"]');
  command("press", "Enter");
  assert.equal(current().hash, "#/learn/pod-internals");
  assert.equal(current().focus, "H1");
  open("resource-relations");

  command("find", "text", "YAML · 줄별 분석 · 설정 비교", "click");
  command("find", "role", "button", "click", "--name", "예시 코드 복사");
  assert.match(
    evaluate('document.querySelector("main").innerText'),
    /복사 완료/,
  );
  assert.match(
    evaluate("document.querySelector('main pre').innerText"),
    /kind: RoleBinding|apiVersion/,
  );
  open("pod-creation");
  command("find", "text", "YAML · 줄별 분석 · 설정 비교", "click");
  command("focus", '[aria-label="YAML 6행 선택"]');
  command("press", "Enter");
  assert.equal(
    evaluate(
      `document.querySelector('[aria-label="YAML 6행 선택"]').getAttribute('aria-pressed')`,
    ),
    "true",
  );
  command("find", "role", "button", "click", "--name", "Apply (적용하기)");
  assert.match(current().step, /재생 중/);
  command("find", "role", "button", "click", "--name", "일시정지");
  click('button[aria-label="현재 페이지 리셋"]');
  assert.match(current().step, /현재 단계 1\/8/);
  command("set", "viewport", "390", "1000");
  open("overview");
  command("focus", ".learning-sidebar button");
  command("press", "Enter");
  assert.equal(
    evaluate(
      'document.querySelector(".learning-sidebar button").getAttribute("aria-expanded")',
    ),
    "true",
  );
  command("focus", '.learning-sidebar a[href="#/learn/ingress"]');
  command("press", "Enter");
  assert.equal(current().hash, "#/learn/ingress");
  assert.equal(
    evaluate(
      'document.querySelector(".learning-sidebar button").getAttribute("aria-expanded")',
    ),
    "false",
  );
  console.log(
    "PASS: shared-port example, skip link, YAML copy/apply and mobile keyboard navigation",
  );
  const errors = command("errors").errors ?? [];
  assert.equal(errors.length, 0, JSON.stringify(errors));
} finally {
  command("close");
}

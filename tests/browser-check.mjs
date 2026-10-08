if (process.argv.includes("--interaction")) {
  await import("./interaction-check.mjs");
  process.exit(0);
}
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const session = "k8s-learning-check";
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
const pages = [
  "overview",
  "pod-creation",
  "statefulset-creation",
  "pod-internals",
  "service-networking",
  "ingress",
  "resource-relations",
  "configmap-secret",
  "volume-types",
  "persistent-storage",
  "pod-lifecycle",
];
const report = [];
mkdirSync("/private/tmp/k8s-learning-check", { recursive: true });
try {
  for (const width of [1440, 1024, 390]) {
    command("set", "viewport", String(width), "1000");
    for (const page of pages) {
      open(page);
      let state = current();
      assert.ok(state.content > 500, `${page} blank`);
      assert.equal(state.overlay, false);
      assert.equal(
        state.overflow,
        false,
        `${page} baseline overflow at ${width}`,
      );
      assert.equal(state.hash, `#/learn/${page}`);
      assert.equal(state.focus, "H1");
      evaluate(
        'document.querySelectorAll("main details").forEach(d => d.open = true)',
      );
      state = current();
      assert.equal(
        state.overflow,
        false,
        `${page} expanded details overflow at ${width}`,
      );
      report.push({
        page,
        width,
        heading: state.heading,
        expandedDetails: "pass",
      });
      if (
        (width === 1440 && page === "overview") ||
        (width === 390 &&
          ["ingress", "persistent-storage", "pod-lifecycle"].includes(page))
      )
        command(
          "screenshot",
          `/private/tmp/k8s-learning-check/${page}-${width}.png`,
          "--full",
        );
    }
    console.log(
      `PASS: ${pages.length} pages, navigation titles and expanded details at ${width}px`,
    );
  }
  command("set", "viewport", "1440", "1000");
  open("overview");
  for (let i = 1; i < pages.length; i++) {
    click('nav[aria-label="이전·다음 학습"] a:last-child');
    assert.equal(current().hash, `#/learn/${pages[i]}`);
  }
  command("back");
  assert.equal(current().hash, "#/learn/persistent-storage");
  command("forward");
  assert.equal(current().hash, "#/learn/pod-lifecycle");
  command("reload");
  assert.equal(current().heading, "Pod 라이프사이클");
  console.log("PASS: previous/next learning, history and reload");

  go("statefulset-creation");
  click('button[aria-label^="단계 3:"]');
  assert.match(evaluate(`document.querySelector('[aria-label="web-0 식별자와 저장소"]').innerText`), /Pending/);
  assert.match(evaluate(`document.querySelector('[aria-label="web-1 식별자와 저장소"]').innerText`), /Pod 없음/);
  click('button[aria-label^="단계 7:"]');
  assert.match(evaluate(`document.querySelector('[aria-label="web-0 식별자와 저장소"]').innerText`), /web-0-original/);
  click('button[aria-label^="단계 9:"]');
  assert.match(evaluate(`document.querySelector('[aria-label="web-0 식별자와 저장소"]').innerText`), /web-0-new/);
  assert.match(evaluate(`document.querySelector('[aria-label="web-0 식별자와 저장소"]').innerText`), /data-web-0 \(Bound\)/);
  go("pod-creation");
  go("statefulset-creation");
  assert.match(current().step, /현재 단계 9\/9/);
  click('button[aria-label="현재 페이지 리셋"]');
  assert.match(current().step, /현재 단계 1\/9/);
  console.log("PASS: StatefulSet ordered creation, PVC reuse and independent page state");

  go("configmap-secret");
  click('button[aria-label^="단계 2:"]');
  assert.equal(evaluate('document.querySelectorAll("main table caption").length'), 1);
  click('button[aria-label^="단계 6:"]');
  assert.match(evaluate('document.querySelector("[data-testid=config-env-value]").innerText'), /production/);
  assert.match(evaluate('document.querySelector("[data-testid=config-file-value]").innerText'), /mode=debug/);
  go("resource-relations");
  go("configmap-secret");
  assert.match(current().step, /현재 단계 6\/6/);
  console.log("PASS: ConfigMap/Secret storage, env/file updates and page state");

  go("volume-types");
  click('button[aria-label^="단계 3:"]');
  assert.match(evaluate('document.querySelector("[data-testid=volume-content-reader]").innerText'), /hello-volume/);
  click('button[aria-label^="단계 5:"]');
  assert.match(evaluate('document.querySelector("[data-testid=volume-content-reader]").innerText'), /빈 디렉터리/);
  for (const example of ["configuration", "pvc"]) {
    select("볼륨 수명 예시", example);
    assert.match(current().step, /현재 단계 1\/5/);
    click('button[aria-label^="단계 5:"]');
    assert.match(evaluate('document.querySelector("[data-testid=volume-content-reader]").innerText'), example === "pvc" ? /hello-volume/ : /mode=production/);
  }
  go("configmap-secret");
  go("volume-types");
  assert.match(current().step, /현재 단계 5\/5/);
  console.log("PASS: volume restart, Pod replacement, source retention and page state");

  open("ingress");
  click('button[aria-label^="단계 5:"]');
  click('button[aria-label="재생 속도 2배"]');
  command("find", "role", "button", "click", "--name", "자동 재생");
  go("resource-relations");
  command("wait", "3500");
  go("ingress");
  assert.match(current().step, /현재 단계 5\/7/);
  assert.match(current().step, /일시정지/);
  assert.equal(
    evaluate(
      `document.querySelector('button[aria-label="재생 속도 2배"]').getAttribute('aria-pressed')`,
    ),
    "true",
  );
  console.log(
    "PASS: hidden Ingress playback stops; step and speed restored paused",
  );

  go("pod-internals");
  click('button[aria-label^="단계 3:"]');
  go("pod-lifecycle");
  select("라이프사이클 예시", "readiness");
  click('button[aria-label="다음 단계"]');
  assert.match(
    evaluate(`document.querySelector('[aria-label="Pod 상태"]').innerText`),
    /false/,
  );
  assert.match(
    evaluate(`document.querySelector('[aria-label="Pod 상태"]').innerText`),
    /Running/,
  );
  click('button[aria-label="현재 페이지 리셋"]');
  go("pod-internals");
  assert.match(current().step, /현재 단계 3\/5/);
  go("pod-lifecycle");
  for (const example of [
    "liveness",
    "startup",
    "crashloop",
    "completion",
    "failure",
    "replacement",
    "forced",
  ]) {
    select("라이프사이클 예시", example);
    const buttons = evaluate(
      `Array.from(document.querySelectorAll('button[aria-label^="단계 "]')).map(b=>b.getAttribute('aria-label'))`,
    );
    click(`button[aria-label=${JSON.stringify(buttons.at(-1))}]`);
    assert.ok(current().content > 500);
  }
  console.log(
    "PASS: independent Pod page state; all lifecycle example branches",
  );

  go("ingress");
  for (const condition of ["no-controller", "unmatched", "no-backend"]) {
    select("Ingress 요청 조건", condition);
    click('button[aria-label="다음 단계"]');
    assert.match(current().step, /2\/2/);
  }
  go("persistent-storage");
  for (const policy of ["delete", "retain"]) {
    select("저장소 예시", policy);
    click('button[aria-label="다음 단계"]');
    assert.match(current().step, /2\/2/);
  }
  go("pod-creation");
  command("select", "#creation-preset", "service-ingress");
  assert.equal(current().hash, "#/learn/service-networking");
  console.log("PASS: Ingress errors, PVC reclaim policies, Service-only route");

  command("find", "role", "button", "click", "--name", "구성 요소 백과사전");
  assert.equal(evaluate('!!document.querySelector("dialog[open]")'), true);
  command(
    "find",
    "role",
    "button",
    "click",
    "--name",
    "CSI Controller / external-provisioner",
  );
  assert.match(
    evaluate('document.querySelector("dialog[open]").innerText'),
    /cloud-controller-manager와 별도/,
  );
  command("press", "Escape");
  assert.equal(evaluate('!!document.querySelector("dialog[open]")'), false);
  console.log(
    "PASS: encyclopedia component list, CSI details and Escape close",
  );
  const errors = command("errors").errors ?? [];
  assert.equal(errors.length, 0, JSON.stringify(errors));
  writeFileSync(
    "/private/tmp/k8s-learning-check/results.json",
    JSON.stringify({ routes: report, checks: "passed", errors }, null, 2),
  );
  console.log(
    "PASS: no browser exceptions; report saved to /private/tmp/k8s-learning-check/results.json",
  );
} finally {
  command("close");
}

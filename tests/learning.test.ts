import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialLearningState,
  learningReducer,
} from "../src/hooks/learningState";
import {
  LEARNING_PAGES,
  pageFromHash,
  pageHref,
} from "../src/data/learningPages";
import {
  CREATION_STEPS,
  SERVICE_STEPS,
  STORAGE_STEPS,
  INGRESS_STEPS,
} from "../src/data/learningScenarios";
import { MODE2_STEPS } from "../src/data/mode2Steps";
import { LIFECYCLE_EXAMPLES } from "../src/data/lifecycleExamples";

test("all eight pages have independent, addressable entry points", () => {
  assert.equal(LEARNING_PAGES.length, 8);
  assert.equal(new Set(LEARNING_PAGES.map((p) => p.id)).size, 8);
  for (const page of LEARNING_PAGES)
    assert.equal(pageFromHash(pageHref(page.id)), page.id);
  assert.equal(pageFromHash("#/learn/missing"), "overview");
});
test("navigation pauses hidden playback and restores the visited page step", () => {
  let state = initialLearningState("ingress");
  state = learningReducer(state, {
    type: "update",
    patch: { index: 3, playing: true, speed: 2 },
  });
  state = learningReducer(state, { type: "navigate", page: "pod-internals" });
  assert.equal(state.progress.ingress.playing, false);
  assert.equal(state.progress.ingress.index, 3);
  state = learningReducer(state, {
    type: "advance",
    page: "ingress",
    total: 7,
  });
  assert.equal(state.progress.ingress.index, 3);
  state = learningReducer(state, { type: "navigate", page: "ingress" });
  assert.equal(state.progress.ingress.index, 3);
  assert.equal(state.progress.ingress.speed, 2);
  assert.equal(state.progress.ingress.playing, false);
});
test("shared Pod visualization pages reset and play independently", () => {
  let state = initialLearningState("pod-internals");
  state = learningReducer(state, {
    type: "update",
    patch: { index: 2, speed: 2 },
  });
  state = learningReducer(state, { type: "navigate", page: "pod-lifecycle" });
  state = learningReducer(state, {
    type: "update",
    patch: { index: 4, example: "readiness" },
  });
  state = learningReducer(state, { type: "reset" });
  assert.equal(state.progress["pod-internals"].index, 2);
  assert.equal(state.progress["pod-lifecycle"].index, 0);
  assert.equal(state.progress["pod-lifecycle"].playing, false);
});
test("playback reaches the final step and stops", () => {
  let state = initialLearningState("ingress");
  state = learningReducer(state, {
    type: "update",
    patch: { playing: true, index: 5 },
  });
  state = learningReducer(state, {
    type: "advance",
    page: "ingress",
    total: 7,
  });
  assert.equal(state.progress.ingress.index, 6);
  assert.equal(state.progress.ingress.playing, false);
});
test("Service-only apply uses Service steps and never creates a Pod", () => {
  assert.equal(SERVICE_STEPS.length, 5);
  assert.ok(SERVICE_STEPS.every((s) => s.phase === "service"));
  assert.ok(
    SERVICE_STEPS.every(
      (s) =>
        !s.etcdState?.records.some(
          (r) => r.type === "Pod" && r.action === "created",
        ),
    ),
  );
});
test("all visible Pod phases are official, including sandbox and example branches", () => {
  const official = new Set([
    "Pending",
    "Running",
    "Succeeded",
    "Failed",
    "Unknown",
  ]);
  for (const s of [
    ...MODE2_STEPS,
    ...Object.values(LIFECYCLE_EXAMPLES).flatMap((e) => e.steps),
  ])
    assert.ok(official.has(s.phase));
  assert.equal(MODE2_STEPS.find((s) => s.id === "sandbox")?.phase, "Pending");
  for (const s of CREATION_STEPS) {
    for (const p of s.podsState) assert.ok(official.has(p.podPhase!));
    for (const r of s.etcdState?.records ?? [])
      if (r.type === "Pod") assert.ok(official.has(r.data.status.phase));
  }
});
test("readiness failure does not restart; container restart and Pod replacement have different identities", () => {
  const failed = LIFECYCLE_EXAMPLES.readiness.steps[1];
  assert.equal(failed.ready, false);
  assert.equal(failed.containerState, "Running");
  assert.equal(failed.restartCount, 0);
  const restarted = LIFECYCLE_EXAMPLES.liveness.steps.at(-1)!;
  const original = LIFECYCLE_EXAMPLES.liveness.steps[0];
  assert.equal(restarted.uid, original.uid);
  assert.equal(restarted.restartCount, 1);
  assert.notEqual(
    LIFECYCLE_EXAMPLES.replacement.steps.at(-1)!.uid,
    original.uid,
  );
  assert.equal(LIFECYCLE_EXAMPLES.completion.steps.at(-1)!.phase, "Succeeded");
  assert.equal(LIFECYCLE_EXAMPLES.failure.steps.at(-1)!.phase, "Failed");
});
test("storage provisioner is distinct from cloud-controller-manager and defers final scheduling", () => {
  assert.ok(STORAGE_STEPS[2].activeComponents.includes("csiController"));
  assert.ok(
    STORAGE_STEPS.every(
      (s) =>
        !s.packets.some(
          (p) =>
            p.from === "cloudControllerManager" ||
            p.to === "cloudControllerManager",
        ),
    ),
  );
  const earlyPod = STORAGE_STEPS[1].etcdState?.records.find(
    (r) => r.type === "Pod",
  );
  assert.equal(earlyPod?.data.spec?.nodeName, undefined);
  assert.equal(STORAGE_STEPS[0].awsEbsState, undefined);
  assert.notEqual(
    STORAGE_STEPS[7].podsState[0].uid,
    STORAGE_STEPS[6].podsState[0].uid,
  );
});
test("Ingress requests select distinct service backends", () => {
  assert.equal(INGRESS_STEPS[4].activeRoute?.path, "/orders");
  assert.equal(INGRESS_STEPS[5].activeRoute?.path, "/products");
  assert.notEqual(
    INGRESS_STEPS[4].activeRoute?.targetService,
    INGRESS_STEPS[5].activeRoute?.targetService,
  );
});

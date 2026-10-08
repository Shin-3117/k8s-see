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
import { STATEFULSET_STEPS } from "../src/data/statefulsetSteps";
import { CONFIG_SECRET_STEPS } from "../src/data/configSecretSteps";
import { VOLUME_EXAMPLES, volumeExample, volumeSteps } from "../src/data/volumeExamples";
import { BATCH_EXAMPLES, batchSteps } from "../src/data/jobCronJobSteps";
import { CERT_MANAGER_STEPS, certManagerSteps } from "../src/data/certManagerSteps";

test("all thirteen pages have independent, addressable entry points", () => {
  assert.equal(LEARNING_PAGES.length, 13);
  assert.equal(new Set(LEARNING_PAGES.map((p) => p.id)).size, 13);
  for (const page of LEARNING_PAGES)
    assert.equal(pageFromHash(pageHref(page.id)), page.id);
  assert.equal(pageFromHash("#/learn/missing"), "overview");
});
test("certificate issuance creates matching references and a TLS Secret only after validation", () => {
  const records = (index: number) => CERT_MANAGER_STEPS[index].etcdState!.records;
  const ingress = records(2).find((record) => record.type === "Ingress")!.data;
  const certificate = records(3).find((record) => record.type === "Certificate")!.data;
  assert.equal(ingress.metadata.annotations["cert-manager.io/cluster-issuer"], certificate.spec.issuerRef.name);
  assert.equal(ingress.spec.tls[0].secretName, certificate.spec.secretName);
  assert.deepEqual(ingress.spec.tls[0].hosts, certificate.spec.dnsNames);
  assert.equal(records(4).find((record) => record.type === "Challenge")!.data.status.state, "pending");
  assert.equal(records(5).find((record) => record.type === "Challenge")!.data.status.state, "valid");
  assert.ok(CERT_MANAGER_STEPS.slice(0, 6).every((step) => !step.tlsReady && !step.etcdState!.records.some((record) => record.type === "Secret")));
  const issued = records(6).find((record) => record.type === "Secret")!.data;
  assert.equal(issued.type, "kubernetes.io/tls");
  assert.deepEqual(Object.keys(issued.data), ["tls.crt", "tls.key"]);
  assert.equal(issued.metadata.namespace, ingress.metadata.namespace);
  assert.equal(records(8).find((record) => record.type === "Certificate")!.data.status.revision, 2);
  assert.equal(records(8).find((record) => record.type === "Secret")!.data.metadata.name, issued.metadata.name);
});
test("failed certificate prerequisites stop before TLS readiness without changing the normal scenario", () => {
  for (const example of ["no-cert-manager", "issuer-not-ready", "http01-failed"]) {
    const steps = certManagerSteps(example);
    assert.ok(steps.every((step) => !step.tlsReady && !step.etcdState!.records.some((record) => record.type === "Secret")));
  }
  const issuerFailure = certManagerSteps("issuer-not-ready").at(-1)!;
  assert.equal(issuerFailure.etcdState!.records[0].data.status.conditions[0].status, "False");
  const httpFailure = certManagerSteps("http01-failed").at(-1)!;
  assert.equal(httpFailure.etcdState!.records.find((record) => record.type === "Challenge")!.data.status.state, "pending");
  assert.equal(CERT_MANAGER_STEPS[5].etcdState!.records.find((record) => record.type === "Challenge")!.data.status.state, "valid");
  assert.equal(CERT_MANAGER_STEPS[1].etcdState!.records[0].data.status.conditions[0].status, "True");
});
test("navigation initializes newly added pages in an existing session", () => {
  const state = initialLearningState("configmap-secret");
  state.progress["configmap-secret"] = { ...state.progress["configmap-secret"], index: 3, speed: 2, playing: true };
  // Simulate a tab that was already open before the Volume page was added.
  delete (state.progress as Partial<typeof state.progress>)["volume-types"];
  const next = learningReducer(state, { type: "navigate", page: pageFromHash("#/learn/volume-types") });
  assert.equal(next.page, "volume-types");
  assert.equal(next.progress["volume-types"].index, 0);
  assert.equal(next.progress["volume-types"].playing, false);
  assert.equal(next.progress["configmap-secret"].index, 3);
  assert.equal(next.progress["configmap-secret"].speed, 2);
  assert.equal(next.progress["configmap-secret"].playing, false);
});
test("emptyDir survives container restart but is empty in a replacement Pod", () => {
  const steps = volumeSteps(volumeExample("normal"));
  assert.equal(steps.length, 5);
  assert.equal(steps[1].volumeState.content, "hello-volume");
  assert.equal(steps[2].volumeState.content, "hello-volume");
  assert.equal(steps[1].volumeState.podUid, steps[2].volumeState.podUid);
  assert.equal(steps[2].podsState[0].restarts, 1);
  assert.equal(steps[3].volumeState.mounted, false);
  assert.equal(steps[3].podsState.length, 0);
  assert.equal(steps[3].etcdState!.records.length, 0);
  assert.notEqual(steps[4].volumeState.podUid, steps[1].volumeState.podUid);
  assert.equal(steps[4].volumeState.content, "빈 디렉터리");
  assert.match(steps[4].cliLogs[0].output[0], /No such file/);
});
test("configuration sources and PVCs outlive the example Pod with valid mount references", () => {
  for (const example of Object.values(VOLUME_EXAMPLES)) {
    const steps = volumeSteps(example);
    for (const step of steps) {
      const pod = step.etcdState!.records.find((r) => r.type === "Pod");
      if (pod) for (const container of pod.data.spec.containers) {
        assert.ok(container.volumeMounts.every((mount: { name: string }) => pod.data.spec.volumes.some((v: { name: string }) => v.name === mount.name)));
      }
    }
    if (example.id === "emptydir") continue;
    const sources = (index: number) => steps[index].etcdState!.records.filter((r) => r.type !== "Pod").map((r) => r.data);
    assert.deepEqual(sources(1), sources(3));
    assert.deepEqual(sources(1), sources(4));
    assert.equal(steps[1].volumeState.content, steps[4].volumeState.content);
    assert.notEqual(steps[1].volumeState.node, steps[4].volumeState.node);
    assert.equal(steps[4].podsState[0].restarts, 0);
  }
});
test("ConfigMap and Secret are stored separately before an explicitly created Pod", () => {
  const saved = CONFIG_SECRET_STEPS[1];
  assert.equal(saved.podsState.length, 0);
  assert.deepEqual(saved.etcdState!.records.map((r) => r.type), ["ConfigMap", "Secret"]);
  const secret = saved.etcdState!.records.find((r) => r.type === "Secret")!;
  assert.equal(secret.key, "/registry/secrets/default/app-secret");
  assert.equal(secret.data.stringData, undefined);
  assert.equal(Buffer.from(secret.data.data.password, "base64").toString(), "demo-only");
  const pod = CONFIG_SECRET_STEPS[2].etcdState!.records.find((r) => r.type === "Pod")!;
  assert.equal(pod.data.spec.containers[0].env[0].valueFrom.configMapKeyRef.name, "app-settings");
  assert.equal(pod.data.spec.containers[0].env[1].valueFrom.secretKeyRef.name, "app-secret");
  assert.equal(pod.data.spec.volumes[0].configMap.name, "app-settings");
  assert.equal(pod.data.spec.volumes[1].secret.secretName, "app-secret");
  assert.ok(CONFIG_SECRET_STEPS.every((step) => step.packets.every((p) => p.from !== "etcd" || p.to === "apiserver")));
  assert.ok(CONFIG_SECRET_STEPS.every((step) => step.packets.every((p) => p.to !== "etcd" || p.from === "apiserver")));
});
test("configuration updates preserve the running Pod and show different env/file behavior", () => {
  const before = CONFIG_SECRET_STEPS[4], after = CONFIG_SECRET_STEPS[5];
  const records = after.etcdState!.records;
  assert.equal(records.find((r) => r.type === "ConfigMap")!.data.data.APP_MODE, "debug");
  assert.equal(Buffer.from(records.find((r) => r.type === "Secret")!.data.data.password, "base64").toString(), "demo-only-v2");
  assert.deepEqual(before.podsState, after.podsState);
  assert.match(after.cliLogs[0].output[0], /production/);
  assert.match(after.cliLogs[1].output[0], /mode=debug/);
  let state = initialLearningState("configmap-secret");
  state = learningReducer(state, { type: "update", patch: { index: 5, playing: true } });
  state = learningReducer(state, { type: "navigate", page: "resource-relations" });
  assert.equal(state.progress["configmap-secret"].playing, false);
  state = learningReducer(state, { type: "navigate", page: "configmap-secret" });
  assert.equal(state.progress["configmap-secret"].index, 5);
});
test("StatefulSet creates ordered Pods directly with independent claims", () => {
  const records = (index: number) => STATEFULSET_STEPS[index].etcdState!.records;
  assert.ok(STATEFULSET_STEPS.every((step) => !step.etcdState?.records.some((r) => r.type === "ReplicaSet" || r.type === "Deployment")));
  assert.equal(records(1).find((r) => r.type === "Service")?.data.spec.clusterIP, "None");
  assert.ok(!records(1).some((r) => r.type === "Pod"));
  assert.ok(records(2).some((r) => r.type === "Pod" && r.data.metadata.name === "web-0"));
  assert.ok(!records(2).some((r) => r.data.metadata.name === "web-1"));
  assert.equal(records(2).find((r) => r.type === "Pod")?.data.spec.nodeName, undefined);
  assert.equal(STATEFULSET_STEPS[2].podsState.length, 0);
  const firstReady = records(4).find((r) => r.type === "Pod")!;
  assert.equal(firstReady.data.status.conditions[0].status, "True");
  assert.ok(records(5).some((r) => r.type === "Pod" && r.data.metadata.name === "web-1"));
  const pods = records(6).filter((r) => r.type === "Pod");
  assert.equal(pods.length, 2);
  assert.deepEqual(pods.map((r) => r.data.spec.volumes[0].persistentVolumeClaim.claimName), ["data-web-0", "data-web-1"]);
  assert.ok(pods.every((r) => r.data.metadata.ownerReferences[0].kind === "StatefulSet"));
});
test("StatefulSet replacement keeps name and claim while changing Pod UID and IP", () => {
  const before = STATEFULSET_STEPS[6].etcdState!.records;
  const deleted = STATEFULSET_STEPS[7].etcdState!.records;
  const after = STATEFULSET_STEPS[8].etcdState!.records;
  const findPod = (records: typeof before) => records.find((r) => r.type === "Pod" && r.data.metadata.name === "web-0")!.data;
  assert.ok(!deleted.some((r) => r.type === "Pod" && r.data.metadata.name === "web-0"));
  assert.deepEqual(before.filter((r) => r.type === "PersistentVolumeClaim").map((r) => r.data), deleted.filter((r) => r.type === "PersistentVolumeClaim").map((r) => r.data));
  const original = findPod(before), replacement = findPod(after);
  assert.equal(original.metadata.name, replacement.metadata.name);
  assert.equal(original.spec.subdomain, replacement.spec.subdomain);
  assert.notEqual(original.metadata.uid, replacement.metadata.uid);
  assert.notEqual(original.status.podIP, replacement.status.podIP);
  assert.deepEqual(original.spec.volumes, replacement.spec.volumes);
  assert.deepEqual(before.filter((r) => r.type === "PersistentVolumeClaim" || r.type === "PersistentVolume").map((r) => r.data), after.filter((r) => r.type === "PersistentVolumeClaim" || r.type === "PersistentVolume").map((r) => r.data));
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


test("Job owns Pods directly and completes after a successful Pod without keeping it running", () => {
  const steps = batchSteps("normal");
  assert.ok(steps.every((step) => !step.etcdState!.records.some((r) => ["ReplicaSet", "Deployment", "CronJob"].includes(r.type))));
  assert.equal(steps[0].etcdState!.records.filter((r) => r.type === "Pod").length, 0);
  const pending = steps[1].etcdState!.records.find((r) => r.type === "Pod")!.data;
  assert.equal(pending.spec.nodeName, undefined);
  assert.equal(pending.metadata.ownerReferences[0].kind, "Job");
  const completed = steps.at(-1)!.etcdState!.records;
  const pod = completed.find((r) => r.type === "Pod")!.data;
  const job = completed.find((r) => r.type === "Job")!.data;
  assert.equal(pod.status.phase, "Succeeded");
  assert.equal(pod.status.containerStatuses[0].state.terminated.exitCode, 0);
  assert.equal(job.status.active, 0);
  assert.equal(job.status.conditions[0].type, "Complete");
});
test("Never retries with a new Pod UID while no-retry failure stops the Job", () => {
  const records = batchSteps("retry").at(-1)!.etcdState!.records;
  const pods = records.filter((r) => r.type === "Pod");
  assert.deepEqual(pods.map((r) => r.data.status.phase), ["Failed", "Succeeded"]);
  assert.notEqual(pods[0].data.metadata.uid, pods[1].data.metadata.uid);
  assert.ok(pods.every((r) => r.data.status.containerStatuses[0].restartCount === 0));
  const job = records.find((r) => r.type === "Job")!.data;
  assert.equal(job.status.failed, 1);
  assert.equal(job.status.succeeded, 1);
  assert.equal(job.status.conditions[0].type, "Complete");
  const failed = batchSteps("failed").at(-1)!.etcdState!.records;
  assert.equal(failed.filter((r) => r.type === "Pod").length, 1);
  const failedJob = failed.find((r) => r.type === "Job")!.data;
  assert.equal(failedJob.spec.backoffLimit, 0);
  assert.equal(failedJob.status.conditions[0].reason, "BackoffLimitExceeded");
  assert.equal(failedJob.status.conditions[0].type, "Failed");
});
test("CronJob owns separate scheduled Jobs; Forbid and suspend prevent new creation", () => {
  const steps = batchSteps("cron");
  assert.deepEqual(steps[0].etcdState!.records.map((r) => r.type), ["CronJob"]);
  assert.deepEqual(steps[1].etcdState!.records.map((r) => r.type), ["CronJob", "Job"]);
  const jobs = steps.at(-1)!.etcdState!.records.filter((r) => r.type === "Job");
  assert.equal(jobs.length, 2);
  assert.notEqual(jobs[0].data.metadata.uid, jobs[1].data.metadata.uid);
  assert.ok(jobs.every((r) => r.data.metadata.ownerReferences[0].kind === "CronJob"));
  const forbid = batchSteps("forbid").at(-1)!.etcdState!.records;
  assert.equal(forbid.filter((r) => r.type === "Job").length, 1);
  assert.equal(forbid.find((r) => r.type === "Pod")!.data.status.phase, "Running");
  assert.equal(forbid.find((r) => r.type === "Job")!.data.spec.activeDeadlineSeconds, 600);
  const suspended = batchSteps("suspended").at(-1)!.etcdState!.records;
  assert.equal(suspended.length, 1);
  assert.equal(suspended[0].data.spec.suspend, true);
  for (const example of Object.keys(BATCH_EXAMPLES)) {
    for (const step of batchSteps(example)) {
      for (const record of step.etcdState!.records.filter((r) => r.type === "Pod")) {
        const ownerName = record.data.metadata.ownerReferences[0].name;
        assert.ok(step.etcdState!.records.some((r) => r.type === "Job" && r.data.metadata.name === ownerName));
      }
    }
  }
});

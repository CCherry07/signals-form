import { Updater } from "@signals-form/core";
import { test, expect } from "vitest";
import { unstable_NormalPriority as NormalPriority, unstable_IdlePriority as IdlePriority } from 'scheduler';

test("Updater with priority", async () => {
  const updater = new Updater();
  let count = 0;

  const update1 = new Promise<void>((resolve) => {
    updater.enqueueUpdate(() => {
      count++;
      expect(count).toBe(2); // This should be the second update
      resolve();
    }, IdlePriority);
  });

  const update2 = new Promise<void>((resolve) => {
    updater.enqueueUpdate(() => {
      count++;
      expect(count).toBe(1); // This should be the first update
      resolve();
    }, NormalPriority);
  });

  const update3 = new Promise<void>((resolve) => {
    updater.enqueueUpdate(() => {
      count++;
      expect(count).toBe(3); // This should be the third update
      resolve();
    }, IdlePriority);
  });

  // 等待所有更新任务执行完毕
  await Promise.all([update1, update2, update3]);

  // 验证最终的计数值
  expect(count).toBe(3);
});

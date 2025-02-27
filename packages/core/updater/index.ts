import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority } from 'scheduler';

type UpdateCallback = () => void;

export class Updater {
  private updateQueue: UpdateCallback[] = [];
  private isUpdating: boolean = false;
  private endUpdateCallbacks: Set<() => void> = new Set();

  enqueueUpdate(callback: UpdateCallback, priority: number = NormalPriority) {
    this.updateQueue.push(() => scheduleCallback(priority, callback));
    this.scheduleUpdate();
  }

  private scheduleUpdate() {
    if (!this.isUpdating) {
      this.isUpdating = true;
      scheduleCallback(NormalPriority, this.processUpdates.bind(this));
    }
  }

  private processUpdates() {
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        update();
      }
    }
    this.isUpdating = false;
    this.endUpdateCallbacks.forEach((callback) => callback());
  }

  clear() {
    this.updateQueue.length = 0;
  }

  hasUpdate() {
    return this.updateQueue.length > 0;
  }

  getUpdateQueue() {
    return this.updateQueue;
  }

  setUpdateQueue(updateQueue: UpdateCallback[]) {
    this.updateQueue = updateQueue;
  }

  getUpdateQueueSize() {
    return this.updateQueue.length;
  }

  subscribeUpdateComplete(callback: () => void) {
    this.endUpdateCallbacks.add(callback);
  }
}


export const updater = new Updater();

updater.subscribeUpdateComplete(() => {
  console.log('All updates are complete');
});

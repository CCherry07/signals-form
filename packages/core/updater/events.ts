import { getEventPriority } from "./eventsPriority";
import { unstable_runWithPriority as runWithPriority, unstable_UserBlockingPriority as UserBlockingSchedulerPriority } from "scheduler"
export const createEventListenerWrapperWithPriority = (listener: Function) => {
  const eventPriority = getEventPriority(listener.name)
  let listenerWrapper: Function
  switch (eventPriority) {
    case DiscreteEvent:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case UserBlockingEvent:
      listenerWrapper = dispatchUserBlockingUpdate;
      break;
    case ContinuousEvent:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(listener)
}

function dispatchUserBlockingUpdate<T>(this: T, listener: Function) {
  return runWithPriority(UserBlockingSchedulerPriority, () => {
    listener.call(this);
  });
}

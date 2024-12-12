import { createElement, useEffect, useState } from 'react';
import { Filed, toValue, run, type DecoratorInject, BoolValues } from "@rxform/core"
import { effect } from "@preact/signals-core"
interface Props {
  filed: Filed & DecoratorInject;
  model: any
  bools: BoolValues
};
function bindingMethods(filed: Filed) {
  const methodsMap = {} as Record<string, Function>
  // @ts-ignore
  Object.getOwnPropertyNames(filed.__proto__).forEach(method => {
    // @ts-ignore
    if (typeof filed[method] === 'function' && method !== 'constructor' && method !== "data2model" && method !== "model2data" && method !== "component") {
      // @ts-ignore
      methodsMap[method as any] = filed[method]?.bind(filed)
    }
  })
  return methodsMap
}

export function FieldControl(props: Props) {
  const { filed, model, bools } = props;
  const [state, setState] = useState(toValue(filed.value));
  useEffect(() => {
    const stop = effect(() => {
      console.log("filed effect", toValue(filed.value));
      
      setState(toValue(filed.value))
    })
    return stop
  }, [])
  const events = Object.fromEntries(Object.entries(filed.events!).map(([e, flow]) => {
    return [e, async function (...args: any[]) {
      // @ts-ignore
      const data = await filed[e].call(filed, ...args)
      console.log("filed event", e, data);
      run.call(filed, flow, data, bools, model).subscribe({
        next: (res) => {
          console.log("filed event next", e, res);
        },
      })
    }]
  }))
  const methodsMap = bindingMethods(filed)
  // @ts-ignore
  return createElement(filed.component, {
    ...filed,
    value: state,
    ...methodsMap,
    ...events
    // @ts-ignore
  }, filed.children);
}

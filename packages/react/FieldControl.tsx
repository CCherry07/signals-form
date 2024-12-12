import { createElement, useEffect, useState } from 'react';
import { Filed, toValue } from "@rxform/core"
import { effect } from "@preact/signals-core"
interface Props {
  filed: Filed;
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
  const { filed } = props;
  const [state, setState] = useState(toValue(filed.value));
  useEffect(() => {
    const stop = effect(() => {
      setState(toValue(filed.value))
    })
    return stop
  }, [])
  const methodsMap = bindingMethods(filed)
  // @ts-ignore
  return createElement(filed.component, {
    ...filed,
    value: state,
    ...methodsMap
    // @ts-ignore
  }, filed.children);
}

import { createElement, useEffect, useLayoutEffect, useState } from 'react';
import { Filed, toValue, run, type DecoratorInject, BoolValues, validate } from "@rxform/core"
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
  const [errors, setErrors] = useState(toValue(filed.errors));

  const {
    initiative,
    signal
  } = filed.validator ?? {}

  effect(() => {
    if (signal) {
      validate({ state, updateOn: "signal" }, signal.all, bools, model).then(errors => {
        filed.errors.value = errors
        setErrors(errors)
      })
    }
  })

  useLayoutEffect(() => {
    filed.onBeforeInit()
    const stop = effect(() => {
      setState(toValue(filed.value))
    })
    return stop
  }, [])
  useEffect(() => {
    filed.onInit()
    return filed.onDisplay
  }, [])
  const events = Object.fromEntries(Object.entries(filed.events!).map(([e, flow]) => {
    return [e, function (...args: any[]) {
      // @ts-ignore
      const data = (filed[e] as Function).apply(filed, args)
      run.call(filed, flow, data, bools, model).subscribe(
        {
          complete() {
            if (initiative) {
              console.log(filed.value);
              validate({ state: Number(filed.value), updateOn: e }, initiative.all, bools, model).then(errors => {
                filed.errors.value = errors
                setErrors(errors)
              })
            }
          },
        }
      )
    }]
  }))
  const methodsMap = bindingMethods(filed)
  // @ts-ignore
  return createElement(filed.component, {
    ...filed,
    errors,
    value: state,
    ...methodsMap,
    ...events
    // @ts-ignore
  }, filed.children);
}

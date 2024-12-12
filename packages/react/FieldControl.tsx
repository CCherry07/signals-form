import { createElement, useEffect, useLayoutEffect, useState } from 'react';
import { Filed, toValue, run, type DecoratorInject, BoolValues, validate } from "@rxform/core"
import { untracked } from "@preact/signals-core"
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

  useLayoutEffect(() => {
    filed.onBeforeInit()
    const stop = effect(() => {
      setState(toValue(filed.value))
    })
    return stop
  }, [])
  useEffect(() => {
    filed.onInit()
    effect(() => {
      if (signal) {
        validate({ state: filed.value, updateOn: "signal" }, signal.all, untracked(() => bools), untracked(() => model)).then(errors => {
          filed.errors.value = errors
          setErrors(errors)
        })
      }
    })
    return filed.onDisplay
  }, [])

  let events = {
    onChange(v: any) {
      console.log('onChange', v);
      
      filed.value.value = v
    }
  }

  if (filed.events) {
    console.log('filed.events', filed.events,filed.id);
    
    // @ts-ignore
    events = Object.fromEntries(Object.entries(filed.events!).map(([e, flow]) => {
      return [e, function (...args: any[]) {
        // @ts-ignore
        const data = filed[e] ? (filed[e] as Function).apply(filed, args) : args[0]
        run.call(filed, flow, data, bools, model).subscribe(
          {
            complete() {
              if (initiative) {
                validate({ state: toValue(filed.value), updateOn: e }, initiative.all, bools, model).then(errors => {
                  filed.errors.value = errors
                  setErrors(errors)
                })
              }
            },
          }
        )
      }]
    }))
  }

  const methodsMap = bindingMethods(filed)
  // @ts-ignore
  return createElement(filed.component, {
    ...filed.props,
    ...filed,
    errors,
    value: state,
    ...methodsMap,
    ...events
    // @ts-ignore
  }, filed.children);
}

import { createElement, ReactNode, useEffect, useState } from 'react';
import { Filed, toValue, run, type DecoratorInject, BoolValues, validate, toDeepValue } from "@rxform/core"
import { untracked } from "@preact/signals-core"
import { effect } from "@preact/signals-core"

interface Props {
  filed: Filed & DecoratorInject;
  model: any
  bools: BoolValues
};

// function bindingMethods(filed: Filed) {
//   const methodsMap = {} as Record<string, Function>
//   Object.getOwnPropertyNames(filed.__proto__).forEach(method => {
//     if (typeof filed[method] === 'function' && method !== 'constructor' && method !== "data2model" && method !== "model2data" && method !== "component") {
//       methodsMap[method as any] = filed[method]?.bind(filed)
//     }
//   })
//   return methodsMap
// }

function normalizeProps(filed: Filed) {
  return {
    isBlurred: filed.isBlurred,
    isFocused: filed.isFocused,
    isInit: filed.isInit,
    isDestroyed: filed.isDestroyed,
    isDisplay: filed.isDisplay,
    isDisabled: filed.isDisabled,
    isValidate: filed.isValidate,
    errors: filed.errors.value,
    value: toDeepValue(filed.value),
    // @ts-ignore
    ...filed.props
  }
}

export function FieldControl(props: Props) {
  const { filed, model, bools } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(filed))
  const [events, setEvents] = useState({})
  const {
    initiative,
    signal
  } = filed.validator ?? {}

  useEffect(() => {
    filed.onInit()
    const onDestroyValidate = effect(() => {
      if (signal) {
        validate({ state: filed.value, updateOn: "signal" }, signal.all, untracked(() => bools), untracked(() => model)).then(errors => {
          // filed.errors.value = errors
        })
      }
    })
    // TODO 更新了多次，需要优化
    const onDestroyState = effect(() => {
      console.log("state 更新了", filed.id);
      setFiledState(normalizeProps(filed))
    })
    return () => {
      onDestroyState()
      onDestroyValidate()
      filed.onDestroy()
    }
  }, [])

  useEffect(() => {
    const events = Object.fromEntries(Object.entries(filed.events || {}).map(([e, flow]) => {
      return [e, function (...args: any[]) {
        // @ts-ignore
        const data = filed[e] ? (filed[e] as Function).apply(filed, args) : args[0]
        run.call(filed, flow, data, bools, model).subscribe(
          {
            complete() {
              if (initiative) {
                validate({ state: toValue(filed.value), updateOn: e }, initiative.all, bools, model).then(errors => {
                  filed.errors.value = errors
                })
              }
            },
          }
        )
      }]
    }))
    const baseEvents = {
      onChange(info:any){
        setFiledState({
          ...filedState,
          value: info
        })
        filed.value.value = info
      },
      onBlur(_info:any){
        filed.isBlurred = true
      }
    }
    setEvents({
      ...baseEvents,
      ...events
    })
  }, [])

  function getChildren(): ReactNode[] {
    if (filed.properties) {
      return Object.entries(filed.properties).map(([id, child]) => {
        return createElement(FieldControl, {
          key: id,
          filed: child,
          model,
          bools
        })
      })
    }
    return []
  }

  return createElement("div", {
    "data-filed-id": filed.id,
  },

    createElement(filed.component, {
      ...filedState,
      ...events
    }, getChildren())
  );
}

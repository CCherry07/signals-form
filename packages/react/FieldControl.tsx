import { createElement, ReactNode, useCallback, useEffect, useState } from 'react';
import { Filed, toValue, run, type DecoratorInject, BoolValues, validate, toDeepValue, get } from "@rxform/core"
import { batch, computed, untracked } from "@preact/signals-core"
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
    isBlurred: filed.isBlurred.value,
    isFocused: filed.isFocused.value,
    isInit: filed.isInit.value,
    isDestroyed: filed.isDestroyed.value,
    isDisplay: filed.isDisplay.value,
    isDisabled: filed.isDisabled.value,
    isValid: filed.isValid.value,
    errors: filed.errors.value,
    value: toDeepValue(filed.value),
    // @ts-ignore
    ...filed.props
  }
}

export function FieldControl(props: Props) {
  const { filed, bools } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(filed))
  const [events, setEvents] = useState<Record<string, Function>>({})
  const model = computed(() => toDeepValue(props.model.value))
  const {
    initiative,
    signal
  } = filed.validator ?? {}

  useEffect(() => {
    filed.onInit?.()
    const onValidateDispose = effect(() => {
      if (signal) {
        validate({ state: filed.value, updateOn: "signal" }, signal.all, untracked(() => bools), model.value).then(errors => {
          filed.errors.value = errors
        })
      }
    })
    const onStatesDispose = effect(() => {
      batch(() => {
        filed.isDisplay.value = filed.display?.evaluate(bools) ?? true
        filed.isDisabled.value = filed.disabled?.evaluate(bools) ?? false
      })
    })

    const onSignalsDispose = effect(() => {
      if (filed.signals) {
        Object.entries(filed.signals).forEach(([signalKey, flow]) => {
          const signals = computed(() => get({ $: model.value }, signalKey))
          run.call(filed, flow, signals.value, bools, model).subscribe()
        })
      }
    })
    const onStateDispose = effect(() => {
      setFiledState(normalizeProps(filed))
    })
    return () => {
      onSignalsDispose()
      onValidateDispose()
      onStatesDispose()
      onStateDispose()
      filed.onDestroy?.()
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
                validate({ state: toValue(filed.value), updateOn: e }, initiative.all, bools, model.value).then(errors => {
                  filed.errors.value = errors
                })
              }
            },
          }
        )
      }]
    }))
    setEvents(events)
  }, [])

  const onChange = useCallback((value: any) => {
    if (events.onChange) {
      events.onChange(value)
    } else {
      filed.value.value = value
    }
  }, [events.onChange])

  const onBlur = useCallback((value: any) => {
    batch(() => {
      if (events.onBlur) {
        events.onBlur(value)
      } else {
        filed.value.value = value
      }
      filed.isFocused.value = false
      filed.isBlurred.value = true
    })
  }, [events.onBlur])

  const onFocus = useCallback(() => {
    if (events.onFocus) {
      events.onFocus()
    }
    batch(() => {
      filed.isBlurred.value = false
      filed.isFocused.value = true
    })
  }, [events.onFocus])

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
    style: {
      display: filed.isDisplay.value ? "block" : "none"
    }
  },
    createElement(filed.component, {
      ...filedState,
      ...events,
      onChange,
      onBlur,
      onFocus
    }, getChildren())
  );
}

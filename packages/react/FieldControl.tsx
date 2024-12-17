import { ComponentClass, createElement, FunctionComponent, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { Field, toValue, run, BoolValues, validate, toDeepValue, get, FiledUpdateType } from "@rxform/core"
import { batch, computed, untracked } from "@preact/signals-core"
import { effect } from "@preact/signals-core"
interface Props {
  field: Field;
  model: any
  bools: BoolValues
  resolveComponent: (component: string | FunctionComponent<any> | ComponentClass<any, any>) => string | FunctionComponent<any> | ComponentClass<any, any>
};

// function bindingMethods(field: Field) {
//   const methodsMap = {} as Record<string, Function>
//   Object.getOwnPropertyNames(field.__proto__).forEach(method => {
//     if (typeof field[method] === 'function' && method !== 'constructor' && method !== "data2model" && method !== "model2data" && method !== "component") {
//       methodsMap[method as any] = field[method]?.bind(field)
//     }
//   })
//   return methodsMap
// }

function normalizeProps(field: Field) {
  return {
    isBlurred: field.isBlurred.value,
    isFocused: field.isFocused.value,
    isInit: field.isInit.value,
    isDestroyed: field.isDestroyed.value,
    isHidden: field.isHidden.value,
    isDisabled: field.isDisabled.value,
    isValid: field.isValid.value,
    errors: field.errors.value,
    value: toDeepValue(field.value),
    ...field.props
  }
}

export const FieldControl = memo(function FieldControl(props: Props) {
  const { field, bools, resolveComponent } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const [events, setEvents] = useState<Record<string, Function>>({})
  const model = computed(() => toDeepValue(props.model.value))
  const {
    initiative,
    signal
  } = field.validator ?? {}

  useEffect(() => {
    field.onInit?.()
    const onValidateDispose = effect(() => {
      if (signal) {
        validate({ state: field.value, updateOn: "signal" }, signal.all, untracked(() => bools), model.value).then(errors => {
          if (Object.keys(errors).length === 0) {
            field.abstractModel?.cleanErrors([String(field.path)])
          } else {
            field.abstractModel?.setErrors({
              [String(field.path)]: errors
            })
          }
          field.errors.value = errors
        })
      }
    })
    field.onTrack(() => {
      setFiledState(normalizeProps(field))
    })
    const onStatesDispose = effect(() => {
      batch(() => {
        field.isHidden.value = field.hidden?.evaluate(bools) ?? false
        field.isDisabled.value = field.disabled?.evaluate(bools) ?? false
      })
    })

    const onSignalsDispose = effect(() => {
      if (field.signals) {
        Object.entries(field.signals).forEach(([signalKey, flow]) => {
          const signals = computed(() => get({ $: model.value }, signalKey))
          run.call(field, flow, signals.value, bools, model).subscribe()
        })
      }
    })
    const onStateDispose = effect(() => {
      setFiledState(normalizeProps(field))
    })
    return () => {
      onSignalsDispose()
      onValidateDispose()
      onStatesDispose()
      onStateDispose()
      field.onDestroy?.()
    }
  }, [])

  useEffect(() => {
    const events = Object.fromEntries(Object.entries(field.events || {}).map(([e, flow]) => {
      return [e, function (...args: any[]) {
        // @ts-ignore
        const data = field[e] ? (field[e] as Function).apply(field, args) : args[0]
        run.call(field, flow, data, bools, model).subscribe(
          {
            complete() {
              if (initiative) {
                validate({ state: toValue(field.value), updateOn: e }, initiative.all, bools, model.value).then(errors => {
                  field.errors.value = errors
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
      field.onUpdate({
        type: FiledUpdateType.Value,
        value
      })
    }
  }, [events.onChange])

  const onBlur = useCallback((value: any) => {
    batch(() => {
      if (events.onBlur) {
        events.onBlur(value)
      } else {
        field.onUpdate({
          type: FiledUpdateType.Value,
          value
        })
      }
      field.isFocused.value = false
      field.isBlurred.value = true
    })
  }, [events.onBlur])

  const onFocus = useCallback(() => {
    if (events.onFocus) {
      events.onFocus()
    }
    batch(() => {
      field.isBlurred.value = false
      field.isFocused.value = true
    })
  }, [events.onFocus])

  function getChildren(): ReactNode[] {
    if (field.properties) {
      return Object.entries(field.properties).map(([id, child]) => {
        return createElement(FieldControl, {
          key: id,
          field: child,
          model,
          bools,
          resolveComponent
        })
      })
    }
    return []
  }

  return createElement("div", {
    "data-field-id": field.id,
    hidden: field.isHidden.value,
  },
    createElement(resolveComponent(field.component), {
      ...filedState,
      ...events,
      onChange,
      onBlur,
      onFocus
    }, getChildren())
  );
})

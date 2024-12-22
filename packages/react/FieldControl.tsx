import { ComponentClass, createElement, FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Field, toValue, validate, toDeepValue, FiledUpdateType, normalizeSignal } from "@rxform/core"
import { batch, computed, untracked, signal } from "@preact/signals-core"
import { effect } from "@preact/signals-core"
interface Props {
  field: Field;
  model: any
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
export function FieldControl(props: Props) {
  const { field, resolveComponent } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const model = computed(() => toDeepValue(props.model.value))
  const {
    initiative,
    signal: signalValidator
  } = field.validator ?? {}

  useEffect(() => {
    field.onMounted?.()
    const onValidateDispose = effect(() => {
      if (signalValidator) {
        validate({ state: field.value, updateOn: "signal" }, signalValidator.all, untracked(() => field.bools), model.value).then(errors => {
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
        field.isHidden.value = field.hidden?.evaluate(field.bools) ?? false
        field.isDisabled.value = field.disabled?.evaluate(field.bools) ?? false
      })
    })
    const onSignalsDispose = effect(() => {
      if (field.signals) {
        Object.entries(field.signals).forEach(([signalKey, fn]) => {
          const signalValue = computed(() => normalizeSignal(signalKey, signal({ $: model.value })).value)
          fn.call(field, signalValue.value, field.bools, model.value)
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
      field.onUnmounted?.()
      field.isDestroyed.value = true
    }
  }, [])

  const events = useMemo(() => {
    return Object.fromEntries(Object.entries(field.events || {}).map(([e, fn]) => {
      return [e, function (data?: any) {
        fn.call(field, data)
        if (initiative) {
          validate({ state: toValue(field.value), updateOn: e }, initiative.all, field.bools, model.value).then(errors => {
            field.errors.value = errors
          })
        }
      }]
    }))
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
      return (field.properties).map((child) => {
        return createElement(FieldControl, {
          key: child.path,
          field: child,
          model,
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
}

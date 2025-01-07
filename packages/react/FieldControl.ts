import { ComponentClass, createElement, FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Field, toValue, validate, FiledUpdateType, normalizeSignal } from "@rxform/core"
import { computed, signal } from "alien-deepsignals"
import { effect, effectScope } from "alien-signals"
import { Resolver } from '@rxform/core';
interface Props {
  field: Field;
  model: any
  defaultValidatorEngine: string;
  resolveComponent: (component: string | FunctionComponent<any> | ComponentClass<any, any>) => string | FunctionComponent<any> | ComponentClass<any, any>
  validatorResolvers: Record<string, Resolver>
};

// function bindingMethods(field: Field) {
//   const methodsMap = {} as Record<string, Function>
//   // @ts-ignore
//   Object.getOwnPropertyNames(field.__proto__).forEach(method => {
//     // @ts-ignore
//     if (typeof field[method] === 'function' && method !== 'constructor' && method !== "setDefaultValue" && method !== "onSubmitValue" && method !== "component") {
//       // @ts-ignore
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
    value: field.value,
    ...field.props
  }
}
export function FieldControl(props: Props) {
  const { field, resolveComponent } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const model = computed(() => props.model)
  const {
    initiative,
    signal: signalValidator
  } = field.validator ?? {}

  useEffect(() => {
    field.onMounted?.()
    const scope = effectScope();
    scope.run(() => {
      effect(() => {
        if (signalValidator) {
          validate({
            state: field.value, updateOn: "signal",
            defaultValidatorEngine: props.defaultValidatorEngine,
            boolsConfig: field.bools,
            model
          }, signalValidator.all, props.validatorResolvers).then(errors => {
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
      effect(() => {
        field.isHidden.value = field.hidden?.evaluate(field.bools) ?? false
        field.isDisabled.value = field.disabled?.evaluate(field.bools) ?? false
      })
      effect(() => {
        if (field.signals) {
          Object.entries(field.signals).forEach(([signalKey, fn]) => {
            const signalValue = computed(() => normalizeSignal(signalKey, signal({ $: model.value })).value)
            fn.call(field, signalValue.value, field.bools, model.value)
          })
        }
      })
      effect(() => {
        setFiledState(normalizeProps(field))
      });
      // @ts-ignore
      (field.$effects ?? []).forEach((fn: Function) => {
        fn.call(field)
      })
    })
    field.onTrack(() => {
      setFiledState(normalizeProps(field))
    })
    field.isMounted.value = true
    return () => {
      scope.stop()
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
          validate({
            state: toValue(field.value),
            updateOn: e,
            defaultValidatorEngine: props.defaultValidatorEngine,
            boolsConfig: field.bools,
            model
          }, initiative.all, props.validatorResolvers).then(errors => {
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
      field.value = value
    }
  }, [events.onChange])

  const onBlur = useCallback((value: any) => {
    if (events.onBlur) {
      events.onBlur(value)
    } else {
      field.value = value
    }
    field.isFocused.value = false
    field.isBlurred.value = true
  }, [events.onBlur])

  const onFocus = useCallback(() => {
    if (events.onFocus) {
      events.onFocus()
    }
    field.isBlurred.value = false
    field.isFocused.value = true
  }, [events.onFocus])

  function getChildren(): ReactNode[] {
    if (field.properties) {
      return (field.properties).map((child) => {
        return createElement(FieldControl, {
          key: child.path,
          field: child,
          model,
          defaultValidatorEngine: props.defaultValidatorEngine,
          validatorResolvers: props.validatorResolvers,
          resolveComponent
        })
      })
    }
    return []
  }
  // function getChildren(): Record<string, ReactNode> {
  //   const slots = {} as Record<string, any>
  //   if (field.properties) {
  //     (field.properties).forEach((child) => {
  //       slots[child.id] = createElement(FieldControl, {
  //         field: child,
  //         model: model,
  //         resolveComponent
  //       })
  //     })
  //   }
  //   return slots
  // }

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

import { ComponentClass, createElement, FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Field, isPromise, validate } from "@rxform/core"
import { computed } from "alien-deepsignals"
import { effect, effectScope } from "alien-signals"
import { Resolver } from '@rxform/core';
interface Props {
  field: Field & Record<string, any>;
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
  return field.getProps()
}
function normalizeEvents(field: Field) {
  return field.getEvents()
}
export function FieldControl(props: Props) {
  const { field, resolveComponent } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const methods = useMemo(() => normalizeEvents(field), [])
  const model = computed(() => props.model)
  const {
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
            boolValues: field.bools,
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
      })
      effect(() => {
        field.isDisabled.value = field.disabled?.evaluate(field.bools) ?? false
      })

      effect(() => {
        setFiledState(normalizeProps(field))
      });

      (field.$effects ?? []).forEach((fn: Function) => {
        fn.call(field)
      })
    })
    field.isMounted.value = true
    return () => {
      scope.stop()
      field.onDestroy?.()
      field.onUnmounted?.()
      field.isDestroyed.value = true
    }
  }, [])

  const onChange = useCallback((value: any) => {
    field.isUpdating = true
    if (methods.onChange) {
      const maybePromise = methods.onChange(value)
      if (isPromise(maybePromise)) {
        maybePromise.then(() => {
          field.isUpdating = false
        })
      } else {
        field.isUpdating = false
      }
    } else {
      field.value = value
    }
  }, [])

  const onBlur = useCallback((value: any) => {
    field.isUpdating = true
    if (methods.onBlur) {
      methods.onBlur(value)
    } else {
      field.value = value
    }
    field.isFocused.value = false
    field.isBlurred.value = true
  }, [])

  const onFocus = useCallback(() => {
    if (methods.onFocus) {
      methods.onFocus()
    }
    field.isBlurred.value = false
    field.isFocused.value = true
  }, [])

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
    hidden: filedState.isHidden,
  },
    createElement(resolveComponent(field.component), {
      ...filedState,
      ...methods,
      onChange,
      onBlur,
      onFocus
    }, getChildren())
  );
}

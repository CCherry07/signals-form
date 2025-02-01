import { ComponentClass, createElement, FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FieldBuilder, isPromise, validate } from "@rxform/core"
import { batch, effect } from "alien-deepsignals"
import { effectScope } from "alien-signals"
import { Resolver } from '@rxform/core';
interface Props {
  field: FieldBuilder & Record<string, any>;
  model: any
  defaultValidatorEngine: string;
  resolveComponent: (component: string | FunctionComponent<any> | ComponentClass<any, any>) => string | FunctionComponent<any> | ComponentClass<any, any>
  validatorResolvers: Record<string, Resolver>
};

function normalizeProps(field: FieldBuilder) {
  return field.getProps()
}
function normalizeEvents(field: FieldBuilder) {
  return field.getEvents()
}
export function FieldControl(props: Props) {
  const { field, resolveComponent } = props;
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const {
    initiative: initiativeValidator = [],
    signal: signalValidator = []
  } = field._validator ?? {}

  const triggerValidate = useCallback((key: string) => {
    validate({
      state: field.value,
      updateOn: key,
      defaultValidatorEngine: props.defaultValidatorEngine,
      boolValues: field.boolContext,
      model: props.model
    }, initiativeValidator, props.validatorResolvers).then(errors => {
      if (Object.keys(errors).length === 0) {
        field.abstractModel?.cleanErrors([String(field.path)])
      } else {
        field.abstractModel?.setErrors({
          [String(field.path)]: errors
        })
      }
      field.errors.value = errors
    })
  }, [])

  const methods = useMemo(() => {
    const _events = field.getEvents()
    const onChange = (...args: any[]) => {
      field.isUpdating = true
      if (_events.onChange) {
        const maybePromise = _events.onChange(...args)
        if (isPromise(maybePromise)) {
          maybePromise.then(() => {
            // field.isUpdating = false
          })
        } else {
          // field.isUpdating = false
        }
      } else {
        field.value = args[0]
      }
      triggerValidate("onChange")
    }

    const onBlur = (value: any) => {
      _events?.onBlur?.(value)
      batch(() => {
        field.isFocused.value = false
        field.isBlurred.value = true
      })
      triggerValidate("onBlur")
    }

    const onFocus = () => {
      if (_events.onFocus) {
        _events.onFocus()
      }
      batch(() => {
        field.isBlurred.value = false
        field.isFocused.value = true
      })
      triggerValidate("onFocus")
    }
    const events = {} as Record<string, Function>
    Object.entries(normalizeEvents(field)).forEach(([key, event]) => {
      if (key === "onChange" || key === "onBlur" || key === "onFocus") {
        return
      }
      events[key] = (...args: any[]) => {
        event(...args)
        triggerValidate(key)
      }
    })

    return {
      ...events,
      onChange,
      onBlur,
      onFocus,
    }
  }, [])
  useEffect(() => {
    field.onMounted?.()
    const stopScope = effectScope(() => {
      effect(() => {
        if (signalValidator) {
          validate({
            state: field.value,
            updateOn: "signal",
            defaultValidatorEngine: props.defaultValidatorEngine,
            boolValues: field.boolContext,
            model: props.model
          }, signalValidator, props.validatorResolvers).then(errors => {
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
        field.isHidden.value = field.hidden?.evaluate(field.boolContext) ?? false
      })
      effect(() => {
        field.isDisabled.value = field.disabled?.evaluate(field.boolContext) ?? false
      })
      effect(() => {
        setFiledState(normalizeProps(field))
      });
      (field.$effects ?? []).forEach((fn: Function) => {
        fn.call(field)
      })
    });
    field.isMounted.value = true
    return () => {
      stopScope()
      field.onDestroy?.()
      field.onUnmounted?.()
      field.isDestroyed.value = true
    }
  }, [])

  function getChildren(): ReactNode[] {
    if (field.properties) {
      return (field.properties).map((child) => {
        return createElement(FieldControl, {
          key: child.path,
          field: child,
          model: props.model,
          defaultValidatorEngine: props.defaultValidatorEngine,
          validatorResolvers: props.validatorResolvers,
          resolveComponent
        })
      })
    }
    return []
  }

  return createElement("div", {
    "data-field-id": field.id,
    hidden: filedState.isHidden,
  },
    createElement(resolveComponent(field.getComponent()), {
      ...filedState,
      ...methods,
    }, getChildren())
  );
}

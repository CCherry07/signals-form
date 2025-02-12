import { ComponentClass, createElement, FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FieldBuilder, validate, ValidateItem } from "@formula/core"
import { batch, effect } from "alien-deepsignals"
import { effectScope } from "alien-signals"
import { Resolver } from '@formula/core';
import { Field } from '@formula/core/types/field';
interface Props {
  field: FieldBuilder
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
  if (!field.getComponent()) {
    return null
  }
  const [filedState, setFiledState] = useState(() => normalizeProps(field))
  const {
    initiative: initiativeValidator = [],
    passive: passiveValidator = []
  } = field.getValidator() ?? {}

  const triggerValidate = useCallback((key: string) => {
    validate({
      state: field.value,
      updateOn: key,
      defaultValidatorEngine: props.defaultValidatorEngine,
      boolContext: field.boolContext,
      model: props.model
    }, initiativeValidator as ValidateItem[], props.validatorResolvers)
      .then(errors => {
        field.setFieldErrors(errors)
        field.onValidate?.('initiative', errors)
      })
  }, [])

  const methods = useMemo(() => {
    const _events = field.getEvents()
    const onChange = (async function (this: Field<FieldBuilder>, ...args: any[]) {
      if (_events.onChange) {
        await _events.onChange(...args)
      } else {
        this.value = args[0]
      }
      triggerValidate("onChange")
    }).bind(field)

    const onBlur = (value: any) => {
      _events.onBlur?.(value)
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
    const stopScope = effectScope(() => {
      effect(() => {
        if (passiveValidator) {
          validate({
            state: field.value,
            updateOn: 'passive',
            defaultValidatorEngine: props.defaultValidatorEngine,
            boolContext: field.boolContext,
            model: props.model
          }, passiveValidator as ValidateItem[], props.validatorResolvers).then(errors => {
            field.setFieldErrors(errors)
            field.onValidate?.('passive', errors)
          })
        }
      })
      effect(() => {
        setFiledState(normalizeProps(field))
      });
    });
    field.onMounted?.()
    field.isMounted.value = true
    return () => {
      stopScope()
      field.onDestroy?.()
      field.onUnmounted?.()
      field.isDestroyed.value = true
    }
  }, [])

  function getChildren(): ReactNode[] | undefined {
    const properties = field.getProperties()
    if (properties) {
      return properties.map((child) => {
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
  }

  const component = useMemo(() => resolveComponent(field.getComponent()), [field.getComponent()])

  return createElement("div", {
    "data-field-id": field.id,
    hidden: filedState.isHidden,
  },
    createElement(component, {
      ...filedState,
      ...methods,
    }, getChildren())
  );
}

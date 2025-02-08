import { defineComponent, h, onBeforeMount, onScopeDispose, onUnmounted, shallowRef } from "vue";
import type { Component, DefineComponent, PropType, Slots } from 'vue';
import { isPromise, Resolver, validate, FieldBuilder, ValidateItem } from "@formula/core"
import { effect } from "alien-deepsignals";
import { effectScope } from "alien-signals";

function normalizeProps(field: FieldBuilder) {
  return field.getProps()
}

function normalizeEvents(field: FieldBuilder) {
  return field.getEvents()
}

export const FieldControl = defineComponent({
  inheritAttrs: false,
  props: {
    field: Object as PropType<FieldBuilder>,
    model: Object as PropType<Record<string, any>>,
    resolveComponent: Function as PropType<(component: string | Component | DefineComponent) => Component | DefineComponent>,
    defaultValidatorEngine: String as PropType<string>,
    validatorResolvers: Object as PropType<Record<string, Resolver>>
  },
  setup(props) {
    const field = props.field! as FieldBuilder
    const _events = field.getEvents()
    const {
      initiative: initiativeValidator = [],
      passive: passiveValidator = []
    } = field!.getValidator() ?? {}
    const filedState = shallowRef(normalizeProps(field))

    const triggerValidate = (key: string) => {
      validate({
        state: field.value,
        updateOn: key,
        defaultValidatorEngine: props.defaultValidatorEngine!,
        boolContext: field.boolContext,
        model: props.model!
      }, initiativeValidator as ValidateItem[], props.validatorResolvers!).then(errors => {
        const { cleanErrors, setErrors } = field.getAbstractModel()
        if (Object.keys(errors).length === 0) {
          cleanErrors([String(field.path)])
        } else {
          setErrors({
            [String(field.path)]: errors
          })
        }
        field.errors.value = errors
      })
    }

    const onChange = (...args: any[]) => {
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
      if (_events.onBlur) {
        _events.onBlur(value)
      } else {
        field.value = value
      }
      field.isFocused.value = false
      field.isBlurred.value = true
      triggerValidate("onBlur")
    }

    const onFocus = () => {
      if (_events.onFocus) {
        _events.onFocus()
      }
      field.isBlurred.value = false
      field.isFocused.value = true
      triggerValidate("onFocus")
    }
    const events = {
      onChange,
      onBlur,
      onFocus
    } as Record<string, Function>
    Object.entries(normalizeEvents(field)).forEach(([key, event]) => {
      if (key === "onChange" || key === "onBlur" || key === "onFocus") {
        return
      }
      events[key] = (...args: any[]) => {
        event(...args)
        triggerValidate(key)
      }
    })

    const cleanups: Function[] = [];
    onBeforeMount(() => {
      const stop = effectScope(() => {
        effect(() => {
          if (passiveValidator) {
            validate({
              state: field.value,
              updateOn: "signal",
              defaultValidatorEngine: props.defaultValidatorEngine!,
              boolContext: field.boolContext,
              model: props.model!.value
            }, passiveValidator as ValidateItem[], props.validatorResolvers!).then(errors => {
              const { cleanErrors, setErrors } = field.getAbstractModel()
              if (Object.keys(errors).length === 0) {
                cleanErrors([String(field.path)])
              } else {
                setErrors({
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
          filedState.value = normalizeProps(field)
        })
      })
      cleanups.push(stop)
    })

    onScopeDispose(() => {
      cleanups.forEach(cleanup => cleanup())
    })

    function getChildren(): Slots {
      const slots = {} as Record<string, () => any>
      const properties = field.getProperties()
      if (properties) {
        properties.forEach((child) => {
          slots[child.id] = () => {
            return h(FieldControl, {
              key: child.path,
              field: child,
              model: props.model,
              resolveComponent: props.resolveComponent,
              validatorResolvers: props.validatorResolvers,
              defaultValidatorEngine: props.defaultValidatorEngine
            })
          }
        })
      }
      return slots
    }

    onUnmounted(() => {
      field.onDestroy?.()
      field.onUnmounted?.()
      field.isDestroyed.value = true
    })

    return () => {
      const component = props.resolveComponent!(field.getComponent())
      return h('div', { hidden: filedState.value.isHidden, "data-field-id": field.id }, h(component, {
        ...filedState.value,
        ...events,
      }, {
        ...getChildren()
      }))
    }
  }
})

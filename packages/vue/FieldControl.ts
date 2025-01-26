import { defineComponent, h, onBeforeMount, onScopeDispose, onUnmounted, shallowRef } from "vue";
import type { Component, DefineComponent, PropType, Slots } from 'vue';
import { isPromise, Resolver, validate, FieldBuilder } from "@rxform/core"
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
    const field = props.field! as FieldBuilder & Record<string, any>
    const {
      initiative: initiativeValidator = [],
      signal: signalValidator = []
    } = field!._validator ?? {}
    const filedState = shallowRef(normalizeProps(field))

    const triggerValidate = (key: string) => {
      validate({
        state: field.value,
        updateOn: key,
        defaultValidatorEngine: props.defaultValidatorEngine!,
        boolValues: field.bools,
        model: props.model!
      }, initiativeValidator, props.validatorResolvers!).then(errors => {
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

    const onChange = (...args: any[]) => {
      field.isUpdating = true
      if (field.onChange) {
        const maybePromise = field.onChange(...args)
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
      field.isUpdating = true
      if (field.onBlur) {
        field.onBlur(value)
      } else {
        field.value = value
      }
      field.isFocused.value = false
      field.isBlurred.value = true
      triggerValidate("onBlur")
    }

    const onFocus = () => {
      if (field.onFocus) {
        field.onFocus()
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
          if (signalValidator) {
            validate({
              state: field.value,
              updateOn: "signal",
              defaultValidatorEngine: props.defaultValidatorEngine!,
              boolValues: field.bools,
              model: props.model!.value
            }, signalValidator, props.validatorResolvers!).then(errors => {
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
          filedState.value = normalizeProps(field)
        })
        // field.$effects?.forEach(effect => {
        //   effect.call(field)
        // })
      })
      cleanups.push(stop)
    })

    onScopeDispose(() => {
      cleanups.forEach(cleanup => cleanup())
    })

    function getChildren(): Slots {
      const slots = {} as Record<string, () => any>
      if (field.properties) {
        (field.properties).forEach((child) => {
          slots[child.id] = () => h(FieldControl, {
            key: child.path,
            field: child,
            model: props.model,
            resolveComponent: props.resolveComponent,
            validatorResolvers: props.validatorResolvers,
            defaultValidatorEngine: props.defaultValidatorEngine
          })
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
      const component = props.resolveComponent!(field._component)
      return h('div', { hidden: filedState.value.isHidden, "data-field-id": field.id }, h(component, {
        ...filedState.value,
        ...events,
      }, {
        ...getChildren()
      }))
    }
  }
})

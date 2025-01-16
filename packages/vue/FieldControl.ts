import { defineComponent, h, onBeforeMount, onScopeDispose, onUnmounted, shallowRef } from "vue";
import type { Component, DefineComponent, PropType, Slots } from 'vue';
import { Resolver, validate, type Field } from "@rxform/core"
import { effect } from "alien-deepsignals";
import { effectScope } from "alien-signals";

function normalizeProps(field: Field) {
  return field.getProps()
}

function normalizeEvents(field: Field) {
  return field.getEvents()
}

export const FieldControl = defineComponent({
  inheritAttrs: false,
  props: {
    field: Object as PropType<Field>,
    model: Object as PropType<Record<string, any>>,
    resolveComponent: Function as PropType<(component: string | Component | DefineComponent) => Component | DefineComponent>,
    defaultValidatorEngine: String as PropType<string>,
    validatorResolvers: Object as PropType<Record<string, Resolver>>
  },
  setup(props) {
    // @ts-ignore
    const { initiative, signal: signalValidator } = props.field?.validator ?? {}
    const field = props.field!
    const filedState = shallowRef(normalizeProps(field))
    const events = normalizeEvents(field)
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
            }, signalValidator.all, props.validatorResolvers!).then(errors => {
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
        field.$effects.forEach(effect => {
          effect.call(field)
        })
      })
      cleanups.push(stop)
    })

    const onChange = (value: any) => {
      if (events.onChange) {
        events.onChange(value)
      } else {
        field.value = value
      }
    }

    const onBlur = (value: any) => {
      if (events.onBlur) {
        events.onBlur(value)
      } else {
        field.value = value
      }
      field.isFocused.value = false
      field.isBlurred.value = true
    }

    const onFocus = () => {
      if (events.onFocus) {
        events.onFocus()
      }
      field.isBlurred.value = false
      field.isFocused.value = true
    }

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
      const component = props.resolveComponent!(field.component)
      return h('div', { hidden: filedState.value.isHidden, "data-field-id": field.id }, h(component, {
        ...filedState.value,
        onChange,
        onBlur,
        onFocus,
      }, {
        ...getChildren()
      }))
    }
  }
})

import { defineComponent, h, onBeforeMount, onScopeDispose, onUnmounted, shallowRef } from "vue";
import type { Component, DefineComponent, PropType, Slots } from 'vue';
import type { Field } from "@formula/core/types/field";
import { FieldBuilder } from "@formula/core"
import { batch, effect } from "alien-deepsignals";
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
    resolveComponent: Function as PropType<(component: string | Component | DefineComponent) => Component | DefineComponent>,
  },
  setup(props) {
    const field = props.field! as FieldBuilder
    const _events = field.getEvents()
    const filedState = shallowRef(normalizeProps(field))
    const isHidden = shallowRef(field.isHidden.value)
    const isDisabled = shallowRef(field.isDisabled.value)
    const triggerValidate = (key: string) => {
      field.validate({
        value: field.value,
        updateOn: key,
      })
    }

    const onChange = (async function (this: Field<FieldBuilder>, ...args: any[]) {
      if (_events.onChange) {
        await _events.onChange(...args)
      } else {
        this.value = args[0]
      }
      triggerValidate("onChange")
    }).bind(field)

    const onBlur = function (value: any) {
      if (_events.onBlur) {
        _events.onBlur(value)
      }
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
          filedState.value = normalizeProps(field)
        })
        effect(() => {
          isHidden.value = field.isHidden.value
        })
        effect(() => {
          isDisabled.value = field.isDisabled.value
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
              resolveComponent: props.resolveComponent,
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

    const component = props.resolveComponent!(field.getComponent())

    return () => {
      return h('div', { hidden: isHidden.value, "data-field-id": field.id }, h(component, {
        disabled: isDisabled.value,
        ...filedState.value,
        ...events,
      }, {
        ...getChildren()
      }))
    }
  }
})

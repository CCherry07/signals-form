import { defineComponent, h, onBeforeMount, onScopeDispose, onUnmounted, shallowRef } from "vue";
import type { Component, DefineComponent, PropType, VNode } from 'vue';
import { FiledUpdateType, normalizeSignal, toDeepValue, toValue, validate, type Field } from "@rxform/core"
import { batch, computed, effect, signal, untracked } from "@preact/signals-core";

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

export const FieldControl = defineComponent({
  inheritAttrs: false,
  props: {
    field: Object as PropType<Field>,
    model: Object as PropType<Record<string, any>>,
    resolveComponent: Function as PropType<(component: string | Component | DefineComponent) => Component | DefineComponent>
  },
  setup(props) {
    const { initiative, signal: signalValidator } = props.field?.validator ?? {}
    const field = props.field!
    const filedState = shallowRef(normalizeProps(field))
    const cleanups: Function[] = [];
    onBeforeMount(() => {
      const onValidateDispose = effect(() => {
        if (signalValidator) {
          validate({ state: field.value, updateOn: "signal" }, signalValidator.all, untracked(() => field.bools), props.model!.value).then(errors => {
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
        filedState.value = normalizeProps(field)
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
            const signalValue = computed(() => normalizeSignal(signalKey, signal({ $: props.model!.value })).value)
            fn.call(field, signalValue.value, field.bools, props.model!.value)
          })
        }
      })
      const onStateDispose = effect(() => {
        filedState.value = normalizeProps(field)
      })
      cleanups.push(onValidateDispose, onStatesDispose, onSignalsDispose, onStateDispose)
    })
    const events = computed(() => {
      return Object.fromEntries(Object.entries(field.events || {}).map(([e, fn]) => {
        return [e, function (data?: any) {
          fn.call(field, data)
          if (initiative) {
            validate({ state: toValue(field.value), updateOn: e }, initiative.all, field.bools, props.model!.value).then(errors => {
              field.errors.value = errors
            })
          }
        }]
      }))
    })

    const onChange = (value: any) => {
      if (events.value.onChange) {
        events.value.onChange(value)
      } else {
        field.onUpdate({
          type: FiledUpdateType.Value,
          value
        })
      }
    }

    const onBlur = (value: any) => {
      batch(() => {
        if (events.value.onBlur) {
          events.value.onBlur(value)
        } else {
          field.onUpdate({
            type: FiledUpdateType.Value,
            value
          })
        }
        field.isFocused.value = false
        field.isBlurred.value = true
      })
    }

    const onFocus = () => {
      if (events.value.onFocus) {
        events.value.onFocus()
      }
      batch(() => {
        field.isBlurred.value = false
        field.isFocused.value = true
      })
    }

    onScopeDispose(() => {
      cleanups.forEach(cleanup => cleanup())
    })

    function getChildren(): VNode[] {
      if (field.properties) {
        return (field.properties).map((child) => {
          return h(FieldControl, {
            key: child.path,
            field: child,
            model: props.model,
            resolveComponent: props.resolveComponent
          })
        })
      }
      return []
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
      }, getChildren))
    }
  }
})

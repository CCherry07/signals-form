import { effect, isFunction, signal, Signal } from "alien-deepsignals"
import { AbstractModelMethods, ActionOptions, ComponentOptions, FieldError, FieldErrors, ValidatorOptions } from "../types/field"
import { effectScope } from "alien-signals"
import { BoolContext, Decision } from "../boolless"
import { isPromise, set } from "@rxform/shared"

export class FieldBuilder<T = any> {
  hidden?: Decision;
  disabled?: Decision;
  properties: FieldBuilder[] | undefined
  public isBlurred: Signal<boolean> = signal(false)
  public isFocused: Signal<boolean> = signal(false)
  public isInit: Signal<boolean> = signal(false)
  public isDestroyed: Signal<boolean> = signal(false)
  public isHidden: Signal<boolean> = signal(false)
  public isDisabled: Signal<boolean> = signal(false)
  public isValid: Signal<boolean> = signal(true)
  public errors: Signal<FieldErrors> = signal({})
  public isMounted: Signal<boolean> = signal(false)

  props: Record<string, any> = {}

  private $value: T = undefined as unknown as T
  private cleanups: Array<Function> = []

  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean

  abstractModel!: AbstractModelMethods;

  id!: string
  path!: string
  parentpath!: string
  signalPath!: string

  appContext: {
    provides?: Record<string, any>
  } = {}

  parent: FieldBuilder | null = null

  get value() {
    return this.abstractModel.getFieldValue(this.path)
  }

  peek() {
    return this.abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }

  set value(v: T) {
    // console.log('set value', v, this.path);
    this.abstractModel.setFieldValue(this.path, v)
  }

  _component?: any;
  _injectFields?: Record<string, string> = {}
  _validator: ValidatorOptions = {}
  _actions: ActionOptions<T> = {}
  _effects: Array<Function> = []
  _provides: Record<string | symbol, any> = {}
  _events: Record<string, Function> = {}


  private deps: Record<string, FieldBuilder> = {}
  private effectFields: Set<FieldBuilder> = new Set()
  boolContext: BoolContext = {}

  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisabled?(state: boolean): void
  onHidden?(state: boolean): void
  onMounted?(): void
  onUnmounted?(): void
  onValidate?(): void

  constructor() {

  }

  // all fields are initialized, we can inject fields now
  normalizeDeps() {
    this.deps = Object.fromEntries(
      Object.entries(this.injectFields)
        .map(([key, value]) => {
          const targetField = this.abstractModel.getField(value)
          targetField.appendEffectField(this)
          return [key, this.abstractModel.getField(value)]
        }))

    this.normalizeEffects()
  }

  appendEffectField(field: FieldBuilder) {
    this.effectFields.add(field)
  }

  normalizeEffects() {
    this._effects.forEach((effect) => {
      effect.call(this)
    })
  }

  getDepsValue(deps?: string | string[] | Record<string, string>,) {
    let injectValues: any = undefined
    if (Array.isArray(deps)) {
      injectValues = deps.map((dep: string) => this.deps[dep].value)
    } else if (typeof deps === 'object') {
      injectValues = Object.fromEntries(Object.entries(deps).map(([key, dep]) => {
        return [key, this.deps[dep as string].value]
      })
      )
    } else if (typeof deps === 'string') {
      injectValues = this.deps[deps].value
    }
    return injectValues
  }

  get isRoot() {
    return this.parent === null
  }

  get isLeaf() {
    return this.properties?.length === 0
  }

  resetState() {
    this.isInit.value = true
    // this.isUpdating = true
    this.isDisabled.value = false
    this.isHidden.value = false
    this.isBlurred.value = false
    this.isFocused.value = false
    this.isDestroyed.value = false
    this.isValid.value = true
    this.errors.value = {}
    this.$value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    const filedValue: any = isFunction(this._actions.setDefaultValue) ? this._actions.setDefaultValue() : model;
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
      })
    } else {
      this.value = filedValue!
    }
  }

  reset(model?: T) {
    // clean previous state and effect
    this.resetState()
    this.onBeforeInit?.()
    // const injects: Function[] = (this.constructor as any)[Symbol.metadata][METADATA_INJECT] ?? []
    // injects.forEach((inject) => {
    //   inject.call(this)
    // })
    const filedValue: any = isFunction(this._actions.setDefaultValue) ? this._actions.setDefaultValue() : model;
    if (this.properties?.length && filedValue === undefined) {
      return
    }
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
      })
    } else {
      this.value = filedValue!
    }
  }

  evaluateDecision(decision: Decision) {
    return decision.evaluate(this.boolContext)
  }

  setFieldErrors(errors: FieldErrors) {
    this.abstractModel.setFieldErrors(this.path, errors)
  }

  cleanErrors(paths?: string[]) {
    if (paths === undefined) {
      this.errors.value = {};
      this.abstractModel.cleanErrors([this.path])
      return;
    }
    paths.forEach(p => {
      delete this.errors.value[p]
    })
  }

  setErrors(errors: Record<string, FieldError>) {
    this.errors.value = {
      ...this.errors.value,
      ...errors
    }
  }

  async _onSubmitValue() {
    const fieldPathLength = this.path.length + 1
    if (isFunction(this._actions.onSubmitValue)) {
      return await this._actions.onSubmitValue(this.peek())
    } else if (this.properties) {
      const model: any = {}
      await Promise.all(this.properties.map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field._onSubmitValue())
      }))
      return model
    } else {
      return this.peek()
    }
  }

  actions(actions: ActionOptions<T>) {
    this._actions = actions
    return this
  }

  component(component: ComponentOptions) {
    const { component: _component, ...options } = component
    this._component = _component
    Object.assign(this, options)
    return this
  }

  provides(provides: Record<string | symbol, any>) {
    this._provides = provides
    return this
  }

  injectFields(fields: Record<string, string>) {
    this._injectFields = fields
    return this
  }

  validator(options: ValidatorOptions) {
    this._validator = options
    return this
  }

  effects(effects: Array<Function>) {
    this._effects = effects
  }

  events(events: Record<string, Function>) {
    Object.entries(events).forEach(([key, value]) => {
      this._events[key] = value.bind(this)
    })
  }

  getProps() {
    return {
      ...this.props,
      errors: this.errors.value,
      value: this.value,
    } as Record<string, any>
  }

  getEvents() {
    return this._events
  }

  build() {
    const stop = effectScope(() => {
      // validate
      effect(() => {
        this.isValid.value = Object.keys(this.errors.value).length === 0
      })
      
      // disabled
      effect(() => {
        this.onDisabled?.(this.isDisabled.value)
      })

      // recover value when hidden and shown
      effect(() => {
        const { isHidden, recoverValueOnHidden, recoverValueOnShown } = this;
        if (isHidden.value && recoverValueOnHidden) {
          this.onHidden?.(this.isHidden.peek())
          return
        }
        if (recoverValueOnShown) {
          if (!isHidden.value && this.$value !== this.peek()) {
            this.value = this.$value;
            this.onHidden?.(this.isHidden.peek())
          } else {
            this.$value = this.peek();
          }
        }
        if (isHidden.value) {
          this.value = undefined as unknown as T;
          this.onHidden?.(this.isHidden.peek())
        }
      })
    })
    this.cleanups.push(stop)
    return this
  }
}

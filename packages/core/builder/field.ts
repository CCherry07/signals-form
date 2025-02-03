import { deepSignal, effect, isFunction, shallow, signal, Signal } from "alien-deepsignals"
import { effectScope } from "alien-signals"
import { AbstractModelMethods, ActionOptions, ComponentOptions, FieldError, FieldErrors, Lifecycle, ValidatorOptions } from "../types/field"
import { BoolContext, Decision } from "../boolless"
import { isArray, isPromise, set } from "@rxform/shared"
import { defineRelation } from "../hooks/defineRelation"
import { formatValidateItem } from "../validator"

export class FieldBuilder<T = any, P extends Record<string, any> = Record<string, any>> {

  id!: string
  path!: string
  parentpath!: string
  signalPath!: string

  hidden?: Decision;
  disabled?: Decision;
  properties?: FieldBuilder[]

  isBlurred: Signal<boolean> = signal(false)
  isFocused: Signal<boolean> = signal(false)
  isInit: Signal<boolean> = signal(false)
  isDestroyed: Signal<boolean> = signal(false)
  isHidden: Signal<boolean> = signal(false)
  isDisabled: Signal<boolean> = signal(false)
  isValid: Signal<boolean> = signal(true)
  errors: Signal<FieldErrors> = signal({})
  isMounted: Signal<boolean> = signal(false)

  #props = deepSignal({} as P)
  #$value: T = undefined as unknown as T
  #cleanups: Array<Function> = []
  #removeValueOnHidden: boolean = true
  #recoverValueOnShown: boolean = false
  #abstractModel!: AbstractModelMethods;
  #relations?: ReturnType<typeof defineRelation>
  // @ts-ignore
  #appContext: {
    provides?: Record<string, any>
  } = {}

  setAppContext(appContext: any) {
    this.#appContext = appContext
  }

  setAbstractModel(abstractModel: AbstractModelMethods) {
    this.#abstractModel = abstractModel
  }

  getAbstractModel() {
    return this.#abstractModel
  }

  parent: FieldBuilder | null = null

  get value() {
    return this.#abstractModel.getFieldValue(this.path)
  }

  peek() {
    return this.#abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }

  set value(v: T) {
    this.#abstractModel.setFieldValue(this.path, v)
  }

  #component?: any;
  #injectFields: Record<string, string> = {}
  #validator: ValidatorOptions = {}
  #actions: ActionOptions<T> = {}
  #effects: Array<(this: FieldBuilder) => void> = []
  #provides: Record<string | symbol, any> = {}
  #events: Record<string, Function> = {}

  getComponent() {
    return this.#component
  }

  getActions() {
    return this.#actions
  }

  getValidator() {
    return this.#validator
  }

  getProvides() {
    return this.#provides
  }

  private deps: Record<string, FieldBuilder> = {}
  private effectFields: Set<FieldBuilder> = new Set()
  #boolContext: BoolContext = {}

  setBoolContext(boolContext: BoolContext) {
    this.#boolContext = boolContext
  }

  get boolContext() {
    return this.#boolContext
  }

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
      Object.entries(this.#injectFields)
        .map(([key, value]) => {
          const targetField = this.#abstractModel.getField(value)
          targetField.#appendEffectField(this as FieldBuilder)
          return [key, this.#abstractModel.getField(value)]
        }))

    this.#normalizeEffects()
  }

  #appendEffectField(field: FieldBuilder) {
    this.effectFields.add(field)
  }

  #normalizeEffects() {
    this.#effects.forEach((effect) => {
      effect.call(this as FieldBuilder)
    })
  }

  // @ts-ignore
  #getDepsValue(deps?: string | string[] | Record<string, string>) {
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
    return isArray(this.properties) ? this.properties?.length === 0 : true
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
    this.#$value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    const { setDefaultValue } = this.#actions
    const filedValue: any = isFunction(setDefaultValue) ? setDefaultValue() : model;
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
    this.#relations?.forEach(r => {
      r.call(this)
    })
    const { setDefaultValue } = this.#actions
    const filedValue: any = isFunction(setDefaultValue) ? setDefaultValue() : model;
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
    return decision.evaluate(this.#boolContext)
  }

  setFieldErrors(errors: FieldErrors) {
    this.#abstractModel.setFieldErrors(this.path, errors)
  }

  cleanErrors(paths?: string[]) {
    if (paths === undefined) {
      this.errors.value = {};
      this.#abstractModel.cleanErrors([this.path])
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

  async onSubmit(): Promise<T> {
    const fieldPathLength = this.path.length + 1
    const { onSubmitValue } = this.#actions
    if (isFunction(onSubmitValue)) {
      return await onSubmitValue(this.peek())
    } else if (this.properties) {
      const model: any = {} as T
      await Promise.all(this.properties.map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field.onSubmit())
      }))
      return model
    } else {
      return this.peek()
    }
  }

  lifecycle(hooks: Lifecycle) {
    Object.assign(this, hooks)
    return this
  }

  actions(actions: ActionOptions<T>) {
    this.#actions = actions
    return this
  }

  component(component: ComponentOptions<P>) {
    const { component: _component, ...options } = component
    this.#component = _component
    let { props = {}, ...rest } = options
    props = shallow(props as P)
    Object.assign(this.#props, props)
    Object.assign(this, rest)
    return this
  }

  relation(relations: ReturnType<typeof defineRelation>) {
    this.#relations = relations
    return this
  }

  provides(provides: Record<string | symbol, any>) {
    this.#provides = provides
    return this
  }

  injectFields(fields: Record<string, string>) {
    this.#injectFields = fields
    return this
  }

  validator(options: ValidatorOptions) {
    if (options.initiative) {
      options.initiative = formatValidateItem(options.initiative)
    }
    this.#validator = options
    return this
  }

  effects(effects: Array<
    (this: FieldBuilder) => void
  >) {
    this.#effects = effects
    return this
  }

  events(events: Record<string, (this: FieldBuilder, ...args: any[]) => void>) {
    Object.entries(events).forEach(([key, value]) => {
      this.#events[key] = value.bind(this)
    })
    return this
  }

  getProps() {
    return {
      ...this.#props,
      errors: this.errors.value,
      value: this.value,
      isHidden: this.isHidden.value,
      isBlurred: this.isBlurred.value,
      isFocused: this.isFocused.value,
      isMounted: this.isMounted.value,
      isDestroyed: this.isDestroyed.value,
      isInit: this.isInit.value,
      isDisabled: this.isDisabled.value,
      isUpdating: this.isInit.value,
    }
  }

  getEvents() {
    return this.#events
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
        const { isHidden } = this;
        if (isHidden.value && !this.#removeValueOnHidden) {
          this.onHidden?.(this.isHidden.peek())
          return
        }
        if (this.#recoverValueOnShown) {
          if (isHidden.value === false && this.#$value !== this.peek()) {
            this.value = this.#$value;
            this.onHidden?.(this.isHidden.peek())
          } else {
            this.#$value = this.peek();
          }
        }
        if (isHidden.value) {
          this.value = undefined as unknown as T;
          this.onHidden?.(this.isHidden.peek())
        }
      })
    })
    this.#cleanups.push(stop)
    return this
  }
}

import { deepSignal, effect, isFunction, signal, Signal } from "alien-deepsignals"
import { effectScope } from "alien-signals"
import { AbstractModelMethods, ActionOptions, ComponentOptions, FieldError, FieldErrors, Lifecycle, ValidatorOptions } from "../types/field"
import { BoolContext, Decision } from "../boolless"
import { isArray, isPromise, set } from "@formula/shared"
import { defineRelation } from "../hooks/defineRelation"
import { formatValidateItem } from "../validator"

export class FieldBuilder<T = any, P extends Object = Object> {

  id!: string
  path!: string
  parentpath!: string
  signalpath!: string

  hidden?: Decision;
  disabled?: Decision;
  #properties?: FieldBuilder[]

  // value status
  #updating = signal(false)
  #pending = signal(false)
  #updated = signal(false)

  isBlurred: Signal<boolean> = signal(false)
  isFocused: Signal<boolean> = signal(false)
  isInit: Signal<boolean> = signal(false)
  isDestroyed: Signal<boolean> = signal(false)
  isHidden: Signal<boolean> = signal(false)
  isDisabled: Signal<boolean> = signal(false)
  isValid: Signal<boolean> = signal(true)
  errors: Signal<FieldErrors> = signal({})
  isMounted: Signal<boolean> = signal(false)

  #props = deepSignal<P>({} as P)
  #$value: T = undefined as unknown as T
  #cleanups: Array<Function> = []
  #removeValueOnHidden: boolean = true
  #recoverValueOnShown: boolean = false
  #abstractModel!: AbstractModelMethods;
  #relation?: ReturnType<typeof defineRelation>
  // @ts-ignore
  #appContext: {
    provides?: Record<string, any>
  } = {}

  setAppContext(appContext: any) {
    this.#appContext = appContext
  }

  getAppContext() {
    return this.#appContext
  }

  setAbstractModel(abstractModel: AbstractModelMethods) {
    this.#abstractModel = abstractModel
  }

  getAbstractModel() {
    return this.#abstractModel
  }

  parent: FieldBuilder | null = null

  get value(): T {
    return this.#abstractModel.getFieldValue(this.path)
  }

  peek(): T {
    return this.#abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }

  set value(v: T) {
    this.#batchDispatchEffectStart()
    this.#abstractModel.setFieldValue(this.path, v)
    this.#batchDispatchEffectEnd()
  }

  #component?: any;
  #validator: ValidatorOptions = {}
  #actions: ActionOptions<T> = {}
  // #effects: Array<(this: FieldBuilder<T, P>) => void> = []
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

  appendEffectField(field: FieldBuilder) {
    this.effectFields.add(field)
  }

  normalizeRelation() {
    if (this.#relation) {
      this.#relation.forEach(relation => {
        relation.call(this)
      })
    }
  }

  setValueWillPending(isPending: boolean) {
    this.#pending.value = isPending
  }

  setValueWillUpdating(isUpdating: boolean) {
    this.#updating.value = isUpdating
  }

  setValueWillUpdated(isUpdated: boolean) {
    this.#updated.value = isUpdated
  }

  // // @ts-ignore
  // #getDepsValue(deps?: string | string[] | Record<string, string>) {
  //   let injectValues: any = undefined
  //   if (Array.isArray(deps)) {
  //     injectValues = deps.map((dep: string) => this.deps[dep].value)
  //   } else if (typeof deps === 'object') {
  //     injectValues = Object.fromEntries(Object.entries(deps).map(([key, dep]) => {
  //       return [key, this.deps[dep as string].value]
  //     })
  //     )
  //   } else if (typeof deps === 'string') {
  //     injectValues = this.deps[deps].value
  //   }
  //   return injectValues
  // }

  get isRoot() {
    return this.parent === null
  }

  get isLeaf() {
    return isArray(this.properties) ? this.properties?.length === 0 : true
  }

  getValueStatus() {
    return {
      updated: this.#updated.value,
      updating: this.#updating.value,
      pending: this.#pending.value,
    }
  }

  getValueStatusMethods() {
    return {
      setValueWillPending: this.setValueWillPending.bind(this),
      setValueWillUpdating: this.setValueWillUpdating.bind(this),
      setValueWillUpdated: this.setValueWillUpdated.bind(this),
    }
  }

  #batchDispatchEffectStart() {
    this.effectFields.forEach(field => {
      const { setValueWillUpdating, setValueWillPending, setValueWillUpdated } = field.getValueStatusMethods()
      setValueWillUpdating(true)
      setValueWillPending(true)
      setValueWillUpdated(false)
      field.#batchDispatchEffectStart()
    })
  }

  #batchDispatchEffectEnd() {
    this.effectFields.forEach(field => {
      const { setValueWillUpdating, setValueWillPending, setValueWillUpdated } = field.getValueStatusMethods()
      setValueWillUpdating(false)
      setValueWillPending(false)
      setValueWillUpdated(true)
    })
  }

  resetState() {
    this.isInit.value = true
    this.#updating.value = true
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
        if (this.isLeaf) {
          this.value = value
        } else {
          this.#properties?.forEach(filed => {
            filed.resetModel(value?.[filed.id])
          })
        }
      })
    } else {
      if (this.isLeaf) {
        this.value = filedValue
      } else {
        this.#properties?.forEach(filed => {
          filed.resetModel(filedValue?.[filed.id])
        })
      }
    }
  }

  reset(model?: T) {
    this.resetState()
    this.onBeforeInit?.()

    const { setDefaultValue } = this.#actions
    const filedValue: any = isFunction(setDefaultValue) ? setDefaultValue() : model;
    if (this.#properties?.length && filedValue === undefined) {
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
    } else if (this.#properties) {
      const model: any = {} as T
      await Promise.all(this.#properties.map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field.onSubmit())
      }))
      return model
    } else {
      return this.peek()
    }
  }

  lifecycle(hooks: Lifecycle<T, P>) {
    Object.assign(this, hooks)
    return this
  }

  actions(actions: ActionOptions<T>) {
    this.#actions = actions
    return this
  }

  component(component: ComponentOptions) {
    const { component: _component, ...options } = component
    this.#component = _component
    Object.assign(this, options)
    return this
  }

  properties(properties: FieldBuilder[]) {
    this.#properties = properties
    return this
  }

  getProperties() {
    return this.#properties
  }

  normalizeProperties() {
    if (this.#properties) {
      this.#properties.forEach((field) => {
        field.parent = this
        field.parentpath = this.path ?? ""
        field.path = this.path ? `${this.path}.${field.id}` : field.id;
        field.signalpath = this.path ? `${this.path}.$${field.id}` : field.id;
        field.setAbstractModel(this.#abstractModel)
        field.normalizeProperties()
        field.reset()
        field.onInit?.()
        this.#abstractModel.addField(field)
      })
    }
  }

  relation(relation: ReturnType<typeof defineRelation>) {
    this.#relation = relation
    return this
  }

  provides(provides: Record<string | symbol, any>) {
    this.#provides = provides
    return this
  }

  validator(options: ValidatorOptions) {
    if (options.initiative) {
      options.initiative = formatValidateItem(options.initiative)
    }
    this.#validator = options
    return this
  }


  props(ps: P) {
    Object.assign(this.#props, ps)
    return this
  }

  setProp<K extends keyof P, V extends P[K]>(key: K, value: V) {
    // @ts-ignore
    this.#props[key] = value
  }

  events(events: Record<string, (this: FieldBuilder<T, P>, ...args: any[]) => void>) {
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

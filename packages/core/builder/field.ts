
import { ValueStatus, type ActionOptions, type ComponentOptions, type Field, type FieldBuilderType, type FieldErrors, type Lifecycle, type ValidateMode, type ValidateType, type ValidatorOptions } from "../types/field"
import type { Decision } from "../boolless"
import type { AbstractModelMethods } from "../types/form"
import type { Context, ValidateItem } from "../types/validator"

import { computed, deepSignal, effect, isFunction, isObject, signal, Signal } from "alien-deepsignals"
import { effectScope } from "alien-signals"
import { isArray, isEmpty, isPromise, set } from "@signals-form/shared"

import { defineRelation } from "../hooks/defineRelation"
import { formatValidateItem } from "../validator"
import { Action, createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue, Update, UpdateQueue } from "../updater/updateQueue"
import { DefaultLane, Lane, NoLane, requestUpdateLane } from "../updater/lanes"
import { updater } from "../updater"

let lane = NoLane

let index = 0
function getParentField(field: FieldBuilder): FieldBuilder | null {
  if (field.parent?.isVoidField) {
    return getParentField(field.parent)
  } else {
    return field.parent
  }
}

interface UpdateState<T> extends UpdateQueue<T> {
  lastRenderedState: T
  baseQueue: Update<T> | null
}

export class FieldBuilder<T = any, P extends Object = Object> {

  id!: string
  path!: string
  parentpath!: string
  signalpath!: string

  #type: FieldBuilderType = "Field"

  hidden?: Decision;
  disabled?: Decision;
  #properties?: FieldBuilder[]

  // value status
  private [ValueStatus.Commiting] = signal(false)
  private [ValueStatus.Committed] = signal(false)
  private [ValueStatus.Pending] = signal(false)
  private [ValueStatus.Failed] = signal(false)

  updateQueueMap = new Map<string, UpdateState<any>>()

  isValidating: Signal<boolean> = signal(false)
  isBlurred: Signal<boolean> = signal(false)
  isFocused: Signal<boolean> = signal(false)
  isInitialized: Signal<boolean> = signal(false)
  isDestroyed: Signal<boolean> = signal(false)
  isHidden = computed(() => this.hidden ? this.execDecision(this.hidden) : false)
  isDisabled = computed(() => this.disabled ? this.execDecision(this.disabled) : false)
  isValid = computed(() => !Object.keys(this.errors.value).length)
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
    const parentpath = this.#getValidParentFieldPath()
    return this.#abstractModel?.peekFieldValue?.(parentpath, this.id)
  }

  protected set value(v: T) {
    this.#batchDispatchEffectStart()
    this.#abstractModel.setFieldValue(this.path, v)
    this.#batchDispatchEffectEnd()
  }

  setValue(action: Action<T>) {
    const line = requestUpdateLane()
    const update = createUpdate(action, line)
    const valueUpdateQueue = this.updateQueueMap.get('value')!
    enqueueUpdate(valueUpdateQueue, update)
    updater.enqueueUpdate(() => {
      this.updateState(line, 'value')
    }, line)
  }

  updateState<K extends keyof P>(lane: Lane = DefaultLane, key: 'value' | K = 'value') {
    const queue = this.updateQueueMap.get(key as string)!
    // @ts-ignore
    const baseState = key === 'value' ? this.value : this.#props[key];
    const pending = queue.shared.pending;
    let baseQueue = queue.baseQueue;

    if (pending !== null) {
      // pending baseQueue update保存在current中
      if (baseQueue !== null) {
        // baseQueue b2 -> b0 -> b1 -> b2
        // pendingQueue p2 -> p0 -> p1 -> p2
        // b0
        const baseFirst = baseQueue.next;
        // p0
        const pendingFirst = pending.next;
        // b2 -> p0
        baseQueue.next = pendingFirst;
        // p2 -> b0
        pending.next = baseFirst;
        // p2 -> b0 -> b1 -> b2 -> p0 -> p1 -> p2
      }
      baseQueue = pending;
      queue.baseQueue = pending;
      queue.shared.pending = null;
    }

    if (baseQueue !== null) {
      const prevState = this.value;
      const {
        memoizedState,
        baseQueue: newBaseQueue,
      } = processUpdateQueue(baseState, baseQueue, lane)
      if (!Object.is(prevState, memoizedState)) {
        //
      }

      if (key === 'value') {
        this.value = memoizedState;
      } else {
        // @ts-ignore
        this.#props[key] = memoizedState;
      }
      queue.baseQueue = newBaseQueue;
      queue.lastRenderedState = memoizedState;
    }
  }

  #component?: any;
  #validator: {
    initiative?: ValidateItem<T>[];
    passive?: ValidateItem<T>[];
  } = {}
  #actions: ActionOptions<T, P> = {}
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

  effectFields: Set<FieldBuilder> = new Set()

  onDisabled?(isDisabled: boolean): void
  onHidden?(isHidden: boolean): void
  onValidate?(type: ValidateType, error: FieldErrors): void

  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onMounted?(): void
  onUnmounted?(): void

  constructor() {
    this.updateQueueMap.set('value', {
      ...createUpdateQueue<T>(),
      dispatch: this.setValue.bind(this),
      lastRenderedState: undefined as T,
      baseQueue: null
    })
    const stop = effectScope(() => {
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
  }

  appendEffectField(field: FieldBuilder) {
    this.effectFields.add(field)
  }

  normalizeRelation() {
    if (this.#relation) {
      this.#relation.forEach(relation => {
        relation.call(this as any)
      })
    }
  }

  normalizeField() {
    this.isHidden.update()
    this.isDisabled.update()
    this.normalizeRelation()
    this.validatePassive({ value: this.value })
  }

  setValueWillPending(isPending: boolean) {
    this[ValueStatus.Pending].value = isPending
  }

  setValueWillCommiting(isCommiting: boolean) {
    this[ValueStatus.Commiting].value = isCommiting
  }

  setValueWillCommitted(isCommitted: boolean) {
    this[ValueStatus.Committed].value = isCommitted
  }

  get isRoot() {
    return this.parent === null
  }

  get isLeaf() {
    return isArray(this.properties) ? this.properties?.length === 0 : true
  }

  get isVoidField() {
    return this.#type === "Void"
  }

  get isField() {
    return this.#type === "Field"
  }

  getValueStatus() {
    return {
      committed: this[ValueStatus.Committed].value,
      commiting: this[ValueStatus.Commiting].value,
      pending: this[ValueStatus.Pending].value,
      failed: this[ValueStatus.Failed].value,
    }
  }

  getValueStatusMethods() {
    return {
      setValueWillPending: this.setValueWillPending.bind(this),
      setValueWillCommiting: this.setValueWillCommiting.bind(this),
      setValueWillCommitted: this.setValueWillCommitted.bind(this),
    }
  }

  #batchDispatchEffectStart() {
    this.effectFields.forEach(field => {
      const { setValueWillCommiting, setValueWillPending, setValueWillCommitted } = field.getValueStatusMethods()
      setValueWillCommiting(true)
      setValueWillPending(true)
      setValueWillCommitted(false)
      field.#batchDispatchEffectStart()
    })
  }

  #batchDispatchEffectEnd() {
    this.effectFields.forEach(field => {
      const { setValueWillCommiting, setValueWillPending, setValueWillCommitted } = field.getValueStatusMethods()
      setValueWillCommiting(false)
      setValueWillPending(false)
      setValueWillCommitted(true)
    })
  }

  resetStatus() {
    this.isInitialized.value = true
    this[ValueStatus.Commiting].value = true
    this.isBlurred.value = false
    this.isFocused.value = false
    this.isDestroyed.value = false
    this.errors.value = {}
    this.#$value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    const { setDefaultValue } = this.#actions
    const filedValue: any = isFunction(setDefaultValue) ? setDefaultValue.call(this) : model;
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
    this.resetStatus()
    this.onBeforeInit?.()

    const { setDefaultValue } = this.#actions
    const filedValue = isFunction(setDefaultValue) ? setDefaultValue.call(this) : model;
    if (filedValue === undefined && this.#properties?.length) {
      return
    }
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
      })
    } else {
      this.value = filedValue as T
    }
  }

  execDecision(decision: Decision) {
    return this.#abstractModel.execDecision(decision)
  }

  setFieldErrors(errors: FieldErrors) {
    this.setErrors(errors)
    if (isEmpty(errors.initiative) && isEmpty(errors.passive)) {
      this.cleanErrors()
      return;
    }
    this.#abstractModel.setFieldErrors(this.path, errors)
  }

  cleanErrors() {
    this.errors.value = {}
    this.#abstractModel.cleanErrors([this.path])
    return;
  }

  setErrors(errors: FieldErrors) {
    this.errors.value = errors
  }

  async onSubmit(): Promise<T> {
    const { onSubmitValue } = this.#actions
    if (this.#properties) {
      const model: any = {} as T
      await Promise.all(this.#properties.map(async (field) => {
        if (field.isVoidField) {
          Object.assign(model, await field.onSubmit())
          return
        }
        return set(model, field.id, await field.onSubmit())
      }))
      return onSubmitValue ? onSubmitValue.call(this, model) : model
    }
    if (this.isField) {
      return onSubmitValue ? onSubmitValue.call(this, this.value) : this.value
    } else {
      return undefined as unknown as T
    }
  }

  type(type: FieldBuilderType) {
    this.#type = type
    return this
  }

  lifecycle(hooks: Lifecycle<T, P>) {
    Object.assign(this, hooks)
    return this
  }

  actions(actions: ActionOptions<T, P>) {
    this.#actions = actions
    return this
  }

  component(options: ComponentOptions<T>) {
    const { component, id, type, ...otherOptions } = options
    this.#component = component
    this.#type = type || "Field"
    this.id = id || `void_${index++}`
    Object.assign(this, otherOptions)
    return this
  }

  initialValue(initialValue: () => T | T | Promise<T>) {
    if (isFunction(initialValue)) {
      const value = initialValue()
      if (isPromise(value)) {
        value.then((v) => {
          this.value = v
        })
      } else {
        this.value = value
      }
    } else {
      this.value = initialValue
    }
    return this
  }

  properties(properties: FieldBuilder[]) {
    this.#properties = properties
    return this
  }

  updateProperties(properties: FieldBuilder[]) {
    this.#properties = properties
    this.normalizeProperties(true)
    this.forceRender()
  }

  forceRender() {
    // force render the component
  }

  getProperties() {
    return this.#properties
  }

  #getValidParentFieldPath() {
    if (this.parent?.isVoidField) {
      const parent = getParentField(this as FieldBuilder)
      if (parent) {
        return parent.path
      } else {
        return ""
      }
    } else {
      return this.parentpath
    }
  }

  normalizeProperties(isShallow: boolean = false) {
    if (this.#properties) {
      const parentpath = this.#getValidParentFieldPath()
      this.#properties.forEach((field) => {
        if (field.isInitialized.value) {
          return
        }
        field.parent = this as FieldBuilder
        field.parentpath = this.path
        if (this.isVoidField) {
          if (parentpath) {
            field.path = `${parentpath}.${field.id}`
          } else {
            field.path = field.id
          }
        } else {
          field.path = `${this.path}.${field.id}`
        }
        field.setAbstractModel(this.#abstractModel)
        field.setAppContext(this.#appContext)
        if (!isShallow) {
          field.normalizeProperties()
        }
        field.reset()
        field.onInit?.()
        if (field.isField) {
          this.#abstractModel.addField(field)
        }
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

  validator(options: ValidatorOptions<T> | object) {
    if (!isObject(options)) {
      throw new Error('validator options must be an object')
    }

    if (!options.initiative && !options.passive) {
      options = {
        initiative: options
      }
    }

    const { initiative, passive } = options as ValidatorOptions<T>
    const normalizeValidator = {
      initiative: initiative ? formatValidateItem(initiative) : [],
      passive: passive ? formatValidateItem(passive) : [],
    }

    this.#validator = normalizeValidator
    return this
  }

  async validatePassive(context: Pick<Context<T>, 'value' | 'updateOn'>) {
    return this.validate(context, "passive")
  }

  async validateInitiative(context: Pick<Context<T>, 'value' | 'updateOn'>) {
    return this.validate(context, "initiative")
  }

  async validate<T>(context: Pick<Context<T>, 'value' | 'updateOn'>, mode: ValidateMode = "initiative") {
    if (this.isVoidField) return
    this.isValidating.value = true
    return new Promise<FieldErrors>((resolve, reject) => {
      if (mode !== 'passive') {
        this.#abstractModel.validate(context, this.#validator.initiative ?? []).then(resolve, reject)
      } else {
        this.#abstractModel.validate(context, this.#validator.passive ?? []).then(resolve, reject)
      }
    }).then(errors => {
      this.setFieldErrors({
        ...this.errors.value,
        [mode]: errors
      })
      this.onValidate?.(mode, errors)
      return errors
    }).finally(() => {
      this.isValidating.value = false
    })
  }

  props(ps: P) {
    Object.keys(ps).forEach((key) => {
      this.updateQueueMap.set(key, {
        ...createUpdateQueue(),
        // @ts-ignore
        dispatch: this.setProp.bind(this, key),
        lastRenderedState: undefined,
        baseQueue: null
      })
    })
    Object.assign(this.#props, ps)
    return this
  }

  setProp<K extends keyof P, V extends P[K]>(key: K, action: Action<V>) {
    const line = requestUpdateLane()
    const update = createUpdate(action, line)
    const propUpdateQueue = this.updateQueueMap.get(key as string)!
    enqueueUpdate(propUpdateQueue, update)
    updater.enqueueUpdate(() => {
      this.updateState(line, key)
    }, line)
  }

  events(events: Record<string, (this: Field<FieldBuilder<T, P>>, ...args: any[]) => void>) {
    Object.entries(events).forEach(([key, value]) => {
      this.#events[key] = value.bind(this as Field<FieldBuilder<T, P>>)
    })
    return this
  }

  getProps() {
    return {
      ...this.#props,
      value: this.value,
      errors: this.errors.value,
    }
  }

  getStatus() {
    return {
      isHidden: this.isHidden.value,
      isBlurred: this.isBlurred.value,
      isFocused: this.isFocused.value,
      isMounted: this.isMounted.value,
      isDestroyed: this.isDestroyed.value,
      isInitialized: this.isInitialized.value,
      isDisabled: this.isDisabled.value,
      isValidating: this.isValidating.value,
    }
  }

  getEvents() {
    return this.#events
  }
}

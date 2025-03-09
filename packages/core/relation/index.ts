import { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals";
import { Graph } from "./graph";
import { hasChanged } from "../hooks/defineRelation";
import { from, of, Subject } from "rxjs";
import {
  switchMap,
  catchError,
  tap,
} from "rxjs/operators";

const dependencyGraph = new Graph();
const fieldIdMap = new Map<FieldBuilder<any>, string>();
let uniqueIdCounter = 0;
const pendingUpdates = new Map<string, Set<string[]>>();
let isProcessingUpdates = false;
const fieldCallbacks = new Map<string, WeakMap<string[], (field: FieldBuilder, depValues: any) => void | Promise<void>>>();

const updateProcessors = new Map<string, Map<string, Subject<{
  field: FieldBuilder;
  callback: (field: FieldBuilder, depValues: any) => void | Promise<void>;
  depValues: any[];
}>>>();

function createDepsKey(deps: string[]): string {
  return [...deps].sort().join(',');
}

function getUpdateProcessor(fieldId: string, deps: string[]): Subject<{
  field: FieldBuilder;
  callback: (field: FieldBuilder, depValues: any) => void | Promise<void>;
  depValues: any[];
}> {
  const depsKey = createDepsKey(deps);

  if (!updateProcessors.has(fieldId)) {
    updateProcessors.set(fieldId, new Map());
  }

  const fieldProcessors = updateProcessors.get(fieldId)!;

  if (!fieldProcessors.has(depsKey)) {
    const processor = new Subject<{
      field: FieldBuilder;
      callback: (field: FieldBuilder, depValues: any) => void | Promise<void>;
      depValues: any[];
    }>();

    processor.pipe(
      switchMap(({ field, callback, depValues }) => {
        try {
          const result = callback(field, depValues.length === 1 ? depValues[0] : depValues);

          if (result instanceof Promise) {
            return from(result).pipe(
              tap(resolvedValue => {
                console.log(`Updating field ${fieldId} with value:`, resolvedValue);
              }),
              tap(resolvedValue => {
                if (resolvedValue !== undefined) {
                  field.setValue(resolvedValue);
                }
              }),
              catchError(err => {
                console.error(`Error updating field ${fieldId}:`, err);
                return of(null);
              })
            );
          }
          else {
            if (result !== undefined) {
              field.setValue(result);
            }
            return of(null);
          }
        } catch (error) {
          console.error(`Error executing callback for field ${fieldId}:`, error);
          return of(null);
        }
      })
    ).subscribe();

    fieldProcessors.set(depsKey, processor);
  }
  return fieldProcessors.get(depsKey)!;
}

function getFieldId(field: FieldBuilder<any>): string {
  if (!fieldIdMap.has(field)) {
    const id = field.path || `field_${uniqueIdCounter++}`;
    fieldIdMap.set(field, id);
    dependencyGraph.addVertex(id, field);
  }
  return fieldIdMap.get(field)!;
}

function queueMicrotask(callback: () => void): void {
  Promise.resolve().then(callback);
}

async function processUpdates(): Promise<void> {
  if (isProcessingUpdates || pendingUpdates.size === 0) return;

  isProcessingUpdates = true;

  try {
    const updateOrder: string[] = dependencyGraph.getOrder();
    for (const fieldId of updateOrder) {
      if (pendingUpdates.has(fieldId)) {
        const depSet = pendingUpdates.get(fieldId)!;
        const field = dependencyGraph.nodes.get(fieldId)?.data;
        const callbackMap = fieldCallbacks.get(fieldId);

        if (field && callbackMap) {
          for (const deps of depSet) {
            const callback = callbackMap.get(deps);
            if (callback) {
              const depValues = deps.map(depId => {
                const depField = field.getAbstractModel().getField(depId);
                return depField ? depField.value : undefined;
              });
              const processor = getUpdateProcessor(fieldId, deps);
              processor.next({
                field,
                callback,
                depValues
              });
            }
          }
        }
        pendingUpdates.delete(fieldId);
      }
    }
  } finally {
    isProcessingUpdates = false;

    if (pendingUpdates.size > 0) {
      queueMicrotask(() => processUpdates());
    }
  }
}

function notifyDependencyUpdate(fieldId: string, deps: string[]): void {
  if (!pendingUpdates.has(fieldId)) {
    pendingUpdates.set(fieldId, new Set());
  }
  pendingUpdates.get(fieldId)!.add(deps);

  if (!isProcessingUpdates) {
    queueMicrotask(() => processUpdates());
  }
}

export function cleanupRelation(field: FieldBuilder<any>, effect: Effect, deps: string[]): void {
  const fieldId = fieldIdMap.get(field);
  if (!fieldId) return;

  effect.stop();

  fieldCallbacks.get(fieldId)?.delete(deps);

  const depsKey = createDepsKey(deps);
  const fieldProcessors = updateProcessors.get(fieldId);
  if (fieldProcessors) {
    const processor = fieldProcessors.get(depsKey);
    if (processor) {
      processor.complete();
      fieldProcessors.delete(depsKey);
    }

    if (fieldProcessors.size === 0) {
      updateProcessors.delete(fieldId);
    }
  }
}

function defineRelation<T extends FieldBuilder>(
  field: T,
  dependencies: string | string[],
  updateCallback: (field: T, depValues: any) => void | Promise<void>,
  options: {
    once?: boolean,
    immediate?: boolean,
  } = {}
): () => void {
  let effect!: Effect<any>;
  const deps = isArray(dependencies) ? dependencies : [dependencies];
  const getter = () => field.getAbstractModel().getFieldsValue(deps);
  let oldValue: any;

  if (options.once) {
    const _cb = updateCallback
    updateCallback = function (...args) {
      _cb(...args);
      cleanupRelation(field, effect, deps)
    }
  }

  const fieldId = getFieldId(field);
  // @ts-ignore
  fieldCallbacks.has(fieldId) ? fieldCallbacks.get(fieldId)?.set(deps, updateCallback) : fieldCallbacks.set(fieldId, new WeakMap([[deps, updateCallback]]));

  deps.forEach(depId => {
    const depField = field.getAbstractModel().getField(depId);
    if (!depField) {
      console.warn(`the dependency field does not exist: ${depId}`);
      return;
    }
    const depFieldId = getFieldId(depField);
    dependencyGraph.addEdge(depFieldId, fieldId);
  });

  const job = (immediateFirstRun?: boolean) => {
    if (!effect.active || (!immediateFirstRun && !effect.dirty)) {
      return
    }
    const newValue = effect.run()
    if (!hasChanged(newValue, oldValue)) {
      return
    }

    notifyDependencyUpdate(fieldId, deps);
    oldValue = newValue
  }

  effect = new Effect(getter)
  effect.scheduler = job

  if (options.immediate) {
    job(true)
  } else {
    oldValue = effect.run()
  }

  return () => cleanupRelation(field, effect, deps);
}

export function setupRelation<T extends FieldBuilder>(options: {
  field: T,
  dependencies: string | string[] | FieldBuilder | FieldBuilder[],
  update: (field: T, depValues: any) => void | T['value'] | Promise<T['value']>,
  options?: {
    once?: boolean,
    immediate?: boolean,
  }
}): () => void {
  const dependencies = isArray(options.dependencies) ? options.dependencies : [options.dependencies];
  const depIds = dependencies.map(dep => {
    if (dep instanceof FieldBuilder) {
      return getFieldId(dep);
    }
    return dep;
  });
  return defineRelation(options.field, depIds, options.update, options.options);
}

export function setupRelations(relations: Array<{
  field: FieldBuilder<any>,
  dependencies: string | string[],
  update: (field: FieldBuilder<any>, depValues: any) => void | Promise<void>
  options?: {
    once?: boolean,
    immediate?: boolean,
  }
}>): () => void {
  const cleanupFns = relations.map(relation =>
    setupRelation({
      field: relation.field,
      dependencies: relation.dependencies,
      update: relation.update,
      options: relation.options,
    })
  );
  return () => cleanupFns.forEach(fn => fn());
}

export function debugDependencyGraph(): void {
  console.log("当前依赖图:");
  dependencyGraph.print();
  console.log("待更新字段:", Array.from(pendingUpdates.entries())
    .map(([id, deps]) => `${id}: ${Array.from(deps).map(d => d.join(','))}`));
  console.log("处理器数量:", Array.from(updateProcessors.entries())
    .map(([id, map]) => `${id}: ${map.size}`));
}

export function getRelationDebugInfo() {
  return {
    dependencyGraph,
    pendingUpdates: Array.from(pendingUpdates.entries())
      .map(([id, deps]) => [id, Array.from(deps)]),
    activeProcessors: Array.from(updateProcessors.entries())
      .map(([id, map]) => [id, Array.from(map.keys())]),
    fieldCount: fieldIdMap.size,
  };
}

import { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals";
import { Graph } from "./graph";
import { hasChanged } from "../hooks/defineRelation";

const dependencyGraph = new Graph();

const fieldIdMap = new Map<FieldBuilder<any>, string>();
let uniqueIdCounter = 0;

const pendingUpdates = new Map<string, Set<string[]>>();
let isProcessingUpdates = false;

const fieldCallbacks = new Map<string, WeakMap<string[], (field: FieldBuilder, depValues: any) => void | Promise<void>>>();

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
        const callbackMap = fieldCallbacks.get(fieldId)

        if (field && callbackMap) {
          for (const deps of depSet) {
            const callback = fieldCallbacks.get(fieldId)?.get(deps);
            if (callback) {
              const depValues = deps.map(depId => {
                const depField = dependencyGraph.nodes.get(depId)?.data;
                return depField ? depField.value : undefined;
              });

              const result = callback(field, depValues.length === 1 ? depValues[0] : depValues);

              if (result instanceof Promise) {
                await result;
              }
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
}

function defineRelation<T extends FieldBuilder>(
  field: T,
  dependencies: string | string[],
  updateCallback: (field: T, depValues: any) => void | Promise<void>,
  options: {
    priority?: number,
    once?: boolean,
    immediate?: boolean,
    possibleInterruption?: () => boolean,
  } = { priority: 0 }
): () => void {
  let effect!: Effect<any>;
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
  const deps = isArray(dependencies) ? dependencies : [dependencies];
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
  update: (field: T, depValues: any) => void | Promise<void>,
  options?: {
    priority?: number,
    once?: boolean,
    immediate?: boolean,
    possibleInterruption?: () => boolean,
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
    priority?: number,
    once?: boolean,
    immediate?: boolean,
    possibleInterruption?: () => boolean,
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
  console.log("current dependency graph:");
  dependencyGraph.print();
  console.log("fields to be updated:", Array.from(pendingUpdates));
  console.log("field update version:");
}

export function getRelationDebugInfo() {
  return {
    dependencyGraph,
    pendingUpdates: Array.from(pendingUpdates),
    fieldCount: fieldIdMap.size,
  };
}

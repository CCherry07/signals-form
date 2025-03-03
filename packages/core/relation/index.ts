import type { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals";
import { Graph } from "./graph";

const dependencyGraph = new Graph();

const fieldIdMap = new Map<FieldBuilder<any>, string>();
let uniqueIdCounter = 0;

const pendingUpdates = new Map<string, Set<string[]>>();
let isProcessingUpdates = false;

const fieldEffects = new Map<string, Effect<any>[]>();

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
    let updateOrder: string[];

    try {
      updateOrder = dependencyGraph.topologicalSort();
    } catch (error) {
      console.warn('检测到循环依赖，使用替代解决方案');
      updateOrder = handleCyclicDependencies();
    }
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

function handleCyclicDependencies(): string[] {
  const sccs = dependencyGraph.tarjanSCC();
  const condensedGraph = new Graph();
  const fieldToScc = new Map<string, number>();
  sccs.forEach((scc, index) => {
    condensedGraph.addVertex(`scc_${index}`);
    scc.forEach(fieldId => {
      fieldToScc.set(fieldId, index);
    });
  });

  dependencyGraph.nodes.forEach((vertex, fieldId) => {
    const fromScc = fieldToScc.get(fieldId);
    if (fromScc === undefined) return;

    vertex.outDegree.forEach(edge => {
      const toScc = fieldToScc.get(edge.next.name);
      if (toScc === undefined || fromScc === toScc) return;

      condensedGraph.addEdge(`scc_${fromScc}`, `scc_${toScc}`);
    });
  });
  const sccOrder = condensedGraph.topologicalSort();

  const result: string[] = [];
  const processedFields = new Set<string>();

  sccOrder.forEach(sccId => {
    const sccIndex = parseInt(sccId.substring(4), 10);
    const fieldsInScc = sccs[sccIndex] || [];

    [...fieldsInScc].sort().forEach(fieldId => {
      result.push(fieldId);
      processedFields.add(fieldId);
    });
  });

  dependencyGraph.nodes.forEach((_, fieldId) => {
    if (!processedFields.has(fieldId)) {
      result.push(fieldId);
    }
  });
  return result;
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

export function cleanupRelation(field: FieldBuilder<any>): void {
  const fieldId = fieldIdMap.get(field);
  if (!fieldId) return;

  const effects = fieldEffects.get(fieldId);
  if (effects) {
    effects.forEach(effect => effect.stop());
    fieldEffects.delete(fieldId);
  }

  fieldCallbacks.delete(fieldId);
  pendingUpdates.delete(fieldId);
  dependencyGraph.removeVertex(fieldId);
  fieldIdMap.delete(field);
}

function defineRelation<T extends FieldBuilder>(
  field: T,
  dependencies: string | string[],
  updateCallback: (field: T, depValues: any) => void | Promise<void>
): () => void {
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
  const effect = new Effect(() => {
    return field.getAbstractModel().getFieldsValue(deps);
  });

  effect.scheduler = () => {
    if (effect.active && effect.dirty) {
      effect.run();
      notifyDependencyUpdate(fieldId, deps);
    }
  };

  effect.run();

  fieldEffects.set(fieldId, [effect]);

  return () => cleanupRelation(field);
}

export function setupRelation<T extends FieldBuilder<any, any>>(options: {
  field: T,
  dependencies: string | string[],
  update: (field: T, depValues: any) => void | Promise<void>
}): () => void {
  return defineRelation(options.field, options.dependencies, options.update);
}

export function setupRelations(relations: Array<{
  field: FieldBuilder<any>,
  dependencies: string | string[],
  update: (field: FieldBuilder<any>, depValues: any) => void | Promise<void>
}>): () => void {
  const cleanupFns = relations.map(relation =>
    defineRelation(relation.field, relation.dependencies, relation.update)
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
    effectCount: fieldEffects.size,
  };
}

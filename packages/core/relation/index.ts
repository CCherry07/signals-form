import type { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals";
import { Graph } from "./graph";

// 全局依赖图实例
const dependencyGraph = new Graph();

// 维护字段ID映射
const fieldIdMap = new Map<FieldBuilder<any>, string>();
let uniqueIdCounter = 0;

// 维护更新队列
// 维护更新队列，由字段ID映射到依赖键集合
const pendingUpdates = new Map<string, Set<string[]>>();
let isProcessingUpdates = false;

// 维护字段的Effect实例，便于清理
const fieldEffects = new Map<string, Effect<any>[]>();

// 维护字段对的更新回调
const fieldCallbacks = new Map<string, WeakMap<string[], (field: FieldBuilder<any>, depValues: any) => void | Promise<void>>>();

// 生成唯一字段ID
function getFieldId(field: FieldBuilder<any>): string {
  if (!fieldIdMap.has(field)) {
    const id = field.path || `field_${uniqueIdCounter++}`;
    fieldIdMap.set(field, id);

    // 初始化字段节点
    dependencyGraph.addVertex(id, field);
  }
  return fieldIdMap.get(field)!;
}

// 使用微任务队列处理更新
function queueMicrotask(callback: () => void): void {
  Promise.resolve().then(callback);
}

// 处理依赖更新
async function processUpdates(): Promise<void> {
  if (isProcessingUpdates || pendingUpdates.size === 0) return;

  isProcessingUpdates = true;

  try {
    // 获取拓扑排序
    let updateOrder: string[];

    try {
      updateOrder = dependencyGraph.topologicalSort();
    } catch (error) {
      console.warn('检测到循环依赖，使用替代解决方案');
      updateOrder = handleCyclicDependencies();
    }
    // 按拓扑顺序处理更新
    for (const fieldId of updateOrder) {
      if (pendingUpdates.has(fieldId)) {
        const depSet = pendingUpdates.get(fieldId)!;
        const field = dependencyGraph.nodes.get(fieldId)?.data;
        const callbackMap = fieldCallbacks.get(fieldId)

        if (field && callbackMap) {
          for (const deps of depSet) {
            const callback = fieldCallbacks.get(fieldId)?.get(deps);
            if (callback) {
              try {
                // 收集依赖值
                const depValues = deps.map(depId => {
                  const depField = dependencyGraph.nodes.get(depId)?.data;
                  return depField ? depField.value : undefined;
                });

                // 执行更新
                const result = callback(field, depValues.length === 1 ? depValues[0] : depValues);

                // 处理异步回调
                if (result instanceof Promise) {
                  await result;
                }
              } catch (err) {
                console.error(`处理字段 ${fieldId} 的更新时出错:`, err);
              }
            }
          }
        }
        pendingUpdates.delete(fieldId);
      }
    }
  } finally {
    isProcessingUpdates = false;

    // 检查是否有新的更新入队
    if (pendingUpdates.size > 0) {
      queueMicrotask(() => processUpdates());
    }
  }
}

// 获取字段依赖
function getDependencies(fieldId: string): string[] {
  const dependencies: string[] = [];
  const vertex = dependencyGraph.nodes.get(fieldId);

  if (vertex) {
    vertex.inDegree.forEach(dep => {
      dependencies.push(dep.name);
    });
  }

  return dependencies;
}

// 处理循环依赖
function handleCyclicDependencies(): string[] {
  // 使用Tarjan算法找到强连通分量
  const sccs = dependencyGraph.tarjanSCC();
  // 创建缩减图
  const condensedGraph = new Graph();
  const fieldToScc = new Map<string, number>();
  // 为每个SCC创建节点
  sccs.forEach((scc, index) => {
    condensedGraph.addVertex(`scc_${index}`);
    scc.forEach(fieldId => {
      fieldToScc.set(fieldId, index);
    });
  });

  // 在SCC之间添加边
  dependencyGraph.nodes.forEach((vertex, fieldId) => {
    const fromScc = fieldToScc.get(fieldId);
    if (fromScc === undefined) return;

    vertex.outDegree.forEach(edge => {
      const toScc = fieldToScc.get(edge.next.name);
      if (toScc === undefined || fromScc === toScc) return;

      condensedGraph.addEdge(`scc_${fromScc}`, `scc_${toScc}`);
    });
  });

  // 对缩减图进行拓扑排序
  const sccOrder = condensedGraph.topologicalSort();

  // 展开SCC为字段列表，确保非循环部分的字段依然被正确地更新
  const result: string[] = [];
  const processedFields = new Set<string>();

  sccOrder.forEach(sccId => {
    const sccIndex = parseInt(sccId.substring(4), 10);
    const fieldsInScc = sccs[sccIndex] || [];

    // 首先处理SCC内的所有字段
    [...fieldsInScc].sort().forEach(fieldId => {
      result.push(fieldId);
      processedFields.add(fieldId);
    });
  });

  // 确保所有字段都被处理，包括那些不在任何SCC中的
  dependencyGraph.nodes.forEach((_, fieldId) => {
    if (!processedFields.has(fieldId)) {
      result.push(fieldId);
    }
  });
  return result;
}

// 为特定依赖触发更新
function notifyDependencyUpdate(fieldId: string, deps: string[]): void {
  if (!pendingUpdates.has(fieldId)) {
    pendingUpdates.set(fieldId, new Set());
  }
  pendingUpdates.get(fieldId)!.add(deps);

  if (!isProcessingUpdates) {
    queueMicrotask(() => processUpdates());
  }
}
// 清理字段的关联资源
export function cleanupRelation(field: FieldBuilder<any>): void {
  const fieldId = fieldIdMap.get(field);
  if (!fieldId) return;

  // 清理Effects
  const effects = fieldEffects.get(fieldId);
  if (effects) {
    effects.forEach(effect => effect.stop());
    fieldEffects.delete(fieldId);
  }

  // 清理回调和依赖图
  fieldCallbacks.delete(fieldId);
  pendingUpdates.delete(fieldId);
  dependencyGraph.removeVertex(fieldId);
  fieldIdMap.delete(field);
}

// 定义关系
function defineRelation<T extends FieldBuilder>(
  field: FieldBuilder<T>,
  dependencies: string | string[],
  updateCallback: (field: FieldBuilder<T>, depValues: any) => void | Promise<void>
): () => void {
  const fieldId = getFieldId(field);
  const deps = isArray(dependencies) ? dependencies : [dependencies];
  // 注册更新回调
  fieldCallbacks.has(fieldId) ? fieldCallbacks.get(fieldId)?.set(deps, updateCallback) : fieldCallbacks.set(fieldId, new WeakMap([[deps, updateCallback]]));
  // 添加依赖关系
  deps.forEach(depId => {
    try {
      // 确保依赖字段存在
      const depField = field.getAbstractModel().getField(depId);
      if (!depField) {
        console.warn(`依赖字段不存在: ${depId}`);
        return;
      }
      const depFieldId = getFieldId(depField);
      // 添加依赖关系：当 depField 更新时，field 也需要更新
      dependencyGraph.addEdge(depFieldId, fieldId);
    } catch (err) {
      console.error(`添加依赖关系时出错: ${depId} -> ${fieldId}`, err);
    }
  });
  // 创建一个Effect监听所有依赖
  const effect = new Effect(() => {
    // 显式访问每个依赖的值，确保都被正确追踪
    return field.getAbstractModel().getFieldsValue(deps);
  });

  // 配置Effect的调度器
  effect.scheduler = () => {
    if (effect.active && effect.dirty) {
      // 执行effect获取最新值
      const values = effect.run();
      // 通知字段需要更新
      notifyDependencyUpdate(fieldId, deps);
    }
  };

  // 初始运行Effect
  effect.run();

  // 存储effect用于后续清理
  fieldEffects.set(fieldId, [effect]);

  // 返回清理函数
  return () => cleanupRelation(field);
}

// 新的API设计，更简洁明了
export function setupRelation<T extends FieldBuilder<any, any>>(options: {
  field: T,
  dependencies: string | string[],
  update: (field: T, depValues: any) => void | Promise<void>
}): () => void {
  return defineRelation(options.field, options.dependencies, options.update);
}

// 批量设置关系
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

// 调试函数
export function debugDependencyGraph(): void {
  console.log("当前依赖图:");
  dependencyGraph.print();
  console.log("待更新字段:", Array.from(pendingUpdates));
  console.log("字段更新版本:");
}

// 为调试目的暴露内部状态
export function getRelationDebugInfo() {
  return {
    dependencyGraph,
    pendingUpdates: Array.from(pendingUpdates),
    fieldCount: fieldIdMap.size,
    effectCount: fieldEffects.size,
  };
}

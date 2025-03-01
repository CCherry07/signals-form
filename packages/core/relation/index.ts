import type { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals";
import { Graph } from "./graph";

// 全局依赖图实例
const dependencyGraph = new Graph();

// 维护字段ID映射
const fieldIdMap = new Map<FieldBuilder<any>, string>();
let uniqueIdCounter = 0;

// 维护更新队列
const pendingUpdates = new Set<string>();
let isProcessingUpdates = false;
let updateTimer: NodeJS.Timeout | null = null;

// 维护字段对的更新回调
const updateCallbacks = new Map<string, (field: FieldBuilder<any>, values: any) => void>();

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

// 处理依赖更新
function processUpdates(): void {
  isProcessingUpdates = true;

  try {
    // 获取拓扑排序
    let updateOrder: string[];

    try {
      updateOrder = dependencyGraph.topologicalSort();
    } catch (error) {
      // 处理循环依赖
      updateOrder = handleCyclicDependencies();
    }
    console.log('updateOrder', updateOrder);
    
    // 按拓扑顺序处理更新
    for (const fieldId of updateOrder) {
      if (pendingUpdates.has(fieldId)) {
        const field = dependencyGraph.nodes.get(fieldId)?.data;
        const callback = updateCallbacks.get(fieldId);
        console.log('field', callback?.toString());
        
        if (field && callback) {
          // 收集依赖值
          const dependencies = getDependencies(fieldId);
          const depValues = dependencies.map(depId => {
            const depField = dependencyGraph.nodes.get(depId)?.data;
            return depField ? depField.value : undefined;
          });
          // 执行更新
          callback(field, depValues.length === 1 ? depValues[0] : depValues);
        }

        pendingUpdates.delete(fieldId);
      }
    }
  } finally {
    isProcessingUpdates = false;

    // 检查是否有新的更新入队
    if (pendingUpdates.size > 0) {
      queueUpdates();
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

  // 展开SCC为字段列表
  const result: string[] = [];
  sccOrder.forEach(sccId => {
    const sccIndex = parseInt(sccId.substring(4), 10);
    const fieldsInScc = sccs[sccIndex] || [];

    // 对SCC内部的字段进行任意排序（这里简单按ID排序）
    [...fieldsInScc].sort().forEach(fieldId => {
      result.push(fieldId);
    });
  });

  return result;
}

// 队列更新，使用微任务延迟
function queueUpdates(): void {
  processUpdates();
}

// 注册字段更新
function notifyFieldUpdate(fieldId: string): void {
  pendingUpdates.add(fieldId);
  queueUpdates();
}

// 新的关系定义函数
export function defineRelation<T extends FieldBuilder>(
  field: FieldBuilder<T>,
  dependencies: string | string[],
  updateCallback: (field: FieldBuilder<T>, depValues: any) => void
): void {
  const fieldId = getFieldId(field);
  const deps = isArray(dependencies) ? dependencies : [dependencies];

  // 注册更新回调
  updateCallbacks.set(fieldId, updateCallback);
  console.log('updateCallbacks', updateCallbacks);
  
  // 添加依赖关系
  deps.forEach(depId => {
    // 确保依赖字段存在
    const depField = field.getAbstractModel().getField(depId);
    const depFieldId = getFieldId(depField);
    
    // 添加依赖关系：当 depField 更新时，field 也需要更新
    dependencyGraph.addEdge(depFieldId, fieldId);
  });

  // 创建一个effect来监听所有依赖的变化
  const getter = () => field.getAbstractModel().getFieldsValue(deps);
  const effect = new Effect(getter);

  effect.scheduler = function () {
    if (!effect.active || !effect.dirty) return;
    // 通知当前字段需要更新
    // notifyFieldUpdate(fieldId);
    const s = effect.run();
    updateCallback(field, s);
  }
  
  // 启动监听
  effect.run();
};

// 新的API设计，更简洁明了
export function setupRelation<T extends FieldBuilder>(options: {
  field: FieldBuilder<T>,
  dependencies: string | string[],
  update: (field: FieldBuilder<T>, depValues: any) => void
}): void {
  defineRelation(options.field, options.dependencies, options.update);
}

// 批量设置关系
export function setupRelations(relations: Array<{
  field: FieldBuilder<any>,
  dependencies: string | string[],
  update: (field: FieldBuilder<any>, depValues: any) => void
}>): void {
  relations.forEach(relation => {
    defineRelation(relation.field, relation.dependencies, relation.update);
  });
}

// 调试函数
export function debugDependencyGraph(): void {
  console.log("当前依赖图:");
  dependencyGraph.print();

  console.log("待更新字段:", Array.from(pendingUpdates));
}

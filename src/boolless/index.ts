import { signal, computed, Signal, effect } from '@preact/signals-core';

type MaybeSignal<T> = T | Signal<T>;

function toValue<T>(v: MaybeSignal<T>): T {
  return v instanceof Signal ? v.value : v;
}

type BoolValues = MaybeSignal<{ [key: string]: MaybeSignal<boolean> }>;

export enum OperatorEnum {
  AND = "and",
  OR = "or",
  NOT = "not",
  USE = "use"
}

export const Operator = {
  [OperatorEnum.AND]: (left: boolean, right: boolean) => left && right,
  [OperatorEnum.OR]: (left: boolean, right: boolean) => left || right,
  [OperatorEnum.NOT]: (left: boolean) => !left,
  [OperatorEnum.USE]: (left: boolean) => left
}

export const CustomOperator = {} as { [key: string]: (...bools: boolean[]) => boolean }
export const CustomDecisionCreator = {} as { [key: string]: (...ns: (string | Node)[]) => Decision }

export type Node = Decision | LeafNode;

export const D = {
  and: createAndDecision,
  or: createOrDecision,
  not: (left: string | Node) => {
    if (typeof left === 'string') {
      return new Decision(OperatorEnum.NOT, new LeafNode(left), new LeafNode(left));
    }
    return new Decision(OperatorEnum.NOT, left, left);
  },
  use: (left: string | Node) => {
    const node = typeof left === 'string' ? new LeafNode(left) : left;
    return new Decision(OperatorEnum.USE, node, node);
  },
}

const registedOperators = () => Object.keys(Operator).concat(Object.keys(CustomOperator));

export class Decision {
  private operator: OperatorEnum;
  private nodes: Node[];
  constructor(operator: OperatorEnum, ...nodes: Node[]) {
    if (!registedOperators().includes(operator)) {
      throw new Error(`Unknown Operator dsl: ${Operator}, please register it first`);
    }
    this.operator = operator;
    this.nodes = nodes;
  }

  evaluate(values: BoolValues): boolean {
    if (CustomOperator[this.operator]) {
      return CustomOperator[this.operator](...this.nodes.map(n => n.evaluate(values)));
    }
    switch (this.operator) {
      case OperatorEnum.AND:
        return this.nodes.every(node => node.evaluate(values));
      case OperatorEnum.OR:
        return this.nodes.some(node => node.evaluate(values));
      case OperatorEnum.NOT:
        return Operator.not(this.nodes[0].evaluate(values));
      case OperatorEnum.USE:
        return Operator.use(this.nodes[0].evaluate(values));
      default:
        throw new Error(`Unknown Operator dsl: ${this.operator}`);
    }
  }

  and(...nodes: (string | Node)[]): Decision {
    return createAndDecision(this, ...nodes);
  }

  or(...nodes: (string | Node)[]): Decision {
    return createOrDecision(this, ...nodes);
  }

  not(): Decision {
    return new Decision(OperatorEnum.NOT, this);
  }
}

export function registerCustomOperator(operatorDSL: string,
  { operator }: {
    operator: (left: boolean, right: boolean) => boolean
  }) {
  CustomOperator[operatorDSL] = operator;
  function DecisionCreator(this: Decision, ...ns: (string | Node)[]) {
    if (this instanceof Decision) {
      return new Decision(operatorDSL as OperatorEnum, ...[this, ...ns].map(n => typeof n === 'string' ? new LeafNode(n) : n));
    }
    return new Decision(operatorDSL as OperatorEnum, ...ns.map(n => typeof n === 'string' ? new LeafNode(n) : n));
  };

  CustomDecisionCreator[operatorDSL] = DecisionCreator
  // @ts-ignore
  D[operatorDSL] = DecisionCreator;
  // @ts-ignore
  Decision.prototype[operatorDSL] = DecisionCreator
}

export class LeafNode {
  name: string
  constructor(name: string | Function) {
    this.name = name instanceof Function ? name.toString() : name;
  }
  evaluate(context: BoolValues): boolean {
    return toValue(toValue(context)[this.name]);
  }
}

function createAndDecision(...ns: (string | Node)[]) {
  return new Decision(OperatorEnum.AND, ...ns.map(n => typeof n === 'string' ? new LeafNode(n) : n));
};

function createOrDecision(...ns: (string | Node)[]) {
  return new Decision(OperatorEnum.OR, ...ns.map(n => typeof n === 'string' ? new LeafNode(n) : n));
}

interface Context {
  a: Signal<string>,
  b: Signal<string>,
  c: Signal<string>,
  d: Signal<string>,
  userInfo: Signal<{ name: Signal<string>, age: Signal<number> }>
}

const context: Context = {
  a: signal('a'),
  b: signal('b'),
  c: signal('c'),
  d: signal('d'),
  userInfo: signal({ name: signal('Tom'), age: signal(18) })
};

const createBoolSignal = (check: (context: Context) => boolean) => computed(() => check(context));

const boolsContext = {
  isA: createBoolSignal(() => context.a.value === 'a'),
  isB: createBoolSignal(() => context.b.value === 'b'),
  isC: createBoolSignal(() => context.c.value === 'c'),
  isD: createBoolSignal(() => context.d.value === 'd'),
  isTom: createBoolSignal(() => context.userInfo.value.name.value === 'Tom')
};

const rootNode: Node = D.and(
  'isA',
  'isB',
  'isC',
).and("isTom", D.use('isD').not());

effect(() => {
  const result = rootNode.evaluate(boolsContext)
  console.log('Decision tree result:', result);
});

// 示例：改变信号值
context.d.value = 'a';  // 这将触发决策树的执行
context.userInfo.value.name.value = 'ccc';  // 这将触发决策树的执行

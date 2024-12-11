import { computed } from '@preact/signals-core';
import { MaybeSignal, toValue } from '@rxform/shared/signal';

export type BoolValues = MaybeSignal<Record<string, MaybeSignal<boolean>>>;

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
  constructor(name: string | (() => string)) {
    this.name = toValue(name) as string;
  }
  evaluate(context: BoolValues): boolean {
    const ctx = toValue(context) as Record<string, MaybeSignal<boolean>>;
    return toValue(ctx[this.name]);
  }
}

function createAndDecision(...ns: (string | Node)[]) {
  return new Decision(OperatorEnum.AND, ...ns.map(n => typeof n === 'string' ? new LeafNode(n) : n));
};

function createOrDecision(...ns: (string | Node)[]) {
  return new Decision(OperatorEnum.OR, ...ns.map(n => typeof n === 'string' ? new LeafNode(n) : n));
}

type Check = () => boolean;
const createBoolSignal = (check: Check) => computed(() => check());

export interface BoolsConfig<C> {
  [key: string]: (context: C) => boolean;
}

export const setup = <C>(bools: MaybeSignal<BoolsConfig<C>>, context: MaybeSignal<C>) => {
  return Object.fromEntries(Object.entries(toValue(bools)).map(([key, check]) => {
    return [key, createBoolSignal(() => check(context))];
  }));
}

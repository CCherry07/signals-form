import { computed, MaybeSignal, MaybeSignalOrGetter, toValue } from 'alien-deepsignals';

export type BoolContext = MaybeSignal<Record<string, MaybeSignalOrGetter<boolean>>>;

export enum OperatorEnum {
  AND = "and",
  OR = "or",
  NOT = "not",
  USE = "use"
}

export const Operator = {
  [OperatorEnum.AND]: (nodes: Node[], values: BoolContext) => nodes.every(node => node.evaluate(values)),
  [OperatorEnum.OR]: (nodes: Node[], values: BoolContext) => nodes.some(node => node.evaluate(values)),
  [OperatorEnum.NOT]: (node: Node, values: BoolContext) => !node.evaluate(values),
  [OperatorEnum.USE]: (node: Node, values: BoolContext) => node.evaluate(values),
}

export const CustomOperator = {} as { [key: string]: (...bools: boolean[]) => boolean }
export const CustomDecisionCreator = {} as { [key: string]: (...ns: (string | Node)[]) => Decision }

export type Node = Decision | LeafNode;

export interface D<T extends string | Node> {
  and: (...nodes: T[]) => Decision;
  or: (...nodes: T[]) => Decision;
  not: (node: T) => Decision;
  use: (node: T) => Decision;
}

export const D = {
  and: createAndDecision,
  or: createOrDecision,
  not: (node: string | Node) => {
    if (typeof node === 'string') {
      return new Decision(OperatorEnum.NOT, new LeafNode(node));
    }
    return new Decision(OperatorEnum.NOT, node);
  },
  use: (node: string | Node) => {
    return new Decision(OperatorEnum.USE, typeof node === 'string' ? new LeafNode(node) : node);
  },
};

/**
 * give typescript to get the key in bool context, no other function.
 * @param boolContext
 * @returns Decision Methods
 */
export function createDecision<T extends string>(boolContext: Record<T, unknown>){
  return D as D<keyof typeof boolContext>;
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

  evaluate(values: BoolContext): boolean {
    if (CustomOperator[this.operator]) {
      return CustomOperator[this.operator](...this.nodes.map(n => n.evaluate(values)));
    }
    switch (this.operator) {
      case OperatorEnum.AND:
        return Operator.and(this.nodes, values);
      case OperatorEnum.OR:
        return Operator.or(this.nodes, values);
      case OperatorEnum.NOT:
        return Operator.not(this.nodes[0], values);
      case OperatorEnum.USE:
        return Operator.use(this.nodes[0], values);
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
  evaluate(values: BoolContext): boolean {
    const ctx = toValue(values) as Record<string, MaybeSignal<boolean>>;
    if (ctx[this.name] === undefined) {
      throw new Error(`Unknown bool config: ${this.name}`);
    }
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

export const setup = <C>(bools: MaybeSignal<BoolsConfig<C>>, context: MaybeSignalOrGetter) => {
  return Object.fromEntries(Object.entries(toValue(bools)).map(([key, check]) => {
    return [key, createBoolSignal(() => check(toValue(context)))];
  }));
}

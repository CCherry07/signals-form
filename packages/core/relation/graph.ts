export class Vertex {
  name: string;
  inDegree: Vertex[];
  outDegree: Edge[];
  index: number | null;
  lowLink: number | null;
  onStack: boolean;
  data: any;

  constructor(name: string, data: any = null) {
    this.name = name;
    this.inDegree = [];
    this.outDegree = [];
    this.index = null;
    this.lowLink = null;
    this.onStack = false;
    this.data = data;
  }
}

export class Edge {
  next: Vertex;
  weight: number;

  constructor(next: Vertex, weight: number = 1) {
    this.next = next;
    this.weight = weight;
  }
}

export class Graph {
  nodes: Map<string, Vertex>;
  count: number;
  order: string[] = [];
  sccOrders: string[][] = [];
  hasCycle: boolean = false;
  cycles: string[][] = [];

  constructor() {
    this.nodes = new Map();
    this.count = 0;
  }

  addVertex(name: string, data: any = null): Vertex {
    if (!this.nodes.has(name)) {
      const vertex = new Vertex(name, data);
      this.nodes.set(name, vertex);
      this.count++;
      return vertex;
    }
    return this.nodes.get(name)!;
  }

  addEdge(from: string, to: string, weight: number = 1): void {
    const fromVertex = this.addVertex(from);
    const toVertex = this.addVertex(to);
    const edge = new Edge(toVertex, weight);
    fromVertex.outDegree.push(edge);
    toVertex.inDegree.push(fromVertex);
  }

  removeVertex(name: string): boolean {
    const vertex = this.nodes.get(name);
    if (!vertex) return false;

    this.nodes.forEach(v => {
      v.outDegree = v.outDegree.filter(e => e.next !== vertex);
      v.inDegree = v.inDegree.filter(v => v !== vertex);
    });

    this.nodes.delete(name);
    this.count--;
    return true;
  }

  removeEdge(from: string, to: string): boolean {
    const fromVertex = this.nodes.get(from);
    const toVertex = this.nodes.get(to);
    if (!fromVertex || !toVertex) return false;

    fromVertex.outDegree = fromVertex.outDegree.filter(e => e.next !== toVertex);
    toVertex.inDegree = toVertex.inDegree.filter(v => v !== fromVertex);
    return true;
  }

  getOrder(): string[] {
    if (this.order.length > 0) {
      return this.order
    }
    let { sorted, cycles } = this.topologicalSort();
    if (cycles.length > 0) {
      this.hasCycle = true;
      this.cycles = cycles;
      console.warn('relation has cycle dependencies:', this.cycles.map((cycle) => cycle.join(' -> ') + ' -> ' + cycle[0]));
      sorted = this.getOrderWithCycles()
    }
    this.order = sorted;
    return sorted;
  }

  tarjanSCC(): string[][] {
    if (this.sccOrders.length > 0) {
      return this.sccOrders
    }
    const stack: Vertex[] = [];
    const result: string[][] = [];
    let index = 0;

    const strongConnect = (v: Vertex) => {
      v.index = index;
      v.lowLink = index;
      index++;
      stack.push(v);
      v.onStack = true;

      for (const edge of v.outDegree) {
        const w = edge.next;
        if (w.index === null) {
          strongConnect(w);
          v.lowLink = Math.min(v.lowLink!, w.lowLink!);
        } else if (w.onStack) {
          v.lowLink = Math.min(v.lowLink!, w.index);
        }
      }

      if (v.lowLink === v.index) {
        const scc: string[] = [];
        let w: Vertex;
        do {
          w = stack.pop()!;
          w.onStack = false;
          scc.push(w.name);
        } while (w !== v);
        result.push(scc);
      }
    };

    this.nodes.forEach(node => {
      if (node.index === null) {
        strongConnect(node);
      }
    });

    this.sccOrders = result;

    return result;
  }

  getOrderWithCycles(): string[] {
    const sccs = this.tarjanSCC();

    const condensedGraph = new Graph();
    const nodeToScc = new Map<string, number>();

    sccs.forEach((scc, index) => {
      condensedGraph.addVertex(`scc_${index}`);
      scc.forEach(nodeId => {
        nodeToScc.set(nodeId, index);
      });
    });

    this.nodes.forEach((vertex, nodeId) => {
      const fromScc = nodeToScc.get(nodeId);
      if (fromScc === undefined) return;

      vertex.outDegree.forEach(edge => {
        const toScc = nodeToScc.get(edge.next.name);
        if (toScc === undefined || fromScc === toScc) return;

        condensedGraph.addEdge(`scc_${fromScc}`, `scc_${toScc}`);
      });
    });

    const { sorted: sccOrder } = condensedGraph.topologicalSort();

    const result: string[] = [];
    const processedNodes = new Set<string>();

    sccOrder.forEach(sccId => {
      const sccIndex = parseInt(sccId.substring(4), 10);
      const nodesInScc = sccs[sccIndex] || [];

      [...nodesInScc].sort().forEach(nodeId => {
        result.push(nodeId);
        processedNodes.add(nodeId);
      });
    });

    this.nodes.forEach((_, nodeId) => {
      if (!processedNodes.has(nodeId)) {
        result.push(nodeId);
      }
    });

    return result;
  }

  topologicalSort(): { sorted: string[]; cycles: string[][] } {
    const inDegreeMap = new Map<Vertex, number>();
    const queue: Vertex[] = [];
    const sorted: string[] = [];

    this.nodes.forEach(node => {
      inDegreeMap.set(node, node.inDegree.length);
      if (node.inDegree.length === 0) {
        queue.push(node);
      }
    });

    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node.name);
      for (const edge of node.outDegree) {
        const nextNode = edge.next;
        const newInDegree = inDegreeMap.get(nextNode)! - 1;
        inDegreeMap.set(nextNode, newInDegree);
        if (newInDegree === 0) {
          queue.push(nextNode);
        }
      }
    }

    this.order = sorted;

    if (sorted.length !== this.count) {
      const cycles = this.findAllCycles();
      return { sorted, cycles };
    }

    return { sorted, cycles: [] };
  }

  private findAllCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];

    const findCyclesDFS = (nodeName: string): void => {
      const node = this.nodes.get(nodeName)!;

      if (recursionStack.has(nodeName)) {
        const cycleStart = pathStack.indexOf(nodeName);
        if (cycleStart !== -1) {
          const cycle = pathStack.slice(cycleStart);
          cycle.push(nodeName);
          cycles.push(cycle);
        }
        return;
      }

      if (visited.has(nodeName)) {
        return;
      }

      visited.add(nodeName);
      recursionStack.add(nodeName);
      pathStack.push(nodeName);

      for (const edge of node.outDegree) {
        findCyclesDFS(edge.next.name);
      }

      pathStack.pop();
      recursionStack.delete(nodeName);
    };

    this.nodes.forEach((_, name) => {
      if (!visited.has(name)) {
        findCyclesDFS(name);
      }
    });

    return this.normalizeCycles(cycles);
  }

  private normalizeCycles(cycles: string[][]): string[][] {
    const normalizedCycles: string[][] = [];
    const cycleSignatures = new Set<string>();

    for (const cycle of cycles) {
      const actualCycle = cycle.slice(0, -1);

      const minElement = actualCycle.reduce((min, current) =>
        current < min ? current : min, actualCycle[0]);
      const minIndex = actualCycle.indexOf(minElement);

      const normalizedCycle = [
        ...actualCycle.slice(minIndex),
        ...actualCycle.slice(0, minIndex)
      ];

      const signature = normalizedCycle.join(',');

      if (!cycleSignatures.has(signature)) {
        cycleSignatures.add(signature);
        normalizedCycles.push(normalizedCycle);
      }
    }

    return normalizedCycles;
  }

  dfs(startName: string, callback: (vertex: Vertex) => void): void {
    const visited = new Set<string>();
    const dfsRecursive = (vertexName: string) => {
      const vertex = this.nodes.get(vertexName);
      if (!vertex) return;
      visited.add(vertexName);
      callback(vertex);
      for (const edge of vertex.outDegree) {
        if (!visited.has(edge.next.name)) {
          dfsRecursive(edge.next.name);
        }
      }
    };
    dfsRecursive(startName);
  }

  bfs(startName: string, callback: (vertex: Vertex) => void): void {
    const visited = new Set<string>();
    const queue: string[] = [startName];
    visited.add(startName);

    while (queue.length > 0) {
      const vertexName = queue.shift()!;
      const vertex = this.nodes.get(vertexName);
      if (!vertex) continue;
      callback(vertex);
      for (const edge of vertex.outDegree) {
        if (!visited.has(edge.next.name)) {
          visited.add(edge.next.name);
          queue.push(edge.next.name);
        }
      }
    }
  }

  hasPath(from: string, to: string): boolean {
    const visited = new Set<string>();
    const dfsCheck = (current: string): boolean => {
      if (current === to) return true;
      visited.add(current);
      const vertex = this.nodes.get(current);
      if (!vertex) return false;
      for (const edge of vertex.outDegree) {
        if (!visited.has(edge.next.name)) {
          if (dfsCheck(edge.next.name)) return true;
        }
      }
      return false;
    };
    return dfsCheck(from);
  }

  getAllPaths(from: string, to: string): string[][] {
    const paths: string[][] = [];
    const dfsPath = (current: string, path: string[]) => {
      if (current === to) {
        paths.push([...path, current]);
        return;
      }
      const vertex = this.nodes.get(current);
      if (!vertex) return;
      for (const edge of vertex.outDegree) {
        if (!path.includes(edge.next.name)) {
          dfsPath(edge.next.name, [...path, current]);
        }
      }
    };
    dfsPath(from, []);
    return paths;
  }

  transpose(): Graph {
    const transposed = new Graph();
    this.nodes.forEach((vertex, name) => {
      transposed.addVertex(name, vertex.data);
    });
    this.nodes.forEach((vertex) => {
      vertex.outDegree.forEach(edge => {
        transposed.addEdge(edge.next.name, vertex.name, edge.weight);
      });
    });
    return transposed;
  }

  print(): void {
    this.nodes.forEach((vertex, name) => {
      console.log(`${name} -> ${vertex.outDegree.map(e => e.next.name).join(', ')}`);
    });
  }
}

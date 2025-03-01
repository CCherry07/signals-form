export class Vertex {
  name: string;
  inDegree: Vertex[];
  outDegree: Edge[];
  index: number | null;
  lowLink: number | null;
  onStack: boolean;
  data: any; // 可以存储任意附加数据

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

    // Remove all edges pointing to this vertex
    this.nodes.forEach(v => {
      v.outDegree = v.outDegree.filter(e => e.next !== vertex);
      v.inDegree = v.inDegree.filter(v => v !== vertex);
    });

    // Remove the vertex
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

  tarjanSCC(): string[][] {
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

    return result;
  }

  topologicalSort(): string[] {
    const inDegreeMap = new Map<Vertex, number>();
    const queue: Vertex[] = [];
    const sorted: string[] = [];

    // Initialize in-degrees
    this.nodes.forEach(node => {
      inDegreeMap.set(node, node.inDegree.length);
      if (node.inDegree.length === 0) {
        queue.push(node);
      }
    });

    // Kahn's algorithm
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

    if (sorted.length !== this.count) {
      throw new Error("Graph has at least one cycle");
    }

    return sorted;
  }

  // 新增方法：深度优先搜索
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

  // 新增方法：广度优先搜索
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

  // 新增方法：检查是否存在路径
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

  // 新增方法：获取所有路径
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

  // 新增方法：图的转置（反转所有边的方向）
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

  // 新增方法：打印图结构
  print(): void {
    this.nodes.forEach((vertex, name) => {
      console.log(`${name} -> ${vertex.outDegree.map(e => e.next.name).join(', ')}`);
    });
  }
}

// // 使用示例
// const graph = new Graph();

// graph.addEdge("A", "B");
// graph.addEdge("B", "C");
// graph.addEdge("C", "A");
// graph.addEdge("B", "D");
// graph.addEdge("D", "E");
// graph.addEdge("E", "F");
// graph.addEdge("F", "D");

// console.log("Graph structure:");
// graph.print();

// console.log("\nStrongly Connected Components:");
// console.log(graph.tarjanSCC());

// try {
//   console.log("\nTopological Sort:");
//   console.log(graph.topologicalSort());
// } catch (error) {
//   console.error("Topological sort failed:", error.message);
// }

// console.log("\nDFS from 'A':");
// graph.dfs("A", (vertex) => console.log(vertex.name));

// console.log("\nBFS from 'A':");
// graph.bfs("A", (vertex) => console.log(vertex.name));

// console.log("\nPath exists from 'A' to 'F':", graph.hasPath("A", "F"));

// console.log("\nAll paths from 'A' to 'F':");
// console.log(graph.getAllPaths("A", "F"));

// console.log("\nTransposed graph:");
// const transposedGraph = graph.transpose();
// transposedGraph.print();

import { Graph } from '@signals-form/core';
import { describe, beforeEach, it, expect } from 'vitest';

describe('Graph', () => {
  let graph: Graph;
  beforeEach(() => {
    graph = new Graph();
  });
  it('should create a new graph', () => {
    expect(graph).toBeDefined();
  });
  it('should add a vertex to the graph', () => {
    graph.addVertex('A');
    expect(graph.count).toBe(1);
  });
  it('should add an edge to the graph', () => {
    
  })
})

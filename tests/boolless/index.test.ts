import { signal } from "alien-signals"
import { D, Decision, type Node, registerCustomOperator } from "@rxform/core"
import { test, expect } from "vitest"

registerCustomOperator(
  "n_and",
  {
    operator(...bools: boolean[]) {
      return !bools.every(Boolean)
    },
  }
)

registerCustomOperator(
  "n_or",
  {
    operator(...bools: boolean[]) {
      return !bools.some(Boolean)
    },
  }
)

registerCustomOperator(
  "x_or",
  {
    operator(...bools: boolean[]) {
      const trueCount = bools.filter(Boolean).length
      const falseCount = bools.length - trueCount
      return trueCount === falseCount
    },
  }
)

registerCustomOperator(
  "x_n_or",
  {
    operator(...bools: boolean[]) {
      const trueCount = bools.filter(Boolean).length
      const falseCount = bools.length - trueCount
      return trueCount !== falseCount
    },
  }
)


let T = D as typeof D & {
  n_and: (...nodes: (string | Node)[]) => Decision
  n_or: (...nodes: (string | Node)[]) => Decision
  x_or: (...nodes: (string | Node)[]) => Decision
  x_n_or: (...nodes: (string | Node)[]) => Decision
}

const values = signal({
  isA: signal(true),
  isB: signal(false),
  isC: signal(true),
  isD: signal(false),
})

test('AND', () => {
  const node = D.and('isA', 'isC').or('isB')
  expect(node.evaluate(values)).toBe(true)
})

test('OR', () => {
  const node = D.or(D.and('isA', 'isB'), D.and('isB', 'isC'))
  expect(node.evaluate(values)).toBe(false)
})

test('NOT', () => {
  const node = D.and('isA', 'isC').not()
  expect(node.evaluate(values)).toBe(false)
})

test('USE', () => {
  const node = D.use(D.and('isA', 'isC'))
  expect(node.evaluate(values)).toBe(true)
})

test('USE with leaf', () => {
  const node = D.use('isA')
  expect(node.evaluate(values)).toBe(true)
})

test('chain', () => {
  const node = D.and('isA', 'isC').or(D.and('isB', 'isC'))
  expect(node.evaluate(values)).toBe(true)
  expect(node.not().evaluate(values)).toBe(false)
})

test('not string', () => {
  const node = D.not('isA')
  expect(node.evaluate(values)).toBe(false)
  expect(node.not().evaluate(values)).toBe(true)
})

test('custom operator', () => {
  const node = T.n_and('isA', 'isC')
  expect(node.evaluate(values)).toBe(false)
})

test('custom operator string', () => {
  const node = T.n_and('isA', 'isC').not()
  expect(node.evaluate(values)).toBe(true)
})

test('custom n_and and  n_or operator combination', () => {
  const node = T.n_and('isA', 'isC', T.n_or('isA', 'isD'))
  expect(node.evaluate(values)).toBe(true)
})

test('custom operator chain', () => {
  const node = T.n_and('isA', 'isC', "isA").or(D.and('isB', 'isC'))
  expect(node.evaluate(values)).toBe(false)
  expect(node.not().evaluate(values)).toBe(true)
})

test('custom n_and operator chain2', () => {
  // @ts-ignore
  const node = T.and('isA', 'isC').n_and('isB', 'isD')
  expect(node.evaluate(values)).toBe(true)
})

test('custom n_or operator chain3', () => {
  // @ts-ignore
  const node = T.and('isA', 'isB').n_or('isB', 'isD')
  expect(node.evaluate(values)).toBe(true)
  // @ts-ignore
  const node2 = T.and('isA', 'isC').n_or('isB', 'isD')
  expect(node2.evaluate(values)).toBe(false)
})

test('custom n_or and n_and operator chain4', () => {
  // @ts-ignore
  const node = T.and('isA', 'isB').n_or('isB', 'isD').n_and('isA', 'isC')
  expect(node.evaluate(values)).toBe(false)
})

test('custom xor operator', () => {
  // @ts-ignore
  const node = T.x_or('isA', 'isD')
  expect(node.evaluate(values)).toBe(true)
})

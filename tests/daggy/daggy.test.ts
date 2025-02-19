import show from "sanctuary-show"
import type from "sanctuary-type-identifiers"
import { expect, test } from "vitest"
import { tagged, taggedSum } from "@signals-form/core"
const Tuple = tagged('Tuple', ['_1', '_2'])
const List = taggedSum('List', {
  Cons: ['x', 'xs'],
  Nil: []
})
Tuple.prototype.foo = 'foo'
// @ts-ignore
List.prototype.foo = 'foo'

const a = 'a'
const b = 'b'
test("tagged", () => {
  const tpl = Tuple(a, b)
  expect(tpl).toEqual({
    _1: a,
    _2: b,
  })
  expect(tpl.foo).toEqual('foo')
  expect(tpl.toString()).toEqual(`Tuple(${show(a)}, ${show(b)})`)
  expect(Tuple.toString()).toEqual(`Tuple`)
  expect(show(tpl)).toEqual(`Tuple(${show(a)}, ${show(b)})`)
  expect(type(tpl)).toEqual(`Tuple`)
  expect(Tuple.is(tpl)).toEqual(true)
  expect(Tuple.is({})).toEqual(false)
  expect(Tuple.from({ _1: a, _2: b })).toEqual(tpl)
  expect(tpl.constructor).toEqual(Tuple)
  expect(Tuple.prototype.foo).toEqual(tpl.foo)
  expect(Tuple.prototype.isPrototypeOf(tpl)).toEqual(true)
})

test("taggedFrom", () => {
  const tpl = Tuple.from({ _1: a, _2: b })
  expect(tpl).toEqual({
    _1: a,
    _2: b,
  })
  expect(tpl.foo).toEqual('foo')
  expect(tpl.toString()).toEqual(`Tuple(${show(a)}, ${show(b)})`)
  expect(Tuple.toString()).toEqual(`Tuple`)
  expect(show(tpl)).toEqual(`Tuple(${show(a)}, ${show(b)})`)
  expect(type(tpl)).toEqual(`Tuple`)
  expect(Tuple.is(tpl)).toEqual(true)
  expect(Tuple.is({})).toEqual(false)
  expect(Tuple.from({ _1: a, _2: b })).toEqual(tpl)
  expect(tpl.constructor).toEqual(Tuple)
  expect(Tuple.prototype.foo).toEqual(tpl.foo)
  expect(Tuple.prototype.isPrototypeOf(tpl)).toEqual(true)
})

test('tag.is() is pre-bound to the rep', () => {
  expect(Tuple.is(Tuple(a, b))).toEqual(true)
  expect(Tuple.is({})).toEqual(false)
  // @ts-ignore
  expect(Tuple.is(List.nil)).toEqual(false)
})


test("taggedSum", () => {
  const list = List.Cons(a, List.Nil)
  expect(list.foo).toEqual('foo')
  expect(list.toString()).toEqual(`List.Cons(${show(a)}, List.Nil)`)
  expect(List.toString()).toEqual(`List`)

  expect(show(list)).toEqual(`List.Cons(${show(a)}, List.Nil)`)
  expect(show(List)).toEqual(`List`)
  expect(type(list)).toEqual(`List`)
  expect(List.is(list)).toEqual(true)
  expect(List.is({})).toEqual(false)
  expect(list.x).toEqual(a)
  expect(list.xs).toEqual(List.Nil)
  expect(List.Cons.is(list.xs)).toEqual(false)
  expect(List.Cons.is(list)).toEqual(true)
  expect(List.Cons.is({})).toEqual(false)
  expect(list.cata({
    Cons: (x, xs) => [x, xs],
    Nil: () => []
  })).toEqual([list.x,list.xs])
  expect(List.Nil.cata({
    Cons: () => false,
    Nil: () => true
  })).toEqual(true)
  expect(List.prototype.foo).toEqual(list.foo)
  expect(List.prototype.foo).toEqual(List.Nil.foo)
  expect(List.prototype.isPrototypeOf(list)).toEqual(true)
  expect(List.prototype.isPrototypeOf(List.Nil)).toEqual(true)
})

test("taggedSumFrom", () => {
  const list = List.Cons.from({ x: a, xs: List.Nil })
  expect(list.foo).toEqual('foo')
  expect(list.toString()).toEqual(`List.Cons(${show(a)}, List.Nil)`)
  expect(List.toString()).toEqual(`List`)
  expect(show(list)).toEqual(`List.Cons(${show(a)}, List.Nil)`)
  expect(show(List)).toEqual(`List`)
  expect(type(list)).toEqual(`List`)
  expect(List.is(list)).toEqual(true)
  expect(List.is({})).toEqual(false)
  expect(list.x).toEqual(a)
  expect(list.xs).toEqual(List.Nil)
  expect(List.Cons.is(list.xs)).toEqual(false)
  expect(List.Cons.is(list)).toEqual(true)
  expect(List.Cons.is({})).toEqual(false)
  expect(list.cata({
    Cons: (x, xs) => [x, xs],
    Nil: () => []
  })).toEqual([list.x,list.xs])
  expect(List.Nil.cata({
    Cons: () => false,
    Nil: () => true
  })).toEqual(true)
  expect(List.prototype.foo).toEqual(list.foo)
  expect(List.prototype.foo).toEqual(List.Nil.foo)
  expect(List.prototype.isPrototypeOf(list)).toEqual(true)
  expect(List.prototype.isPrototypeOf(List.Nil)).toEqual(true)
})


test('pre-bound .is()',()=>{
  const tpl = Tuple(a, b)
  const isList = List.is
  const isNil = List.Nil.is
  const nilList = List.Nil
  expect(isList(tpl)).toEqual(false)
  expect(isNil(nilList)).toEqual(true)
  expect(isNil(tpl)).toEqual(false)
  expect(isNil(List.Cons(a, List.Nil))).toEqual(false)
})

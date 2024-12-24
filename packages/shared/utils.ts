export function isArray(value: any): value is any[] {
  return Object.prototype.toString.call(value) === "[object Array]";
}
export function isObject(value: any): value is object {
  return Object.prototype.toString.call(value) === "[object Object]";
}
export function isString(value: any): value is string {
  return Object.prototype.toString.call(value) === "[object String]";
}
export function isFunction(value: any): value is Function {
  return Object.prototype.toString.call(value) === "[object Function]";
}
export function isDepsEq(newDeps: any, oldDeps: any): boolean {
  return Object.is(newDeps, oldDeps);
}
export function isPromise(value: any): value is PromiseLike<any> {
  return isFunction(value?.then)
}

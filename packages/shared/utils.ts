export function isArray(value: any): value is any[] {
  return Object.prototype.toString.call(value) === "[object Array]";
}
export function isObject(value: any): value is object {
  return Object.prototype.toString.call(value) === "[object Object]";
}
export function isString(value: any): value is string {
  return Object.prototype.toString.call(value) === "[object String]";
}

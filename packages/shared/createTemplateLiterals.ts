export const createTemplateLiterals = <V>(string: TemplateStringsArray) => {
  return (value: V,) => parseExpression(string, value);
}
export function parseExpression(content: TemplateStringsArray, value: any): any {
  try {
    const fnBody = `
    "use strict";
    return ${content}
    `
    const createFunction = (body: string) => new Function('value', body);
    const executeFunction = (fn: Function, args: any[]) => fn.apply(null, args);
    return executeFunction(createFunction(fnBody), [value]);
  } catch (err) {
    console.error(`Function parse error: ${String(err)}`);
  }
}

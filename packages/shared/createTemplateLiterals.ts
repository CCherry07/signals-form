export const createTemplateLiterals = <S, C>(string: TemplateStringsArray) => {
  return (state: S, context: C) => parseExpression(string, state, context);
}
export function parseExpression(content: TemplateStringsArray, state: any, context: any): any {
  try {
    const contextArr = ['"use strict";', 'return '];
    let code = contextArr.join('\n') + content;
    const createFunction = (code: string) => new Function('$state', '$', code);
    const executeFunction = (fn: Function, args: any[]) => fn.apply(null, args);
    return executeFunction(createFunction(code), [state, context]);
  } catch (err) {
    console.error(`Function parse error: ${String(err)}`);
  }
}


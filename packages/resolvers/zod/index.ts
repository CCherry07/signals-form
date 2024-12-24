import { z, ZodError } from "zod";
import { Resolver } from "./type";
export interface FieldError {
  message: string
  type: string
}

export type FieldErrors = Record<string, FieldError>
const isZodError = (error: any): error is ZodError =>
  Array.isArray(error?.errors);

const parseErrorSchema = (
  zodErrors: z.ZodIssue[],
) => {
  const errors: Record<string, FieldError> = {};
  for (; zodErrors.length;) {
    const error = zodErrors[0];
    const { code, message, path } = error;
    const _path = path.join('.');
    if (!errors[_path]) {
      if ('unionErrors' in error) {
        const unionError = error.unionErrors[0].errors[0];
        errors[_path] = {
          message: unionError.message,
          type: unionError.code,
        };
      } else {
        errors[_path] = { message, type: code };
      }
    }

    if ('unionErrors' in error) {
      error.unionErrors.forEach((unionError) =>
        unionError.errors.forEach((e) => zodErrors.push(e)),
      );
    }
    zodErrors.shift();
  }

  return errors;
};

export const zodResolver: Resolver = (schema, schemaOptions, resolverOptions = {}) =>
  async (values: unknown) => {
    try {
      const data = await schema[
        resolverOptions.mode === 'sync' ? 'parse' : 'parseAsync'
      ](values, schemaOptions);
      return {
        errors: {} as FieldErrors,
        values: resolverOptions.raw ? values : data,
      };
    } catch (error: any) {
      if (isZodError(error)) {
        const errors = parseErrorSchema(error.errors);
        return {
          errors,
          values: {},
        };
      }
      throw error;
    }
  };

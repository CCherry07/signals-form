import { z } from 'zod';

export type FactoryOptions = {
  /**
   * @default async
   */
  mode?: 'async' | 'sync';
  /**
   * Return the raw input values rather than the parsed values.
   * @default false
   */
  raw?: boolean;
}
export type Resolver = <T extends z.Schema<any, any>>(
  schema: T,
  schemaOptions?: Partial<z.ParseParams>,
  factoryOptions?: FactoryOptions,
) => (value: any) => Promise<({
  values: Record<string, any>,
  errors: Record<string, any>
})>

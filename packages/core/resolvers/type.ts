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
export type Resolver = <T>(
  schema: T,
  schemaOptions?: Record<string, any>,
  factoryOptions?: FactoryOptions,
) => (value: any) => Promise<({
  values: Record<string, any>,
  errors: Record<string, any>
})>

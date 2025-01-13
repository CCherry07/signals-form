export const useOrCreateMetaData = (ctx: DecoratorContext, key: string | symbol, defaultValue: any) => ctx.metadata[key] ??= defaultValue;

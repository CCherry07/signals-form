export const useOrCreateMetaData = (ctx: ClassMemberDecoratorContext, key: string | symbol, defaultValue: any) => ctx.metadata[key] ??= defaultValue;

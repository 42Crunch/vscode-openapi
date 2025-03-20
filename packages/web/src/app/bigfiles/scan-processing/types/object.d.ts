declare let global: any;

interface StringMap<T> {
  [key: string]: T;
}

interface NumberMap<T> {
  [key: number]: T;
}

interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}

type PropertyMap<TSource, TResult> = { [TProperty in keyof TSource]: TResult };

type Mapper<TSource, TResult> = (value: TSource) => TResult;

type PropertyMapper<TSource, TResult> = { [TProperty in keyof TSource]?: Mapper<TSource[TProperty], TResult> };

type FieldsOf<T> = (keyof T | string)[];

type FieldOf<T> = keyof T;

type PickKeysOfType<TSource, TType> = Pick<
  TSource,
  { [TProperty in keyof TSource]: TSource[TProperty] extends TType ? TProperty : never }[keyof TSource]
>;

type Writeable<TSource> = { -readonly [TProperty in keyof TSource]: TSource[TProperty] };

type DeepWriteable<TSource> = { -readonly [TProperty in keyof TSource]: DeepWriteable<TSource[TProperty]> };

interface Disposable {
  dispose(): void;
}

interface Extension extends Disposable {
  register(): void;
}

interface ObjectLiteral {
  [key: string]: any;
}

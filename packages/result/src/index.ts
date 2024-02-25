export type Result<V, E> = [NonNullable<V>, undefined] | [undefined, NonNullable<E>];
export type NullableResult<V, E> = [V, undefined] | [undefined, NonNullable<E>];

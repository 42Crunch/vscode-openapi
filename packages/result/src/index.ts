export type Result<V, E> = [NonNullable<V>, undefined] | [undefined, NonNullable<E>];
export type NullableResult<V, E> = [V, undefined] | [undefined, NonNullable<E>];

export function isSuccess<V, E>(result: NullableResult<V, E> | Result<V, E>) {
  return result[1] === undefined;
}

export function isFailure<V, E>(result: NullableResult<V, E> | Result<V, E>) {
  return result[0] === undefined;
}

export function success<V extends NonNullable<unknown>>(value: V): Result<V, undefined> {
  return [value, undefined];
}

export function failure<E extends NonNullable<unknown>>(error: E): Result<undefined, E> {
  return [undefined, error];
}

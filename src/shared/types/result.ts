/**
 * Result type for explicit error handling
 * A discriminated union representing either a successful value or an error
 */

/**
 * Represents a successful result containing a value
 */
export class Success<T> {
  readonly value: T;
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Transform the success value using the provided function
   */
  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  /**
   * Chain another Result-returning operation
   */
  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Return the success value, ignoring the default
   */
  getOrElse(_defaultValue: T): T {
    return this.value;
  }
}

/**
 * Represents a failed result containing an error
 */
export class Failure<E> {
  readonly error: E;
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(error: E) {
    this.error = error;
  }

  /**
   * Return the same Failure unchanged (map has no effect on failures)
   */
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  /**
   * Return the same Failure unchanged (flatMap has no effect on failures)
   */
  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  /**
   * Return the default value since this is a failure
   */
  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }
}

/**
 * Result type - a discriminated union of Success and Failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Factory function to create a Success result
 */
export function success<T>(value: T): Success<T>;
export function success(): Success<void>;
export function success<T>(value?: T): Success<T | void> {
  return new Success(value as T | void);
}

/**
 * Factory function to create a Failure result
 */
export const failure = <E>(error: E): Failure<E> => new Failure(error);

/**
 * ValidationError
 * Thrown when domain validation fails for value objects or entities
 */
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly constraint: string
  ) {
    super(
      `Validation failed for ${field}: ${constraint}. Received: ${JSON.stringify(value)}`
    );
    this.name = "ValidationError";
  }
}

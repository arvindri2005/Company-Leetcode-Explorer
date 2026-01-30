import { ValidationError } from "../errors/validation.error";

/**
 * Valid problem statuses
 */
const VALID_STATUSES = ["pending", "approved", "rejected", "archived"] as const;
type ProblemStatusValue = (typeof VALID_STATUSES)[number];

/**
 * ProblemStatus Value Object
 * Represents the status of a problem with validation
 */
export class ProblemStatus {
  private readonly value: ProblemStatusValue;

  private constructor(value: ProblemStatusValue) {
    this.value = value;
  }

  /**
   * Creates a new ProblemStatus value object
   * @throws ValidationError if the value is not a valid status
   */
  public static create(value: string): ProblemStatus {
    const normalized = value.toLowerCase() as ProblemStatusValue;
    if (!VALID_STATUSES.includes(normalized)) {
      throw new ValidationError(
        "problemStatus",
        value,
        `Must be one of: ${VALID_STATUSES.join(", ")}`
      );
    }
    return new ProblemStatus(normalized);
  }

  /**
   * Returns the status value
   */
  public getValue(): ProblemStatusValue {
    return this.value;
  }

  /**
   * Checks equality with another ProblemStatus value object
   */
  public equals(other: ProblemStatus): boolean {
    return this.value === other.value;
  }

  /**
   * Checks if the problem is in a pending state
   */
  public isPending(): boolean {
    return this.value === "pending";
  }

  /**
   * Checks if the problem is approved
   */
  public isApproved(): boolean {
    return this.value === "approved";
  }

  /**
   * Checks if the problem is rejected
   */
  public isRejected(): boolean {
    return this.value === "rejected";
  }

  /**
   * Checks if the problem is archived
   */
  public isArchived(): boolean {
    return this.value === "archived";
  }
}

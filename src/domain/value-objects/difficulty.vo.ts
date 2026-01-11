import { ValidationError } from "../errors/validation.error";

/**
 * Valid difficulty levels for problems
 */
const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
type DifficultyLevel = (typeof VALID_DIFFICULTIES)[number];

/**
 * Difficulty Value Object
 * Represents the difficulty level of a problem with validation
 */
export class Difficulty {
  private readonly value: DifficultyLevel;

  private constructor(value: DifficultyLevel) {
    this.value = value;
  }

  /**
   * Creates a new Difficulty value object
   * @throws ValidationError if the value is not a valid difficulty level
   */
  public static create(value: string): Difficulty {
    const normalized = value.toLowerCase() as DifficultyLevel;
    if (!VALID_DIFFICULTIES.includes(normalized)) {
      throw new ValidationError(
        "difficulty",
        value,
        `Must be one of: ${VALID_DIFFICULTIES.join(", ")}`
      );
    }
    return new Difficulty(normalized);
  }

  /**
   * Returns the difficulty level value
   */
  public getValue(): DifficultyLevel {
    return this.value;
  }

  /**
   * Checks equality with another Difficulty value object
   */
  public equals(other: Difficulty): boolean {
    return this.value === other.value;
  }

  /**
   * Compares if this difficulty is harder than another
   */
  public isHarderThan(other: Difficulty): boolean {
    const order: Record<DifficultyLevel, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };
    return order[this.value] > order[other.value];
  }
}

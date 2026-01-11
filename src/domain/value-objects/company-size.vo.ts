import { ValidationError } from "../errors/validation.error";

/**
 * Valid company sizes
 */
const VALID_SIZES = ["startup", "small", "medium", "large", "enterprise"] as const;
type CompanySizeValue = (typeof VALID_SIZES)[number];

/**
 * CompanySize Value Object
 * Represents the size category of a company with validation
 */
export class CompanySize {
  private readonly value: CompanySizeValue;

  private constructor(value: CompanySizeValue) {
    this.value = value;
  }

  /**
   * Creates a new CompanySize value object
   * @throws ValidationError if the value is not a valid company size
   */
  public static create(value: string): CompanySize {
    const normalized = value.toLowerCase() as CompanySizeValue;
    if (!VALID_SIZES.includes(normalized)) {
      throw new ValidationError(
        "companySize",
        value,
        `Must be one of: ${VALID_SIZES.join(", ")}`
      );
    }
    return new CompanySize(normalized);
  }

  /**
   * Returns the company size value
   */
  public getValue(): CompanySizeValue {
    return this.value;
  }

  /**
   * Checks equality with another CompanySize value object
   */
  public equals(other: CompanySize): boolean {
    return this.value === other.value;
  }

  /**
   * Checks if this company is larger than another
   */
  public isLargerThan(other: CompanySize): boolean {
    const order: Record<CompanySizeValue, number> = {
      startup: 1,
      small: 2,
      medium: 3,
      large: 4,
      enterprise: 5,
    };
    return order[this.value] > order[other.value];
  }

  /**
   * Checks if the company is a startup
   */
  public isStartup(): boolean {
    return this.value === "startup";
  }

  /**
   * Checks if the company is enterprise-level
   */
  public isEnterprise(): boolean {
    return this.value === "enterprise";
  }
}

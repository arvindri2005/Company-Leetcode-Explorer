import { type CompanySize } from "../value-objects/company-size.vo";

import { Entity } from "./base.entity";

/**
 * Properties for the Company entity
 */
interface CompanyProps {
  name: string;
  slug: string;
  size: CompanySize;
  industry: string;
  description: string;
  website?: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new Company entity
 */
type CreateCompanyInput = Omit<CompanyProps, "createdAt" | "updatedAt">;

/**
 * Company Entity
 * Represents a company in the domain layer
 */
export class Company extends Entity<CompanyProps> {
  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get size(): CompanySize {
    return this.props.size;
  }

  get industry(): string {
    return this.props.industry;
  }

  get description(): string {
    return this.props.description;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates the company name
   */
  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the company description
   */
  public updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the company size
   */
  public updateSize(size: CompanySize): void {
    this.props.size = size;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the company website
   */
  public updateWebsite(website: string): void {
    this.props.website = website;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the company logo URL
   */
  public updateLogoUrl(logoUrl: string): void {
    this.props.logoUrl = logoUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Factory method to create a new Company entity
   */
  public static create(props: CreateCompanyInput, id?: string): Company {
    const now = new Date();
    return new Company(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}

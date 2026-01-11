import { type Difficulty } from "../value-objects/difficulty.vo";
import { type ProblemStatus } from "../value-objects/problem-status.vo";

import { Entity } from "./base.entity";

/**
 * Properties for the Problem entity
 */
interface ProblemProps {
  title: string;
  description: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  companyId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new Problem entity
 */
type CreateProblemInput = Omit<ProblemProps, "createdAt" | "updatedAt">;

/**
 * Problem Entity
 * Represents a coding problem in the domain layer
 */
export class Problem extends Entity<ProblemProps> {
  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get difficulty(): Difficulty {
    return this.props.difficulty;
  }

  get status(): ProblemStatus {
    return this.props.status;
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates the problem status
   */
  public updateStatus(status: ProblemStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the problem title
   */
  public updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the problem description
   */
  public updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Adds a tag to the problem
   */
  public addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag from the problem
   */
  public removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Factory method to create a new Problem entity
   */
  public static create(props: CreateProblemInput, id?: string): Problem {
    const now = new Date();
    return new Problem(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}

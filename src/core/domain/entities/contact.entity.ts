import { Entity } from "./base.entity";

/**
 * Contact submission status
 */
type ContactStatus = "pending" | "read" | "replied" | "archived";

/**
 * Properties for the Contact entity
 */
interface ContactProps {
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new Contact entity
 */
type CreateContactInput = Pick<ContactProps, "name" | "email" | "message">;

/**
 * Contact Entity
 * Represents a contact form submission in the domain layer
 */
export class Contact extends Entity<ContactProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get message(): string {
    return this.props.message;
  }

  get status(): ContactStatus {
    return this.props.status;
  }

  get repliedAt(): Date | undefined {
    return this.props.repliedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Marks the contact as read
   */
  public markAsRead(): void {
    if (this.props.status === "pending") {
      this.props.status = "read";
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Marks the contact as replied
   */
  public markAsReplied(): void {
    this.props.status = "replied";
    this.props.repliedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Archives the contact
   */
  public archive(): void {
    this.props.status = "archived";
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if the contact is pending
   */
  public isPending(): boolean {
    return this.props.status === "pending";
  }

  /**
   * Checks if the contact has been replied to
   */
  public isReplied(): boolean {
    return this.props.status === "replied";
  }

  /**
   * Factory method to create a new Contact entity
   */
  public static create(props: CreateContactInput, id?: string): Contact {
    const now = new Date();
    return new Contact(
      {
        ...props,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}

import { Entity } from "./base.entity";

/**
 * User preferences for the application
 */
interface UserPreferences {
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  weeklyDigest?: boolean;
}

/**
 * Properties for the User entity
 */
interface UserProps {
  email: string | null;
  displayName: string | null;
  photoUrl?: string;
  preferences: UserPreferences;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new User entity
 */
type CreateUserInput = Omit<UserProps, "createdAt" | "updatedAt" | "preferences"> & {
  preferences?: UserPreferences;
};

/**
 * User Entity
 * Represents a user in the domain layer
 */
export class User extends Entity<UserProps> {
  get email(): string | null {
    return this.props.email;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }

  get preferences(): UserPreferences {
    return { ...this.props.preferences };
  }

  get lastSyncedAt(): Date | undefined {
    return this.props.lastSyncedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates the user's display name
   */
  public updateDisplayName(displayName: string | null): void {
    this.props.displayName = displayName;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's email
   */
  public updateEmail(email: string | null): void {
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's photo URL
   */
  public updatePhotoUrl(photoUrl: string): void {
    this.props.photoUrl = photoUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates user preferences
   */
  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.props.preferences = {
      ...this.props.preferences,
      ...preferences,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Marks the user as synced
   */
  public markSynced(): void {
    this.props.lastSyncedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Factory method to create a new User entity
   */
  public static create(props: CreateUserInput, id?: string): User {
    const now = new Date();
    return new User(
      {
        ...props,
        preferences: props.preferences ?? {},
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}

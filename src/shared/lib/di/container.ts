/**
 * Dependency Injection Container
 *
 * A lightweight DI container that supports:
 * - Singleton and transient service registrations
 * - Type-safe service resolution using TypeScript generics
 * - Mock overrides for testing
 */

type Factory<T> = () => T;

interface Registration<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

interface RegisterOptions {
  singleton?: boolean;
}

class Container {
  private registrations = new Map<symbol, Registration<unknown>>();

  /**
   * Register a service factory with the container
   * @param token - Unique symbol identifying the service
   * @param factory - Factory function that creates the service instance
   * @param options - Registration options (singleton: boolean)
   */
  register<T>(
    token: symbol,
    factory: Factory<T>,
    options?: RegisterOptions
  ): void {
    this.registrations.set(token, {
      factory,
      singleton: options?.singleton ?? false,
    });
  }

  /**
   * Resolve a service from the container
   * @param token - Unique symbol identifying the service
   * @returns The service instance
   * @throws Error if no registration found for token
   */
  resolve<T>(token: symbol): T {
    const registration = this.registrations.get(token) as
      | Registration<T>
      | undefined;

    if (!registration) {
      throw new Error(
        `No registration found for token: ${token.toString()}`
      );
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance;
    }

    return registration.factory();
  }

  /**
   * Override an existing registration (useful for testing with mocks)
   * @param token - Unique symbol identifying the service
   * @param factory - New factory function to use
   * @throws Error if no existing registration found for token
   */
  override<T>(token: symbol, factory: Factory<T>): void {
    const existing = this.registrations.get(token);

    if (!existing) {
      throw new Error(
        `Cannot override non-existent registration: ${token.toString()}`
      );
    }

    this.registrations.set(token, {
      ...existing,
      factory,
      instance: undefined, // Clear cached singleton instance
    });
  }

  /**
   * Check if a service is registered
   * @param token - Unique symbol identifying the service
   * @returns true if the service is registered
   */
  has(token: symbol): boolean {
    return this.registrations.has(token);
  }

  /**
   * Reset the container, clearing all registrations
   */
  reset(): void {
    this.registrations.clear();
  }
}

// Export singleton container instance
export const container = new Container();

// Export Container class for testing purposes
export { Container };
export type { Factory, RegisterOptions };

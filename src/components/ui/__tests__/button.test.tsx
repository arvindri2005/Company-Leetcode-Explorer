import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from '../button';
import { Slot } from '@radix-ui/react-slot';

// Mock the Slot component from radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, className }: { children: React.ReactNode, className?: string }) => {
    // In a real scenario, Slot would merge its className with the child's className.
    // For testing, we'll apply it directly to a div that wraps the children.
    return <div data-testid="slot-mock" className={className}>{children}</div>;
  },
}));

describe('Button', () => {
  it('renders the button with default variant and size', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(buttonVariants({ variant: 'default', size: 'default' }));
  });

  it('renders the button with a custom variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(buttonVariants({ variant: 'destructive' }));
  });

  it('renders the button with a custom size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button', { name: 'Small' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(buttonVariants({ size: 'sm' }));
  });

  it('merges custom class names', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass(buttonVariants({ variant: 'default', size: 'default' }));
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const slotMock = screen.getByTestId('slot-mock');
    expect(slotMock).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
    expect(slotMock).toHaveClass(buttonVariants({ variant: 'default', size: 'default' }));
  });

  it('forwards the ref to the underlying element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInTheDocument();
    expect(ref.current).toHaveTextContent('Ref Button');
  });

  // Test all variants
  it.each([
    ['default'],
    ['destructive'],
    ['outline'],
    ['secondary'],
    ['ghost'],
    ['link'],
  ] as const)('renders with %s variant', (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole('button', { name: variant })).toHaveClass(buttonVariants({ variant }));
  });

  // Test all sizes
  it.each([
    ['default'],
    ['sm'],
    ['lg'],
    ['icon'],
  ] as const)('renders with %s size', (size) => {
    render(<Button size={size}>{size}</Button>);
    expect(screen.getByRole('button', { name: size })).toHaveClass(buttonVariants({ size }));
  });
});

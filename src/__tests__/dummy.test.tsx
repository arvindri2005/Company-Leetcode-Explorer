import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

function DummyComponent() {
  return <div>Hello, Test!</div>;
}

describe('DummyComponent', () => {
  it('renders the text', () => {
    render(<DummyComponent />);
    expect(screen.getByText('Hello, Test!')).toBeInTheDocument();
  });
});

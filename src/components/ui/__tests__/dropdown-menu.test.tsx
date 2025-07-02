import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '../dropdown-menu';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
}));

// Mock @radix-ui/react-dropdown-menu to simplify testing of our wrapper components
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div data-testid="dropdown-content" {...props}>{children}</div>,
  Item: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div {...props}>{children}</div>,
  CheckboxItem: ({ children, checked, ...props }: { children: React.ReactNode, checked?: boolean, [key: string]: any }) => (
    <div data-checked={checked} {...props}>
      {children}
      {checked && <svg data-testid="checkbox-checked-icon" />}
    </div>
  ),
  RadioItem: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div {...props}>{children}</div>,
  ItemIndicator: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Label: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div {...props}>{children}</div>,
  Separator: () => <hr data-testid="separator" />,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SubTrigger: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <button {...props}>{children}</button>,
  SubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));


describe('DropdownMenu Components', () => {
  it('renders DropdownMenuTrigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('renders DropdownMenuContent', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>Content</DropdownMenuContent>
      </DropdownMenu>
    );
    // Since we mocked Radix UI, the content will be immediately in the document
    expect(screen.getByTestId('dropdown-content')).toHaveTextContent('Content');
  });

  it('renders DropdownMenuItem and handles click', () => {
    const handleClick = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleClick}>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    fireEvent.click(screen.getByText('Item 1'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders DropdownMenuItem with inset', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Item 2')).toHaveClass('pl-8');
  });

  it('renders DropdownMenuCheckboxItem and shows checkmark when checked', () => {
    render(
      <DropdownMenuCheckboxItem checked>Checkbox Item</DropdownMenuCheckboxItem>
    );
    expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-checked-icon')).toBeInTheDocument();
  });

  it('renders DropdownMenuCheckboxItem without checkmark when not checked', () => {
    render(
      <DropdownMenuCheckboxItem>Checkbox Item</DropdownMenuCheckboxItem>
    );
    expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
    expect(screen.queryByTestId('checkbox-checked-icon')).not.toBeInTheDocument();
  });

  it('renders DropdownMenuRadioItem', () => {
    render(
      <DropdownMenuRadioItem value="test">Radio Item</DropdownMenuRadioItem>
    );
    expect(screen.getByText('Radio Item')).toBeInTheDocument();
  });

  it('renders DropdownMenuLabel with inset', () => {
    render(<DropdownMenuLabel inset>Label</DropdownMenuLabel>);
    expect(screen.getByText('Label')).toHaveClass('pl-8');
  });

  it('renders DropdownMenuSeparator', () => {
    render(<DropdownMenuSeparator />);
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('renders DropdownMenuShortcut', () => {
    render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toHaveClass('ml-auto');
  });

  it('renders DropdownMenuSubTrigger with inset', () => {
    render(
      <DropdownMenuSubTrigger inset>Sub Trigger</DropdownMenuSubTrigger>
    );
    expect(screen.getByText('Sub Trigger')).toHaveClass('pl-8');
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('renders DropdownMenuSubContent', () => {
    render(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>Sub Content</DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    expect(screen.getByText('Sub Content')).toBeInTheDocument();
  });

  it('renders DropdownMenuGroup', () => {
    render(
      <DropdownMenuGroup><div>Group Content</div></DropdownMenuGroup>
    );
    expect(screen.getByText('Group Content')).toBeInTheDocument();
  });

  it('renders DropdownMenuRadioGroup', () => {
    render(
      <DropdownMenuRadioGroup value="test"><div>Radio Group Content</div></DropdownMenuRadioGroup>
    );
    expect(screen.getByText('Radio Group Content')).toBeInTheDocument();
  });
});

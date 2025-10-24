import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanySearchBar from '../company-search-bar';

describe('CompanySearchBar', () => {
  const mockSetSearchTermInput = jest.fn();
  const mockSetShowSuggestions = jest.fn();
  const mockHandleSuggestionClick = jest.fn();
  const mockOnSearch = jest.fn();
  const suggestionsRef = { current: null };

  const defaultProps = {
    searchTermInput: '',
    setSearchTermInput: mockSetSearchTermInput,
    isLoadingSuggestions: false,
    suggestions: [],
    showSuggestions: false,
    setShowSuggestions: mockSetShowSuggestions,
    handleSuggestionClick: mockHandleSuggestionClick,
    suggestionsRef: suggestionsRef,
    onSearch: mockOnSearch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSearch when Enter key is pressed', async () => {
    render(<CompanySearchBar {...defaultProps} />);
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'test');
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('shows suggestions on input focus', () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="test" suggestions={[{ id: '1', name: 'Test Company', slug: 'test-company' }]} />);
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    expect(mockSetShowSuggestions).toHaveBeenCalledWith(true);
  });

  it('displays "No companies found" message when there are no suggestions', () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="test" showSuggestions={true} />);
    expect(screen.getByText('No companies found matching "test".')).toBeInTheDocument();
  });
});

// Mock Next.js navigation hooks - MUST BE AT THE TOP
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/companies',
  useSearchParams: () => mockSearchParams,
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyList from '../company-list';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchCompanySuggestionsAction } from '@/app/actions';

// Mock hooks and actions
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn((value) => value),
}));
jest.mock('@/app/actions', () => ({
  fetchCompanySuggestionsAction: jest.fn(),
}));

// Mock child components
jest.mock('../company-card', () => {
  const MockCompanyCard = ({ company }: { company: any }) => (
    <div data-testid="company-card">{company.name}</div>
  );
  MockCompanyCard.displayName = 'CompanyCard';
  return MockCompanyCard;
});
jest.mock('@/components/ui/input', () => ({
  Input: jest.fn(({ onChange, value, ...props }) => (
    <input data-testid="search-input" onChange={onChange} value={value} {...props} />
  )),
}));
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  Building2: () => <svg data-testid="building-icon" />,
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

const mockCompanies = [
  { id: '1', name: 'Company A', slug: 'company-a', logo: '/logo-a.png', problemCount: 10 },
  { id: '2', name: 'Company B', slug: 'company-b', logo: '/logo-b.png', problemCount: 5 },
  { id: '3', name: 'Company C', slug: 'company-c', logo: '/logo-c.png', problemCount: 12 },
];

describe('CompanyList', () => {
  let mockIntersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void;
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  beforeAll(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn((callback, options) => {
      mockIntersectionObserverCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [0],
      };
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue([]);
    
    // Mock fetch API for pagination
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ companies: [], hasMore: false, nextCursor: null }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial companies correctly', () => {
    render(
      <CompanyList
        initialCompanies={mockCompanies.slice(0, 2)}
        initialHasMore={true}
        initialNextCursor="cursor1"
        itemsPerPage={2}
      />
    );
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    expect(screen.queryByText('Company C')).not.toBeInTheDocument();
  });

  it('displays "No companies available." when initialCompanies is empty and no search term', () => {
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    expect(screen.getByText('No companies available.')).toBeInTheDocument();
  });

  it('displays "No companies found matching your search." when initialCompanies is empty with a search term', () => {
    render(
      <CompanyList
        initialCompanies={[]}
        initialSearchTerm="NonExistent"
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    expect(screen.getByText('No companies found matching your search.')).toBeInTheDocument();
  });

  it('updates search term input and debounces correctly', async () => {
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'test');
    
    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });

    expect(searchInput).toHaveValue('test');
    expect(mockPush).toHaveBeenCalledWith('/companies?search=test', { scroll: false });
  });

  it('fetches and displays suggestions when typing', async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue([
      { id: 's1', name: 'Suggested Company', slug: 'suggested-company', logo: '/suggested.png' },
    ]);
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Sug');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(fetchCompanySuggestionsAction).toHaveBeenCalledWith('Sug');
      expect(screen.getByText('Suggested Company')).toBeInTheDocument();
    });
  });

  it('navigates to company page on suggestion click', async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue([
      { id: 's1', name: 'Suggested Company', slug: 'suggested-company', logo: '/suggested.png' },
    ]);
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Sug');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Suggested Company')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByText('Suggested Company'));
    expect(mockPush).toHaveBeenCalledWith('/company/suggested-company');
  });

  it('loads more companies on intersection', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        companies: [{ id: '4', name: 'Company D', slug: 'company-d', problemCount: 8 }],
        hasMore: false,
        nextCursor: 'newCursor',
      }),
    });

    render(
      <CompanyList
        initialCompanies={mockCompanies.slice(0, 1)}
        initialHasMore={true}
        initialNextCursor="initialCursor"
        itemsPerPage={1}
      />
    );

    act(() => {
      mockIntersectionObserverCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/companies', expect.any(Object));
      expect(screen.getByText('Company D')).toBeInTheDocument();
      expect(screen.getByText("You've reached the end!")).toBeInTheDocument();
    });
  });

  it('displays loading indicator when loading more', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ companies: [], hasMore: false }),
          }), 100
        )
      )
    );

    render(
      <CompanyList
        initialCompanies={mockCompanies.slice(0, 1)}
        initialHasMore={true}
        initialNextCursor="initialCursor"
        itemsPerPage={1}
      />
    );

    act(() => {
      mockIntersectionObserverCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Loading more companies/i)).toBeInTheDocument();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading more companies/i)).not.toBeInTheDocument();
    });
  });

  it('hides suggestions when clicking outside', async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue([
      { id: 's1', name: 'Suggested Company', slug: 'suggested-company', logo: '/suggested.png' },
    ]);
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Sug');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Suggested Company')).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Suggested Company')).not.toBeInTheDocument();
    });
  });

  it('handles fetch error when loading more companies', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <CompanyList
        initialCompanies={mockCompanies.slice(0, 1)}
        initialHasMore={true}
        initialNextCursor="initialCursor"
        itemsPerPage={1}
      />
    );

    act(() => {
      mockIntersectionObserverCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading more companies/i)).not.toBeInTheDocument();
    });
  });

  it('handles fetch error when fetching suggestions', async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockRejectedValueOnce(new Error('Suggestion error'));
    render(
      <CompanyList
        initialCompanies={[]}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={9}
      />
    );
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Sug');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.queryByText('Suggested Company')).not.toBeInTheDocument();
    });
  });
});
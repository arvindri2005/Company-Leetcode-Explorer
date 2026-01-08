import { render, screen } from '@testing-library/react';
import CompanyPreparationGuide from '@/features/companies/components/company-preparation-guide';

// Mock Accordion to avoid Radix UI complexity in tests
jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

describe('CompanyPreparationGuide', () => {
  const mockCompany = {
    id: '1',
    slug: 'test-company',
    name: 'Test Company',
    logo: 'logo.png',
    problemCount: 10,
    website: 'https://example.com',
    description: 'A test company description.',
    commonTags: [],
    relatedCompanies: [],
  };

  it('should render all sections', () => {
    render(<CompanyPreparationGuide company={mockCompany} />);

    expect(screen.getByText('About Test Company')).toBeInTheDocument();
    expect(screen.getByText('Test Company Interview Process')).toBeInTheDocument();
    expect(screen.getByText('How to Prepare for Test Company')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('should render company description', () => {
    render(<CompanyPreparationGuide company={mockCompany} />);
    expect(screen.getByText('A test company description.')).toBeInTheDocument();
  });

  it('should render interview process steps', () => {
    render(<CompanyPreparationGuide company={mockCompany} />);
    expect(screen.getByText('1. Recruiter Screen')).toBeInTheDocument();
    expect(screen.getByText('2. Technical Screen')).toBeInTheDocument();
    expect(screen.getByText('3. Onsite Loop')).toBeInTheDocument();
  });

  it('should render FAQ items', () => {
    render(<CompanyPreparationGuide company={mockCompany} />);
    expect(screen.getByText('What programming languages can I use?')).toBeInTheDocument();
    expect(screen.getByText('How hard are the interview questions?')).toBeInTheDocument();
  });
});

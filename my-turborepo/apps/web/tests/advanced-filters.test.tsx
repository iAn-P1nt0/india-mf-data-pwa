import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedFilters from '@/components/funds/AdvancedFilters';
import { ToastProvider } from '@/app/contexts/ToastContext';

const SAMPLE_CATEGORIES = ['ELSS', 'Equity', 'Debt', 'Balanced', 'Liquid'];

describe('AdvancedFilters Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter toggle button when closed', () => {
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={false}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Advanced Filters/)).toBeInTheDocument();
  });

  it('renders full filter form when open', () => {
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('AUM Range (₹ Cr)')).toBeInTheDocument();
    expect(screen.getByText('Expense Ratio (%)')).toBeInTheDocument();
  });

  it('renders all available categories as checkboxes', () => {
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    SAMPLE_CATEGORIES.forEach((category) => {
      expect(screen.getByLabelText(category)).toBeInTheDocument();
    });
  });

  it('selects and deselects categories', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    const elssCheckbox = screen.getByLabelText('ELSS') as HTMLInputElement;
    expect(elssCheckbox.checked).toBe(false);

    await user.click(elssCheckbox);
    expect(elssCheckbox.checked).toBe(true);

    await user.click(elssCheckbox);
    expect(elssCheckbox.checked).toBe(false);
  });

  it('applies filters with selected categories', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    await user.click(screen.getByLabelText('ELSS'));
    await user.click(screen.getByLabelText('Equity'));
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(handleFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.arrayContaining(['ELSS', 'Equity'])
      })
    );
  });

  it('applies filters with AUM range', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    const minAUMInput = screen.getByPlaceholderText('Min AUM');
    const maxAUMInput = screen.getByPlaceholderText('Max AUM');

    await user.type(minAUMInput, '100');
    await user.type(maxAUMInput, '1000');
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(handleFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minAUM: 100,
        maxAUM: 1000
      })
    );
  });

  it('applies filters with expense ratio range', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    const minERInput = screen.getByPlaceholderText('Min ER');
    const maxERInput = screen.getByPlaceholderText('Max ER');

    await user.type(minERInput, '0.5');
    await user.type(maxERInput, '1.5');
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(handleFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minExpenseRatio: 0.5,
        maxExpenseRatio: 1.5
      })
    );
  });

  it('validates AUM range', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    const minAUMInput = screen.getByPlaceholderText('Min AUM');
    const maxAUMInput = screen.getByPlaceholderText('Max AUM');

    await user.type(minAUMInput, '1000');
    await user.type(maxAUMInput, '100');
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(handleFiltersChange).not.toHaveBeenCalled();
  });

  it('validates expense ratio range', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    const minERInput = screen.getByPlaceholderText('Min ER');
    const maxERInput = screen.getByPlaceholderText('Max ER');

    await user.type(minERInput, '1.5');
    await user.type(maxERInput, '0.5');
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(handleFiltersChange).not.toHaveBeenCalled();
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    const handleFiltersChange = vi.fn();

    render(
      <ToastProvider>
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          availableCategories={SAMPLE_CATEGORIES}
          isOpen={true}
          onToggle={() => {}}
        />
      </ToastProvider>
    );

    await user.click(screen.getByLabelText('ELSS'));
    await user.type(screen.getByPlaceholderText('Min AUM'), '100');
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    const elssCheckbox = screen.getByLabelText('ELSS') as HTMLInputElement;
    expect(elssCheckbox.checked).toBe(false);
    expect((screen.getByPlaceholderText('Min AUM') as HTMLInputElement).value).toBe('');

    expect(handleFiltersChange).toHaveBeenCalledWith({
      categories: []
    });
  });
});

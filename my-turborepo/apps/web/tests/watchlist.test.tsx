import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WatchlistProvider, useWatchlist } from '@/app/contexts/WatchlistContext';
import WatchlistButton from '@/components/funds/WatchlistButton';
import WatchlistDrawer from '@/components/funds/WatchlistDrawer';
import { ToastProvider } from '@/app/contexts/ToastContext';

// Mock IndexedDB
vi.mock('@/lib/db', () => {
  const items = new Map();

  return {
    db: {
      watchlist: {
        toArray: () => Promise.resolve(Array.from(items.values())),
        add: (item) => {
          const id = Math.random();
          items.set(id, { ...item, id });
          return Promise.resolve(id);
        },
        delete: (id) => {
          items.delete(id);
          return Promise.resolve(1);
        },
        clear: () => {
          items.clear();
          return Promise.resolve(undefined);
        }
      }
    }
  };
});

function TestComponent() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  return (
    <div>
      <p>Watchlist count: {watchlist.length}</p>
      <button
        onClick={() =>
          addToWatchlist({
            schemeCode: '119551',
            schemeName: 'Test Fund',
            fundHouse: 'Test House',
            schemeCategory: 'ELSS'
          })
        }
      >
        Add Fund
      </button>
      <button onClick={() => removeFromWatchlist('119551')}>Remove Fund</button>
      {watchlist.map((item) => (
        <div key={item.schemeCode}>
          <p>{item.schemeName}</p>
        </div>
      ))}
    </div>
  );
}

describe('Watchlist Context and Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when useWatchlist is used outside provider', () => {
    function InvalidComponent() {
      useWatchlist();
      return null;
    }

    expect(() => {
      render(<InvalidComponent />);
    }).toThrow('useWatchlist must be used within a WatchlistProvider');
  });

  it('adds fund to watchlist', async () => {
    const user = userEvent.setup();

    render(
      <WatchlistProvider>
        <TestComponent />
      </WatchlistProvider>
    );

    expect(screen.getByText('Watchlist count: 0')).toBeInTheDocument();

    await user.click(screen.getByText('Add Fund'));

    await waitFor(() => {
      expect(screen.getByText('Watchlist count: 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Fund')).toBeInTheDocument();
  });

  it('removes fund from watchlist', async () => {
    const user = userEvent.setup();

    render(
      <WatchlistProvider>
        <TestComponent />
      </WatchlistProvider>
    );

    await user.click(screen.getByText('Add Fund'));

    await waitFor(() => {
      expect(screen.getByText('Test Fund')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Remove Fund'));

    await waitFor(() => {
      expect(screen.queryByText('Test Fund')).not.toBeInTheDocument();
    });
  });

  it('renders WatchlistButton with add state', () => {
    render(
      <WatchlistProvider>
        <ToastProvider>
          <WatchlistButton
            schemeCode="119551"
            schemeName="Test Fund"
            fundHouse="Test House"
            schemeCategory="ELSS"
          />
        </ToastProvider>
      </WatchlistProvider>
    );

    const button = screen.getByRole('button', { name: /add to watchlist/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('☆');
  });

  it('toggles watchlist on button click', async () => {
    const user = userEvent.setup();

    render(
      <WatchlistProvider>
        <ToastProvider>
          <WatchlistButton
            schemeCode="119551"
            schemeName="Test Fund"
            fundHouse="Test House"
            schemeCategory="ELSS"
          />
        </ToastProvider>
      </WatchlistProvider>
    );

    const button = screen.getByRole('button', { name: /add to watchlist/i });

    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('★');
      expect(button).toHaveTextContent('In Watchlist');
    });
  });

  it('renders WatchlistDrawer when open', () => {
    const { rerender } = render(
      <WatchlistProvider>
        <WatchlistDrawer isOpen={false} onClose={() => {}} />
      </WatchlistProvider>
    );

    expect(screen.queryByText('Watchlist')).not.toBeInTheDocument();

    rerender(
      <WatchlistProvider>
        <WatchlistDrawer isOpen={true} onClose={() => {}} />
      </WatchlistProvider>
    );

    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  it('closes drawer when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <WatchlistProvider>
        <WatchlistDrawer isOpen={true} onClose={onClose} />
      </WatchlistProvider>
    );

    const closeButton = screen.getByLabelText('Close watchlist');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes drawer when backdrop clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <WatchlistProvider>
        <WatchlistDrawer isOpen={true} onClose={onClose} />
      </WatchlistProvider>
    );

    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('shows empty state when no funds in watchlist', () => {
    render(
      <WatchlistProvider>
        <WatchlistDrawer isOpen={true} onClose={() => {}} />
      </WatchlistProvider>
    );

    expect(screen.getByText('No funds in watchlist')).toBeInTheDocument();
  });
});

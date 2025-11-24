import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';
import ToastContainer from '@/components/notifications/ToastContainer';

function TestComponent() {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast('Success!', 'success')}>
        Add Success
      </button>
      <button onClick={() => addToast('Error!', 'error')}>Add Error</button>
      <button onClick={() => addToast('Info!', 'info')}>Add Info</button>
      <button onClick={() => addToast('Warning!', 'warning')}>
        Add Warning
      </button>
      <button onClick={() => addToast('Persistent', 'info', 0)}>
        Add Persistent
      </button>
    </div>
  );
}

describe('Toast Notification System', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('renders toast provider correctly', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    function InvalidComponent() {
      useToast();
      return null;
    }

    expect(() => {
      render(<InvalidComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
  });

  it('adds success toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Success'));

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
  });

  it('adds error toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Error'));

    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });

  it('adds info toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Info'));

    expect(screen.getByText('Info!')).toBeInTheDocument();
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
  });

  it('adds warning toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Warning'));

    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByTestId('toast-warning')).toBeInTheDocument();
  });

  it('closes toast when close button is clicked', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('auto-closes toast after default duration', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    vi.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('does not auto-close persistent toast', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Persistent'));
    expect(screen.getByText('Persistent')).toBeInTheDocument();

    vi.advanceTimersByTime(10000);

    expect(screen.getByText('Persistent')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('displays multiple toasts', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Success'));
    await user.click(screen.getByText('Add Error'));
    await user.click(screen.getByText('Add Info'));

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Info!')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Add Success'));

    const container = screen.getByRole('region', { name: /notifications/i });
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-atomic', 'false');

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

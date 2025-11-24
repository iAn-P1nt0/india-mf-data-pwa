import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
}

/**
 * Hook for managing keyboard shortcuts throughout the app
 * Supports: Ctrl+K (search), Ctrl+/, Ctrl+J (navigation), etc.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true; // metaKey for Mac
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;
        const altMatch = shortcut.altKey ? event.altKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
}

/**
 * Hook for global keyboard shortcuts (Ctrl+K search, etc.)
 */
export function useGlobalKeyboardShortcuts() {
  const handleSearch = useCallback(() => {
    // Dispatch custom event for global search
    const event = new CustomEvent('openSearch');
    window.dispatchEvent(event);
  }, []);

  const handleHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleFunds = useCallback(() => {
    window.location.href = '/funds';
  }, []);

  const handleVisualizations = useCallback(() => {
    window.location.href = '/visualizations';
  }, []);

  const handlePortfolio = useCallback(() => {
    window.location.href = '/tools/portfolio';
  }, []);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      handler: handleSearch,
      description: 'Open search (Ctrl+K)'
    },
    {
      key: '/',
      ctrlKey: true,
      handler: handleSearch,
      description: 'Open search (Ctrl+/)'
    },
    {
      key: 'h',
      ctrlKey: true,
      handler: handleHome,
      description: 'Go to home (Ctrl+H)'
    },
    {
      key: 'f',
      ctrlKey: true,
      handler: handleFunds,
      description: 'Go to funds (Ctrl+F)'
    },
    {
      key: 'v',
      ctrlKey: true,
      handler: handleVisualizations,
      description: 'Go to visualizations (Ctrl+V)'
    },
    {
      key: 'p',
      ctrlKey: true,
      handler: handlePortfolio,
      description: 'Go to portfolio (Ctrl+P)'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

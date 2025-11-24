'use client';

/**
 * Keyboard Command Palette Component
 * Appears on Ctrl+K or Ctrl+/ - provides keyboard-accessible navigation
 * Inspired by GitHub/VSCode command palettes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  href?: string;
  action?: () => void;
  category: 'navigation' | 'action' | 'search';
  shortcut?: string;
}

const COMMANDS: Command[] = [
  // Navigation
  {
    id: 'home',
    label: 'Home',
    description: 'Go to home page',
    icon: '🏠',
    href: '/',
    category: 'navigation',
    shortcut: 'Ctrl+H'
  },
  {
    id: 'funds',
    label: 'Fund Analysis',
    description: 'Analyze mutual funds with charts and metrics',
    icon: '📊',
    href: '/funds',
    category: 'navigation',
    shortcut: 'Ctrl+F'
  },
  {
    id: 'visualizations',
    label: 'Advanced Visualizations',
    description: 'View heatmaps, comparisons, and analysis',
    icon: '📈',
    href: '/visualizations',
    category: 'navigation',
    shortcut: 'Ctrl+V'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Manage your investment portfolio',
    icon: '💼',
    href: '/tools/portfolio',
    category: 'navigation',
    shortcut: 'Ctrl+P'
  },
  {
    id: 'sip',
    label: 'SIP Calculator',
    description: 'Calculate SIP returns and projections',
    icon: '🧮',
    href: '/tools/sip',
    category: 'navigation'
  },
  {
    id: 'api',
    label: 'API Explorer',
    description: 'Explore and test the mutual funds API',
    icon: '🔌',
    href: '/api-explorer',
    category: 'navigation'
  },
  // Actions
  {
    id: 'theme-toggle',
    label: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    icon: '🌙',
    action: () => {
      const html = document.documentElement;
      html.classList.toggle('dark');
    },
    category: 'action'
  },
  {
    id: 'help',
    label: 'Help',
    description: 'View keyboard shortcuts and help',
    icon: '❓',
    action: () => {
      console.log('Help triggered');
    },
    category: 'action'
  }
];

interface KeyboardCommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function KeyboardCommandPalette({ isOpen = false, onClose }: KeyboardCommandPaletteProps) {
  const [open, setOpen] = useState(isOpen);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Listen for Ctrl+K and Ctrl+/ globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      // Ctrl+/ or Cmd+/ (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen(!open);
      }
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return COMMANDS;

    return COMMANDS.filter(
      command =>
        command.label.toLowerCase().includes(search.toLowerCase()) ||
        command.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const command = filteredCommands[selectedIndex];
          if (command.action) {
            command.action();
          } else if (command.href) {
            window.location.href = command.href;
          }
          setOpen(false);
          setSearch('');
        }
        break;
    }
  };

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => {
          setOpen(false);
          setSearch('');
          onClose?.();
        }}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span>🔍</span>
              <input
                autoFocus
                type="text"
                placeholder="Search commands or navigate..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-lg"
              />
              <span className="text-xs text-gray-400">ESC</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg font-medium">No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    if (command.action) {
                      command.action();
                    } else if (command.href) {
                      window.location.href = command.href;
                    }
                    setOpen(false);
                    setSearch('');
                    onClose?.();
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{command.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{command.label}</p>
                    <p className="text-sm text-gray-500">{command.description}</p>
                  </div>
                  {command.shortcut && (
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {command.shortcut}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-4">
              <span>↑↓ Navigate</span>
              <span>⏎ Select</span>
              <span>ESC Close</span>
            </div>
            <span>Keyboard shortcuts active</span>
          </div>
        </div>
      </div>
    </>
  );
}

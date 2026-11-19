import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb(): never {
  throw new Error('render exploded');
}

describe('Error boundary', () => {
  it('renders the branded recovery screen instead of a blank page', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('the desk hit a fault');
    expect(screen.getByRole('button', { name: 'Reload the desk' })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});

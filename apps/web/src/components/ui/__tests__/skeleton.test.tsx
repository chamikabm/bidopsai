import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('renders correctly', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('rounded-md')
    expect(skeleton).toHaveClass('bg-muted')
  })

  it('applies custom className', () => {
    render(<Skeleton className="h-10 w-full" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('h-10')
    expect(skeleton).toHaveClass('w-full')
  })

  it('merges custom className with default classes', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('custom-class')
  })

  it('accepts standard div props', () => {
    render(<Skeleton data-testid="skeleton" id="test-skeleton" role="status" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('id', 'test-skeleton')
    expect(skeleton).toHaveAttribute('role', 'status')
  })

  it('can be used for text loading', () => {
    render(<Skeleton className="h-4 w-[250px]" data-testid="text-skeleton" />)
    const skeleton = screen.getByTestId('text-skeleton')
    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).toHaveClass('w-[250px]')
  })

  it('can be used for avatar loading', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" data-testid="avatar-skeleton" />)
    const skeleton = screen.getByTestId('avatar-skeleton')
    expect(skeleton).toHaveClass('h-12')
    expect(skeleton).toHaveClass('w-12')
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('can be used for card loading', () => {
    render(
      <div data-testid="card-skeleton">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument()
  })

  it('renders as a div element', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton.tagName).toBe('DIV')
  })

  it('supports aria-label for accessibility', () => {
    render(<Skeleton aria-label="Loading content" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
  })

  it('supports aria-busy for accessibility', () => {
    render(<Skeleton aria-busy="true" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
  })
})

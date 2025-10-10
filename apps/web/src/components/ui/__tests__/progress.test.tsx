import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '../progress'

describe('Progress', () => {
  it('renders progress bar', () => {
    const { container } = render(<Progress value={50} />)
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it('displays correct progress value', () => {
    const { container } = render(<Progress value={75} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
  })

  it('handles 0% progress', () => {
    const { container } = render(<Progress value={0} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  it('handles 100% progress', () => {
    const { container } = render(<Progress value={100} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

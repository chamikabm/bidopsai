import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    render(<Button>Default</Button>)
    const button = screen.getByText('Default')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button).toHaveClass('bg-secondary')
  })

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Destructive</Button>)
    const button = screen.getByText('Destructive')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByText('Outline')
    expect(button).toHaveClass('border')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByText('Ghost')
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('applies link variant', () => {
    render(<Button variant="link">Link</Button>)
    const button = screen.getByText('Link')
    expect(button).toHaveClass('underline-offset-4')
  })

  it('applies default size', () => {
    render(<Button>Default Size</Button>)
    const button = screen.getByText('Default Size')
    expect(button).toHaveClass('h-10')
  })

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByText('Small')
    expect(button).toHaveClass('h-9')
  })

  it('applies lg size', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByText('Large')
    expect(button).toHaveClass('h-11')
  })

  it('applies icon size', () => {
    render(<Button size="icon">Icon</Button>)
    const button = screen.getByText('Icon')
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByText('Click me')
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })

  it('does not trigger click when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    )

    const button = screen.getByText('Disabled')
    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByText('Custom')
    expect(button).toHaveClass('custom-class')
  })

  it('renders as button element by default', () => {
    render(<Button>Button</Button>)
    const button = screen.getByText('Button')
    expect(button.tagName).toBe('BUTTON')
  })

  it('supports different button types', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>)
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit')

    rerender(<Button type="reset">Reset</Button>)
    expect(screen.getByText('Reset')).toHaveAttribute('type', 'reset')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Button</Button>)
    expect(ref).toHaveBeenCalled()
  })

  it('renders with asChild prop', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByText('Link Button')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/test')
  })
})

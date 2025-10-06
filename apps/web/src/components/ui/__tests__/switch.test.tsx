import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '../switch'

describe('Switch', () => {
  it('renders correctly', () => {
    render(<Switch aria-label="Test switch" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('handles checked state', () => {
    render(<Switch checked aria-label="Checked" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'checked')
  })

  it('handles unchecked state', () => {
    render(<Switch checked={false} aria-label="Unchecked" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'unchecked')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} aria-label="Clickable" />)
    
    const switchElement = screen.getByRole('switch')
    await user.click(switchElement)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('toggles between checked and unchecked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />)
    
    const switchElement = screen.getByRole('switch')
    
    await user.click(switchElement)
    expect(handleChange).toHaveBeenCalledWith(true)
    
    await user.click(switchElement)
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('handles disabled state', () => {
    render(<Switch disabled aria-label="Disabled" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
  })

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch disabled onCheckedChange={handleChange} aria-label="Disabled" />)
    
    const switchElement = screen.getByRole('switch')
    await user.click(switchElement)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Switch className="custom-class" aria-label="Custom" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Switch ref={ref} aria-label="Ref test" />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('handles keyboard interaction (Space)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} aria-label="Keyboard" />)
    
    const switchElement = screen.getByRole('switch')
    switchElement.focus()
    await user.keyboard(' ')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles keyboard interaction (Enter)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} aria-label="Keyboard" />)
    
    const switchElement = screen.getByRole('switch')
    switchElement.focus()
    await user.keyboard('{Enter}')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles required attribute', () => {
    render(<Switch required aria-label="Required" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('aria-required', 'true')
  })

  it('handles name attribute for form submission', () => {
    render(<Switch name="notifications" aria-label="Notifications" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('name', 'notifications')
  })

  it('handles value attribute', () => {
    render(<Switch value="enabled" aria-label="Value test" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('value', 'enabled')
  })

  it('has correct accessibility attributes', () => {
    render(<Switch aria-label="Accessibility test" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('role', 'switch')
    expect(switchElement).toHaveAttribute('aria-label', 'Accessibility test')
  })
})

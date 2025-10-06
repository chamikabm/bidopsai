import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../checkbox'

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox aria-label="Test checkbox" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('handles checked state', () => {
    render(<Checkbox checked aria-label="Checked" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('handles unchecked state', () => {
    render(<Checkbox checked={false} aria-label="Unchecked" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onCheckedChange={handleChange} aria-label="Clickable" />)
    
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('handles disabled state', () => {
    render(<Checkbox disabled aria-label="Disabled" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" aria-label="Custom" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Checkbox ref={ref} aria-label="Ref test" />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('handles indeterminate state', () => {
    render(<Checkbox checked="indeterminate" aria-label="Indeterminate" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
  })

  it('toggles between checked and unchecked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onCheckedChange={handleChange} aria-label="Toggle" />)
    
    const checkbox = screen.getByRole('checkbox')
    
    await user.click(checkbox)
    expect(handleChange).toHaveBeenCalledWith(true)
    
    await user.click(checkbox)
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox disabled onCheckedChange={handleChange} aria-label="Disabled" />)
    
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('handles keyboard interaction (Space)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onCheckedChange={handleChange} aria-label="Keyboard" />)
    
    const checkbox = screen.getByRole('checkbox')
    checkbox.focus()
    await user.keyboard(' ')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles required attribute', () => {
    render(<Checkbox required aria-label="Required" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-required', 'true')
  })

  it('handles name attribute for form submission', () => {
    render(<Checkbox name="terms" aria-label="Terms" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('name', 'terms')
  })

  it('handles value attribute', () => {
    render(<Checkbox value="accepted" aria-label="Value test" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('value', 'accepted')
  })
})

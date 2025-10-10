import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '../textarea'

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts user input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Enter text" />)
    
    const textarea = screen.getByPlaceholderText('Enter text')
    await user.type(textarea, 'Hello World')
    
    expect(textarea).toHaveValue('Hello World')
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" placeholder="Test" />)
    const textarea = screen.getByPlaceholderText('Test')
    expect(textarea).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('handles disabled state', () => {
    render(<Textarea disabled placeholder="Disabled" />)
    const textarea = screen.getByPlaceholderText('Disabled')
    expect(textarea).toBeDisabled()
  })

  it('handles readOnly state', () => {
    render(<Textarea readOnly value="Read only text" />)
    const textarea = screen.getByDisplayValue('Read only text')
    expect(textarea).toHaveAttribute('readOnly')
  })

  it('handles value prop', () => {
    render(<Textarea value="Initial value" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Initial value')).toBeInTheDocument()
  })

  it('handles defaultValue prop', () => {
    render(<Textarea defaultValue="Default value" />)
    expect(screen.getByDisplayValue('Default value')).toBeInTheDocument()
  })

  it('handles maxLength attribute', async () => {
    const user = userEvent.setup()
    render(<Textarea maxLength={10} placeholder="Max 10 chars" />)
    
    const textarea = screen.getByPlaceholderText('Max 10 chars')
    await user.type(textarea, '12345678901234567890')
    
    expect(textarea).toHaveValue('1234567890')
  })

  it('handles rows attribute', () => {
    render(<Textarea rows={5} placeholder="5 rows" />)
    const textarea = screen.getByPlaceholderText('5 rows')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('handles onChange event', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} placeholder="Test" />)
    
    const textarea = screen.getByPlaceholderText('Test')
    await user.type(textarea, 'a')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles onFocus event', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    render(<Textarea onFocus={handleFocus} placeholder="Test" />)
    
    const textarea = screen.getByPlaceholderText('Test')
    await user.click(textarea)
    
    expect(handleFocus).toHaveBeenCalled()
  })

  it('handles onBlur event', async () => {
    const user = userEvent.setup()
    const handleBlur = vi.fn()
    render(<Textarea onBlur={handleBlur} placeholder="Test" />)
    
    const textarea = screen.getByPlaceholderText('Test')
    await user.click(textarea)
    await user.tab()
    
    expect(handleBlur).toHaveBeenCalled()
  })
})

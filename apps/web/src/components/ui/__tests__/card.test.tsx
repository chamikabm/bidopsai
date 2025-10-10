import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card>Card Content</Card>)
      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header Content</CardHeader>)
      expect(screen.getByText('Header Content')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('renders as div element', () => {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('DIV')
    })

    it('renders children correctly', () => {
      render(<CardTitle>Card Title</CardTitle>)
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })
  })

  describe('CardDescription', () => {
    it('renders as div element', () => {
      render(<CardDescription>Description</CardDescription>)
      const description = screen.getByText('Description')
      expect(description.tagName).toBe('DIV')
    })

    it('renders children correctly', () => {
      render(<CardDescription>Card Description</CardDescription>)
      expect(screen.getByText('Card Description')).toBeInTheDocument()
    })
  })

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content</CardContent>)
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(<CardFooter>Footer</CardFooter>)
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })
  })

  describe('Complete Card', () => {
    it('renders all parts together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByText('Test Footer')).toBeInTheDocument()
    })
  })
})

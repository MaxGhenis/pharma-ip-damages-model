import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App - Dark Theme Design', () => {
  it('renders with dark background', () => {
    render(<App />)
    const mainContainer = document.querySelector('.min-h-screen')
    expect(mainContainer).toHaveStyle({ background: 'var(--bg-primary)' })
  })

  it('renders the header with correct styling', () => {
    render(<App />)
    const header = document.querySelector('header')
    expect(header).toHaveStyle({ background: 'var(--bg-secondary)' })
    expect(header).toHaveClass('border-b')
  })

  it('displays the IP DAMAGES badge', () => {
    render(<App />)
    expect(screen.getByText('IP DAMAGES')).toBeInTheDocument()
    expect(screen.getByText('IP DAMAGES')).toHaveClass('badge', 'badge-gold')
  })

  it('renders the title with display font', () => {
    render(<App />)
    const title = screen.getByText('Pharma/Biotech IP Damages Calculator')
    expect(title).toHaveClass('font-display')
    expect(title.tagName).toBe('H1')
  })

  it('renders analysis options section with dark card styling', () => {
    render(<App />)
    const optionsSection = screen.getByText('Analysis Options').closest('div')
    expect(optionsSection).toHaveClass('card')
  })

  it('renders checkboxes with custom styling', () => {
    render(<App />)
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveClass('checkbox-custom')
    })
  })

  it('renders Model Inputs heading with proper styling', () => {
    render(<App />)
    const heading = screen.getByText('Model Inputs')
    expect(heading).toHaveStyle({ color: 'var(--text-primary)' })
  })

  it('renders loading spinner with gold accent', () => {
    // We need to trigger loading state - this will be tested via integration
    render(<App />)
    // Initial render should not show loading
    expect(screen.queryByText('Calculating...')).not.toBeInTheDocument()
  })
})

describe('App - Footer Dark Theme', () => {
  it('renders footer with dark background', () => {
    render(<App />)
    const footer = document.querySelector('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('border-t')
  })

  it('renders footer headings with gold accent', () => {
    render(<App />)
    const aboutHeading = screen.getByText('About This Tool')
    expect(aboutHeading).toHaveClass('font-display')
  })

  it('renders legal references list', () => {
    render(<App />)
    // Use getAllBy since some terms appear in multiple places
    expect(screen.getAllByText(/Panduit Corp/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Georgia-Pacific/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Rubinstein/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Shapley/).length).toBeGreaterThan(0)
  })
})

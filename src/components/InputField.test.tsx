import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TripleInput, NumberInput } from './InputField'

describe('InputField - Text Visibility', () => {
  it('TripleInput renders all three inputs with correct values', () => {
    const mockOnChange = vi.fn()
    render(
      <TripleInput
        label="Total Market Size"
        value={{ low: 7000000000, base: 8000000000, high: 9000000000, distribution: 'triangular' }}
        onChange={mockOnChange}
        format="currency"
        helpText="Annual US market size in dollars"
      />
    )

    // Find all input fields
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBe(3)

    // Values should be displayed (in billions for currency format)
    expect(inputs[0]).toHaveValue(7000000000)
    expect(inputs[1]).toHaveValue(8000000000)
    expect(inputs[2]).toHaveValue(9000000000)
  })

  it('TripleInput inputs should have text-center class for centering', () => {
    const mockOnChange = vi.fn()
    render(
      <TripleInput
        label="Total Market Size"
        value={{ low: 7000000000, base: 8000000000, high: 9000000000, distribution: 'triangular' }}
        onChange={mockOnChange}
        format="currency"
        helpText="Annual US market size in dollars"
      />
    )

    const inputs = screen.getAllByRole('spinbutton')
    inputs.forEach((input) => {
      // Should have text-center class for centering
      expect(input).toHaveClass('text-center')
    })
  })

  it('NumberInput shows full value without truncation', () => {
    const mockOnChange = vi.fn()
    render(
      <NumberInput
        label="Test Number"
        value={2020}
        onChange={mockOnChange}
      />
    )

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(2020)
  })
})

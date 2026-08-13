import { render, screen } from '@/test/utils'
import RfiPage from './rfis'

describe('RfiPage', () => {
  // Simple smoke test to verify the component renders
  it('renders the page', () => {
    render(<RfiPage />)
    // The primary heading is the h1 "RFIs" (renamed from "Request for Information")
    const headings = screen.getAllByRole('heading', { name: /rfis/i })
    expect(headings.length).toBeGreaterThan(0)
  })
})
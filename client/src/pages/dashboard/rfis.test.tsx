import { render, screen } from '@/test/utils'
import RfiPage from './rfis'

describe('RfiPage', () => {
  // Simple smoke test to verify the component renders
  it('renders the page', () => {
    render(<RfiPage />)
    expect(screen.getByRole('heading', { name: /request for information/i })).toBeInTheDocument()
  })
})
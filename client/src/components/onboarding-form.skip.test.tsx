import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import OnboardingForm from './onboarding-form';
import { uploadFile } from '@/lib/upload';

// Mock file upload
vi.mock('@/lib/upload', () => ({
  uploadFile: vi.fn()
}));

describe('OnboardingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<OnboardingForm />);

    // Check for all required form fields
    expect(screen.getByLabelText(/trade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telephone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cell phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/certification name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company logo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minority-owned business/i)).toBeInTheDocument();
  });

  it('shows minority group selection when minority-owned is checked', async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    const minorityCheckbox = screen.getByLabelText(/minority-owned business/i);
    await user.click(minorityCheckbox);

    expect(await screen.findByText(/minority group/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /complete profile/i });
    await user.click(submitButton);

    // Check for validation messages
    expect(await screen.findByText(/trade is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/contact name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/telephone is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/business email is required/i)).toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    const user = userEvent.setup();
    (uploadFile as any).mockResolvedValue('https://example.com/logo.jpg');

    render(<OnboardingForm />);

    // Fill out the form
    await user.click(screen.getByRole('combobox', { name: /trade/i }));
    await user.click(screen.getByText('General Contractor'));
    
    await user.type(screen.getByLabelText(/contact name/i), 'John Doe');
    await user.type(screen.getByLabelText(/telephone/i), '123-456-7890');
    await user.type(screen.getByLabelText(/cell phone/i), '098-765-4321');
    await user.type(screen.getByLabelText(/business email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/certification name/i), 'Certified Pro');

    // Create a test file and upload it
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/company logo/i);
    await user.upload(fileInput, file);

    // Submit the form
    await user.click(screen.getByRole('button', { name: /complete profile/i }));

    // Verify form submission
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(file);
    });
  });

  it('handles file upload errors', async () => {
    const user = userEvent.setup();
    (uploadFile as any).mockRejectedValue(new Error('Upload failed'));

    render(<OnboardingForm />);

    // Upload a file
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/company logo/i);
    await user.upload(fileInput, file);

    // Submit the form
    await user.click(screen.getByRole('button', { name: /complete profile/i }));

    // Check for error message
    expect(await screen.findByText(/failed to upload logo/i)).toBeInTheDocument();
  });

  it('handles API submission errors', async () => {
    const user = userEvent.setup();
    (uploadFile as any).mockResolvedValue('https://example.com/logo.jpg');

    render(<OnboardingForm />);

    // Fill required fields with invalid data to trigger API error
    await user.click(screen.getByRole('combobox', { name: /trade/i }));
    await user.click(screen.getByText('General Contractor'));
    
    await user.type(screen.getByLabelText(/contact name/i), 'John Doe');
    await user.type(screen.getByLabelText(/telephone/i), '123-456-7890');
    await user.type(screen.getByLabelText(/business email/i), 'invalid-email');

    // Submit form
    await user.click(screen.getByRole('button', { name: /complete profile/i }));

    // Check for error message
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });
});

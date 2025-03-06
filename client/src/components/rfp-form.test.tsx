import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import RfpForm from './rfp-form';

describe('RfpForm', () => {
  const mockDate = new Date('2025-03-06T12:00:00Z').toISOString().split('T')[0];

  it('renders all form fields', async () => {
    render(<RfpForm />);

    // Verify all inputs are present with correct attributes
    expect(screen.getByTestId('title-input')).toHaveAttribute('placeholder', 'Enter RFP title');
    expect(screen.getByTestId('description-input')).toHaveAttribute('placeholder', 'Enter RFP description');
    expect(screen.getByTestId('walkthrough-date-input')).toHaveAttribute('type', 'datetime-local');
    expect(screen.getByTestId('rfi-date-input')).toHaveAttribute('type', 'datetime-local');
    expect(screen.getByTestId('deadline-input')).toHaveAttribute('type', 'datetime-local');
    expect(screen.getByTestId('location-input')).toHaveAttribute('placeholder', 'Enter job location');
    expect(screen.getByTestId('budget-input')).toHaveAttribute('type', 'number');
    expect(screen.getByTestId('certification-input')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-input')).toHaveAttribute('type', 'url');
  });

  it('handles form submission', async () => {
    const onSuccess = vi.fn();
    const { user } = render(<RfpForm onSuccess={onSuccess} />);

    // Fill in required fields
    await user.type(screen.getByTestId('title-input'), 'Test RFP');
    await user.type(screen.getByTestId('description-input'), 'Test Description');
    await user.type(screen.getByTestId('location-input'), 'San Francisco');

    // Verify input values after typing
    expect(screen.getByTestId('title-input')).toHaveValue('Test RFP');
    expect(screen.getByTestId('description-input')).toHaveValue('Test Description');
    expect(screen.getByTestId('location-input')).toHaveValue('San Francisco');

    // Set future dates for all date fields
    const futureDates = [
      mockDate + 'T10:00', // walkthrough
      mockDate + 'T12:00', // RFI
      mockDate + 'T14:00', // deadline
    ];

    await user.type(screen.getByTestId('walkthrough-date-input'), futureDates[0]);
    await user.type(screen.getByTestId('rfi-date-input'), futureDates[1]);
    await user.type(screen.getByTestId('deadline-input'), futureDates[2]);

    // Verify date values
    expect(screen.getByTestId('walkthrough-date-input')).toHaveValue(futureDates[0]);
    expect(screen.getByTestId('rfi-date-input')).toHaveValue(futureDates[1]);
    expect(screen.getByTestId('deadline-input')).toHaveValue(futureDates[2]);

    // Submit the form
    await user.click(screen.getByTestId('submit-button'));

    // Wait for success callback
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    const { user } = render(<RfpForm />);

    // Submit empty form
    await user.click(screen.getByTestId('submit-button'));

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getAllByRole('alert')).toHaveLength(6); // 6 required fields
    });

    // Check each required field's error message
    const errorMessages = {
      'title-error': 'Title is required',
      'description-error': 'Description is required',
      'location-error': 'Job location is required',
      'walkthrough-date-error': 'Walkthrough date is required',
      'rfi-date-error': 'RFI date is required',
      'deadline-error': 'Deadline is required',
    };

    for (const [testId, message] of Object.entries(errorMessages)) {
      const errorElement = screen.getByTestId(testId);
      expect(errorElement).toHaveTextContent(message);
    }
  });

  it('handles cancel button click', async () => {
    const onCancel = vi.fn();
    const { user } = render(<RfpForm onCancel={onCancel} />);

    await user.click(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalled();
  });
});
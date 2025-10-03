import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the AI service
vi.mock('../services/aiService', () => ({
  generateAIContent: vi.fn(),
  hasValidAPIKey: vi.fn(() => true)
}));

import { generateAIContent } from '../services/aiService';

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show generating state when continue button is clicked', async () => {
    generateAIContent.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('AI content'), 100))
    );

    render(<App />);
    
    // Find and click the continue button
    const continueButton = screen.getByText(/continue writing/i);
    fireEvent.click(continueButton);
    
    // Should show generating overlay
    expect(screen.getByText(/ai is writing/i)).toBeInTheDocument();
    
    // Wait for generation to complete
    await waitFor(() => {
      expect(screen.queryByText(/ai is writing/i)).not.toBeInTheDocument();
    });
  });

  it('should show AI toolbar in review state', async () => {
    generateAIContent.mockResolvedValue('Generated content');

    render(<App />);
    
    const continueButton = screen.getByText(/continue writing/i);
    fireEvent.click(continueButton);
    
    // Wait for review state
    await waitFor(() => {
      expect(screen.getByText(/accept all/i)).toBeInTheDocument();
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      expect(screen.getByText(/discard session/i)).toBeInTheDocument();
    });
  });

  it('should handle AI generation errors', async () => {
    generateAIContent.mockRejectedValue(new Error('API failed'));

    render(<App />);
    
    const continueButton = screen.getByText(/continue writing/i);
    fireEvent.click(continueButton);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KPIOverviewPage } from '../../pages/KPIOverviewPage';
import { useCapExData } from '../../hooks/useCapExData';
import { CapExErrorBoundary } from '../../components/ErrorBoundary';
import type { Project } from '../../components/capex/types/capex-unified';

// Mock the hooks and components
vi.mock('../../hooks/useCapExData');
vi.mock('../../components/capex/CapExSummaryCards', () => ({
  CapExSummaryCards: () => <div data-testid="summary-cards">Summary Cards</div>
}));
vi.mock('../../components/capex/ProjectRow', () => ({
  ProjectRow: () => <div data-testid="project-row">Project Row</div>
}));
vi.mock('../../components/capex/ProjectEditModal', () => ({
  ProjectEditModal: () => <div data-testid="project-edit-modal">Edit Modal</div>
}));
vi.mock('../../components/capex/admin/AdminConfig', () => ({
  AdminConfig: () => <div data-testid="admin-config">Admin Config</div>
}));

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    projectName: 'Test Project',
    projectOwner: 'Test Owner',
    projectType: 'project',
    startDate: new Date(),
    endDate: new Date(),
    totalBudget: 1000,
    totalActual: 500,
    projectStatus: 'On Track',
    overallCompletion: 50,
    phases: {
      feasibility: { id: 'feasibility', name: 'Feasibility', weight: 15, subItems: [], completion: 100 },
      planning: { id: 'planning', name: 'Planning', weight: 35, subItems: [], completion: 50 },
      execution: { id: 'execution', name: 'Execution', weight: 45, subItems: [], completion: 0 },
      close: { id: 'close', name: 'Close', weight: 5, subItems: [], completion: 0 }
    },
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('KPIOverviewPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default mock implementation
    (useCapExData as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
      updateProject: vi.fn()
    });
  });

  it('renders loading state correctly', () => {
    (useCapExData as any).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      updateProject: vi.fn()
    });

    render(<KPIOverviewPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Test error message';
    (useCapExData as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
      updateProject: vi.fn()
    });

    render(<KPIOverviewPage />);
    expect(screen.getByText(`Error loading data: ${errorMessage}`)).toBeInTheDocument();
  });

  it('renders content correctly when data is loaded', () => {
    render(<KPIOverviewPage />);
    
    expect(screen.getByText('CapEx Scorecard')).toBeInTheDocument();
    expect(screen.getByText('Hide Financials')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('project-row')).toBeInTheDocument();
  });

  it('handles error boundary correctly', async () => {
    // Create a component that throws an error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Render the page with an error-throwing component
    render(
      <CapExErrorBoundary>
        <ThrowError />
      </CapExErrorBoundary>
    );

    // Verify error UI is shown
    expect(screen.getByText('CapEx Component Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    // Test retry functionality
    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    // Verify error UI is still shown (since the component still throws)
    await waitFor(() => {
      expect(screen.getByText('CapEx Component Error')).toBeInTheDocument();
    });
  });

  it('handles financials toggle correctly', () => {
    render(<KPIOverviewPage />);
    
    const toggleButton = screen.getByText('Hide Financials');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Show Financials')).toBeInTheDocument();
  });

  it('handles admin config modal correctly', () => {
    render(<KPIOverviewPage />);
    
    const adminButton = screen.getByText('Admin Settings');
    fireEvent.click(adminButton);
    
    expect(screen.getByTestId('admin-config')).toBeInTheDocument();
  });

  it('handles analytics click correctly', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<KPIOverviewPage />);
    
    const analyticsButton = screen.getByText('Analytics');
    fireEvent.click(analyticsButton);
    
    expect(alertMock).toHaveBeenCalledWith('Analytics functionality coming in Phase 3');
    
    alertMock.mockRestore();
  });
}); 
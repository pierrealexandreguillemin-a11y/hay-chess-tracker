import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as storage from '@/lib/storage';
import type { Event } from '@/types';

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getCurrentEvent: vi.fn(),
  saveEvent: vi.fn(),
}));

// Mock child components to isolate App logic
vi.mock('@/components/EventForm', () => ({
  default: ({ onEventCreated }: { onEventCreated: (event: Event) => void }) => (
    <div data-testid="event-form">
      <button onClick={() => onEventCreated(mockEvent)}>Create Event</button>
    </div>
  ),
}));

vi.mock('@/components/TournamentTabs', () => ({
  default: ({ event }: { event: Event }) => (
    <div data-testid="tournament-tabs">Tournament Tabs: {event.name}</div>
  ),
}));

vi.mock('@/components/HalftoneWaves', () => ({
  default: () => <div data-testid="halftone-waves">Halftone Waves</div>,
}));

vi.mock('@/components/BackgroundPaths', () => ({
  default: () => <div data-testid="background-paths">Background Paths</div>,
}));

vi.mock('@/components/common/FloatingParticles', () => ({
  default: ({ density, speed }: { density: number; speed: number }) => (
    <div data-testid="floating-particles" data-density={density} data-speed={speed}>
      Floating Particles
    </div>
  ),
}));

const mockEvent: Event = {
  id: 'evt_123',
  name: 'Test Event',
  createdAt: '2025-10-30T00:00:00.000Z',
  tournaments: [
    {
      id: 'trn_1',
      name: 'U12',
      url: 'https://echecs.asso.fr/Resultats.aspx?Action=Ga',
      lastUpdate: '',
      players: [],
    },
  ],
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mount and Initialization', () => {
    it('renders without crashing', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);
      expect(screen.getByText('HAY CHESS TRACKER')).toBeInTheDocument();
    });

    it('calls getCurrentEvent on mount', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);
      // Called twice due to lazy initialization in both useState calls
      expect(storage.getCurrentEvent).toHaveBeenCalled();
    });

    it('renders background components on mount', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      expect(screen.getByTestId('halftone-waves')).toBeInTheDocument();
      expect(screen.getByTestId('background-paths')).toBeInTheDocument();
      expect(screen.getByTestId('floating-particles')).toBeInTheDocument();
    });

    it('renders FloatingParticles with correct props', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const particles = screen.getByTestId('floating-particles');
      expect(particles).toHaveAttribute('data-density', '30');
      expect(particles).toHaveAttribute('data-speed', '1');
    });
  });

  describe('Initial State - No Current Event', () => {
    it('shows event form when no current event exists', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    it('shows "Annuler" button when no event and form is shown', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('does not render empty state when form is shown', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      expect(screen.queryByText('Aucun événement actif')).not.toBeInTheDocument();
    });

    it('does not render TournamentTabs when no current event', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      expect(screen.queryByTestId('tournament-tabs')).not.toBeInTheDocument();
    });
  });

  describe('Initial State - With Current Event', () => {
    it('loads current event from storage and hides form', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
    });

    it('displays event name in header when event exists', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('shows TournamentTabs when event exists and form is hidden', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      expect(screen.getByTestId('tournament-tabs')).toBeInTheDocument();
      expect(screen.getByText(/Tournament Tabs: Test Event/)).toBeInTheDocument();
    });

    it('does not show empty state when event exists', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      expect(screen.queryByText('Aucun événement actif')).not.toBeInTheDocument();
    });
  });

  describe('Navigation and User Actions', () => {
    it('toggles event form when "Nouvel événement" button is clicked', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const button = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(button);

      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
    });

    it('changes button text from "Annuler" to "Nouvel événement" when toggling', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const button = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(button);

      expect(screen.getByRole('button', { name: /nouvel événement/i })).toBeInTheDocument();
    });

    it('shows event form when button is clicked in empty state', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      // Close form first
      const headerButton = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(headerButton);

      // Click button in empty state
      const emptyStateButton = screen.getByRole('button', { name: /créer un événement/i });
      fireEvent.click(emptyStateButton);

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    it('hides TournamentTabs when form is shown with existing event', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      const button = screen.getByRole('button', { name: /nouvel événement/i });
      fireEvent.click(button);

      expect(screen.queryByTestId('tournament-tabs')).not.toBeInTheDocument();
      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });
  });

  describe('Event Creation Flow', () => {
    it('calls saveEvent when event is created', async () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const createButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(storage.saveEvent).toHaveBeenCalledWith(mockEvent);
      });
    });

    it('updates current event after creation', async () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const createButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
    });

    it('hides form after event creation', async () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const createButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
      });
    });

    it('displays TournamentTabs after event creation', async () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      const createButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-tabs')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State Display', () => {
    it('shows empty state when no event and form is hidden', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      // Hide form
      const button = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(button);

      expect(screen.getByText('Aucun événement actif')).toBeInTheDocument();
      expect(screen.getByText(/créez un nouvel événement pour commencer/i)).toBeInTheDocument();
    });

    it('empty state has button to create event', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      render(<App />);

      // Hide form
      const button = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(button);

      const createButton = screen.getByRole('button', { name: /créer un événement/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Header Display', () => {
    it('always displays HAY CHESS TRACKER title', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      const { rerender } = render(<App />);

      expect(screen.getByText('HAY CHESS TRACKER')).toBeInTheDocument();

      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      rerender(<App />);

      expect(screen.getByText('HAY CHESS TRACKER')).toBeInTheDocument();
    });

    it('shows event name in header only when event exists', () => {
      vi.mocked(storage.getCurrentEvent).mockReturnValue(null);
      const { unmount } = render(<App />);

      expect(screen.queryByText('Test Event')).not.toBeInTheDocument();
      unmount();

      // Remount with event
      vi.mocked(storage.getCurrentEvent).mockReturnValue(mockEvent);
      render(<App />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });
});

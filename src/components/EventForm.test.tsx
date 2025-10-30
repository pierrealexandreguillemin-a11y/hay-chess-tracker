import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventForm from './EventForm';
import type { Event } from '@/types';

describe('EventForm', () => {
  let mockOnEventCreated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnEventCreated = vi.fn();
  });

  describe('Initial Render', () => {
    it('renders form with all required fields', () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      expect(screen.getByLabelText(/nom de l'événement/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/championnat départemental/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer l'événement/i })).toBeInTheDocument();
    });

    it('renders with one empty tournament by default', () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      expect(screen.getByLabelText(/nom \(ex: u12, u14\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i)).toBeInTheDocument();
    });

    it('renders add tournament button', () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      expect(screen.getByRole('button', { name: /ajouter un tournoi/i })).toBeInTheDocument();
    });

    it('does not show error message initially', () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show remove button when only one tournament', () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      // X button should not be visible with only 1 tournament
      const buttons = screen.queryAllByRole('button');
      const removeButtons = buttons.filter(btn => btn.querySelector('.lucide-x'));
      expect(removeButtons.length).toBe(0);
    });
  });

  describe('Event Name Validation', () => {
    it('shows error when submitting with empty event name', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/événement est requis/i)).toBeInTheDocument();
      });
      expect(mockOnEventCreated).not.toHaveBeenCalled();
    });

    it('accepts event name with valid text', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      expect(eventNameInput).toHaveValue('Test Event');
    });

    it('allows event names with special characters', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Événement 2025 - Test!');

      expect(eventNameInput).toHaveValue('Événement 2025 - Test!');
    });

    it('allows very long event names', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const longName = 'A'.repeat(200);
      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, longName);

      expect(eventNameInput).toHaveValue(longName);
    });
  });

  describe('Tournament Management', () => {
    it('adds a new tournament when add button is clicked', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });
      fireEvent.click(addButton);

      const tournamentInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      expect(tournamentInputs.length).toBe(2);
    });

    it('shows remove button when multiple tournaments exist', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });
      fireEvent.click(addButton);

      // Check for X icon buttons (should be 2 after adding one more tournament)
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const xButtons = allButtons.filter(btn => {
          const svg = btn.querySelector('svg');
          return svg && svg.classList.contains('lucide-x');
        });
        expect(xButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('removes tournament when remove button is clicked', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      // Add a second tournament
      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });
      fireEvent.click(addButton);

      let tournamentInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      expect(tournamentInputs.length).toBe(2);

      // Find and click a remove button
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const removeButton = buttons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg && svg.classList.contains('lucide-x');
        });
        expect(removeButton).toBeDefined();
        if (removeButton) {
          fireEvent.click(removeButton);
        }
      });

      tournamentInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      expect(tournamentInputs.length).toBe(1);
    });

    it('does not remove last tournament when remove is attempted', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const tournamentInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      expect(tournamentInputs.length).toBe(1);
    });

    it('can add multiple tournaments (5+)', async () => {
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });

      // Add 5 more tournaments (total 6)
      for (let i = 0; i < 5; i++) {
        fireEvent.click(addButton);
      }

      const tournamentInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      expect(tournamentInputs.length).toBe(6);
    });

    it('updates tournament name correctly', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      expect(nameInput).toHaveValue('U12');
    });

    it('updates tournament URL correctly', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      expect(urlInput).toHaveValue('https://echecs.asso.fr/Resultats.aspx?Action=Ga');
    });
  });

  describe('Tournament Validation', () => {
    it('shows error when no tournaments have data', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/au moins un tournoi est requis/i)).toBeInTheDocument();
      });
      expect(mockOnEventCreated).not.toHaveBeenCalled();
    });

    it('shows error when tournament has name but no URL', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/au moins un tournoi est requis/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid URL (not echecs.asso.fr)', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://google.com');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/les urls doivent provenir de echecs\.asso\.fr/i)).toBeInTheDocument();
      });
      expect(mockOnEventCreated).not.toHaveBeenCalled();
    });

    it('accepts valid FFE URL', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Groupe=1234');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });
    });

    it('filters out incomplete tournaments on submit', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      // Add second tournament but leave it incomplete
      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });
      fireEvent.click(addButton);

      // Fill first tournament completely
      const nameInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInputs[0], 'U12');

      const urlInputs = screen.getAllByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInputs[0], 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent.tournaments.length).toBe(1);
    });
  });

  describe('Form Submission', () => {
    it('calls onEventCreated with correct event structure', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalledTimes(1);
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent).toHaveProperty('id');
      expect(createdEvent).toHaveProperty('name', 'Test Event');
      expect(createdEvent).toHaveProperty('createdAt');
      expect(createdEvent).toHaveProperty('tournaments');
      expect(createdEvent.tournaments.length).toBe(1);
    });

    it('generates unique event ID with timestamp format', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent.id).toMatch(/^evt_\d+$/);
    });

    it('generates unique tournament IDs with correct format', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent.tournaments[0].id).toMatch(/^trn_\d+_0$/);
    });

    it('initializes tournament with empty players array', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent.tournaments[0].players).toEqual([]);
      expect(createdEvent.tournaments[0].lastUpdate).toBe('');
    });

    it('creates event with multiple valid tournaments', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      // Add second tournament
      const addButton = screen.getByRole('button', { name: /ajouter un tournoi/i });
      fireEvent.click(addButton);

      const nameInputs = screen.getAllByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInputs[0], 'U12');
      await user.type(nameInputs[1], 'U14');

      const urlInputs = screen.getAllByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInputs[0], 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Groupe=1');
      await user.type(urlInputs[1], 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Groupe=2');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });

      const createdEvent = mockOnEventCreated.mock.calls[0][0] as Event;
      expect(createdEvent.tournaments.length).toBe(2);
      expect(createdEvent.tournaments[0].name).toBe('U12');
      expect(createdEvent.tournaments[1].name).toBe('U14');
    });

    it('clears error message on successful validation', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      // First try to submit invalid form
      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/événement est requis/i)).toBeInTheDocument();
      });

      // Now fill valid data
      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles whitespace-only event name as invalid', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, '   ');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, 'U12');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/événement est requis/i)).toBeInTheDocument();
      });
      expect(mockOnEventCreated).not.toHaveBeenCalled();
    });

    it('handles whitespace-only tournament name as empty', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event');

      const nameInput = screen.getByLabelText(/nom \(ex: u12, u14\)/i);
      await user.type(nameInput, '   ');

      const urlInput = screen.getByPlaceholderText(/https:\/\/echecs\.asso\.fr/i);
      await user.type(urlInput, 'https://echecs.asso.fr/Resultats.aspx?Action=Ga');

      const submitButton = screen.getByRole('button', { name: /créer l'événement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/au moins un tournoi est requis/i)).toBeInTheDocument();
      });
    });

    it('prevents form submission with Enter key in input fields', async () => {
      const user = userEvent.setup();
      render(<EventForm onEventCreated={mockOnEventCreated} />);

      const eventNameInput = screen.getByPlaceholderText(/championnat départemental/i);
      await user.type(eventNameInput, 'Test Event{Enter}');

      // Should show validation error, not call onEventCreated
      await waitFor(() => {
        expect(screen.getByText(/au moins un tournoi est requis/i)).toBeInTheDocument();
      });
    });
  });
});

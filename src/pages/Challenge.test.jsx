import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Challenge from './Challenge';
import { useGameState } from '../hooks/useGameState';
import { BrowserRouter } from 'react-router-dom';

// Mock do hook useGameState
vi.mock('../hooks/useGameState');

// Mock do hook useParams e useNavigate do react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
  };
});

describe('Challenge Component', () => {
  const mockSubmitAnswer = vi.fn();
  
  const mockGameState = {
    teamName: 'Equipe Teste',
    attempts: {},
    submitAnswer: mockSubmitAnswer,
    totalPoints: 10,
    completedCount: 5,
    questoes: [
      { numero: 1, enunciado: 'Questão 1', resposta: 'A' }
    ]
  };

  beforeEach(() => {
    useGameState.mockReturnValue(mockGameState);
    mockSubmitAnswer.mockClear();
  });

  test('renderiza os 5 botões de múltipla escolha', () => {
    render(
      <BrowserRouter>
        <Challenge />
      </BrowserRouter>
    );
    
    ['A', 'B', 'C', 'D', 'E'].forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  test('seleção única: apenas um botão ativo por vez', () => {
    render(
      <BrowserRouter>
        <Challenge />
      </BrowserRouter>
    );
    
    const buttonA = screen.getByText('A');
    const buttonB = screen.getByText('B');

    // Clica em A
    fireEvent.click(buttonA);
    expect(buttonA).toHaveClass('bg-accent-blue');
    expect(buttonB).not.toHaveClass('bg-accent-blue');

    // Clica em B (deve desmarcar A)
    fireEvent.click(buttonB);
    expect(buttonB).toHaveClass('bg-accent-blue');
    expect(buttonA).not.toHaveClass('bg-accent-blue');
  });

  test('botão de envio desabilitado sem seleção', () => {
    render(
      <BrowserRouter>
        <Challenge />
      </BrowserRouter>
    );
    
    const submitButton = screen.getByText(/Enviar/i, { selector: 'button[type="submit"]' });
    expect(submitButton).toBeDisabled();
    
    // Seleciona uma opção
    fireEvent.click(screen.getByText('C'));
    expect(submitButton).not.toBeDisabled();
  });

  test('armazena e envia a resposta correta ao submeter', async () => {
    render(
      <BrowserRouter>
        <Challenge />
      </BrowserRouter>
    );
    
    // Seleciona D
    fireEvent.click(screen.getByText('D'));
    
    // Envia
    const submitButton = screen.getByText(/Enviar/i, { selector: 'button[type="submit"]' });
    fireEvent.click(submitButton);

    expect(mockSubmitAnswer).toHaveBeenCalledWith(1, 'D');
  });

  test('tratamento de cliques múltiplos (mudança de decisão antes do envio)', () => {
    render(
      <BrowserRouter>
        <Challenge />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('A'));
    fireEvent.click(screen.getByText('C')); // Mudou de ideia
    
    const submitButton = screen.getByText(/Enviar/i, { selector: 'button[type="submit"]' });
    fireEvent.click(submitButton);

    // Deve enviar apenas a última seleção
    expect(mockSubmitAnswer).toHaveBeenCalledWith(1, 'C');
    expect(mockSubmitAnswer).toHaveBeenCalledTimes(1);
  });
});

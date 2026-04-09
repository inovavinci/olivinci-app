import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useGameState } from '../hooks/useGameState';
import Header from '../components/Header';

export default function Challenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teamName, attempts, submitAnswer, totalPoints, completedCount, questoes } = useGameState();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const challengeId = Number(id);
  
  // Buscar questão dinâmica do estado
  // Supondo que questoes é array de objetos { numero, componente, enunciado, imagem, resposta }
  const challenge = questoes.find(q => q.numero == challengeId || q.id == challengeId) || questoes[challengeId - 1];
  
  const attempt = attempts[challengeId];

  useEffect(() => {
    // Se não tiver questões carregadas ainda, pode ser loading ou erro
    // Mas se tiver e não achar o desafio, volta
    if (questoes.length > 0 && !challenge) {
      navigate('/dashboard');
    }
  }, [challenge, navigate, questoes]);

  if (!challenge) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-primary font-bold animate-pulse">Carregando desafio...</div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Por favor, digite uma resposta.');
      return;
    }
    submitAnswer(challengeId, answer);
  };

  const getStatusDisplay = () => {
    if (!attempt) return null;
    
    switch (attempt.status) {
      case 'correct':
        return (
          <div className="bg-accent-green/10 border-2 border-accent-green p-6 rounded-2xl mb-8 animate-fade-in">
            <div className="flex flex-col items-center text-accent-green mb-2">
              <CheckCircle size={48} className="mb-2" />
              <h3 className="text-2xl font-black uppercase">Resposta Correta!</h3>
            </div>
            <p className="text-accent-green font-bold text-lg">+1 Ponto</p>
          </div>
        );
      case 'wrong':
        return (
          <div className="bg-accent-red/10 border-2 border-accent-red p-6 rounded-2xl mb-8 animate-fade-in">
            <div className="flex flex-col items-center text-accent-red mb-2">
              <XCircle size={48} className="mb-2" />
              <h3 className="text-2xl font-black uppercase">Resposta Incorreta</h3>
            </div>
            <p className="text-accent-red font-bold text-lg">-3 Pontos</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-primary flex flex-col">
      <Header teamName={teamName} points={totalPoints} completedCount={completedCount} showBack={true} />

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-primary/10 max-w-2xl w-full text-center relative overflow-hidden">
          
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-orange/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-sm font-bold text-accent-blue uppercase tracking-widest">
                Desafio #{id}
              </h1>
              {challenge.componente && (
                <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                  {challenge.componente}
                </span>
              )}
            </div>
            
            {!attempt && (
              <div className="flex justify-center space-x-4 mb-8 text-xs font-bold uppercase tracking-wider">
                <span className="bg-accent-green/10 text-accent-green px-3 py-1 rounded-full border border-accent-green/30">Acerto: +1</span>
                <span className="bg-accent-red/10 text-accent-red px-3 py-1 rounded-full border border-accent-red/30">Erro: -3</span>
              </div>
            )}

            {/* Imagem do desafio */}
            {challenge.imagem && (
              <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-100">
                <img 
                  src={challenge.imagem} 
                  alt="Imagem do desafio" 
                  className="w-full h-auto object-cover max-h-64"
                  onError={(e) => e.target.style.display = 'none'} 
                />
              </div>
            )}

            {/* CONFIGURAÇÃO DO ENUNCIADO: Altere as classes abaixo para mudar o estilo do texto da pergunta */}
            <h2 className="text-lg md:text-xl font-semibold mb-8 text-primary text-left leading-tight whitespace-pre-line">
              {challenge.enunciado || challenge.question || "Carregando pergunta..."}
            </h2>
            
            {getStatusDisplay()}

            {!attempt ? (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
                
                {/* Seletor de Múltipla Escolha - Formato de Linhas */}
                <div className="flex flex-col gap-3 mb-2 text-left">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const itemKey = `item${option}`;
                    const itemText = challenge[itemKey];
                    
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAnswer(option);
                          setError('');
                        }}
                        className={`
                          flex items-center p-4 rounded-xl transition-all duration-200 border-2 shadow-sm
                          ${answer === option 
                            ? 'bg-accent-blue text-white border-accent-blue shadow-md transform scale-[1.02] z-10' 
                            : 'bg-gray-50 text-primary border-gray-200 hover:border-accent-blue/50 hover:bg-blue-50'
                          }
                        `}
                        aria-label={`Selecionar alternativa ${option}`}
                        aria-pressed={answer === option}
                      >
                        <span className={`
                          flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl mr-4
                          ${answer === option ? 'bg-white text-accent-blue' : 'bg-primary/10 text-primary'}
                        `}>
                          {option}
                        </span>
                        <span className="font-semibold text-base leading-snug">
                          {itemText || `Alternativa ${option}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {error && <p className="text-accent-red text-sm font-bold animate-pulse">{error}</p>}
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!answer}
                    className={`
                      w-full font-black py-4 px-8 rounded-xl shadow-lg transition-all duration-200 uppercase tracking-widest
                      ${!answer 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' 
                        : 'bg-accent-orange hover:bg-yellow-400 text-primary-dark transform hover:scale-105'
                      }
                    `}
                  >
                    Enviar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-6">
                  <span className="text-sm font-bold text-gray-500 uppercase block mb-1">Sua Resposta</span>
                  <span className="text-3xl font-black text-primary">{attempt.userAnswer || 'Respondido'}</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 uppercase tracking-widest"
                >
                  Voltar para Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useGameState } from '../hooks/useGameState';
import Header from '../components/Header';

export default function Dashboard() {
  const navigate = useNavigate();
  const { teamName, attempts, totalPoints, completedCount, questoes, timeLeft, formatTime, isTimeUp } = useGameState();

  useEffect(() => {
    if (!localStorage.getItem('teamName')) {
      navigate('/');
    }
  }, [navigate]);

  const challenges = Array.from({ length: 20 }, (_, i) => i + 1);

  const getCardStatus = (id) => {
    const attempt = attempts[id];
    if (!attempt) return { 
      color: 'bg-white', 
      border: 'border-2 border-primary/20', 
      icon: null, 
      text: 'text-primary/30',
      hover: 'hover:border-accent-orange hover:shadow-lg hover:-translate-y-1',
      disabled: false
    };
    
    // Se já respondeu, retorna o status e bloqueia (disabled: true é lógico, o link é removido abaixo)
    switch (attempt.status) {
      case 'correct':
        return { 
          color: 'bg-accent-green', 
          border: 'border-2 border-accent-green', 
          icon: <CheckCircle className="text-white" size={24} />,
          text: 'text-white',
          hover: 'cursor-default',
          disabled: true
        };
      case 'wrong':
        return { 
          color: 'bg-accent-red', 
          border: 'border-2 border-accent-red', 
          icon: <XCircle className="text-white" size={24} />,
          text: 'text-white',
          hover: 'cursor-default',
          disabled: true
        };
      default:
        return { 
          color: 'bg-white', 
          border: 'border-2 border-primary/20', 
          icon: null, 
          text: 'text-primary/30', 
          hover: 'hover:border-accent-orange hover:shadow-lg hover:-translate-y-1',
          disabled: false
        };
    }
  };

  return (
    <div className="min-h-screen bg-white text-primary flex flex-col">
      <Header 
        teamName={teamName} 
        points={totalPoints} 
        completedCount={completedCount} 
        timeLeft={timeLeft}
        formatTime={formatTime}
        isTimeUp={isTimeUp}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <h2 className="text-3xl font-black text-primary mb-8 text-center uppercase tracking-widest">
          Grade de Desafios
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {challenges.map((id) => {
            const status = getCardStatus(id);
            const isCompleted = !!attempts[id];
            
            // Encontrar disciplina correspondente
            const question = questoes.find(q => q.numero == id || q.id == id) || questoes[id - 1];
            const disciplina = question ? (question.componente || question.disciplina || '') : '';
            
            // Se estiver completado, renderiza div em vez de Link para bloquear clique
            const CardContent = (
              <div className={`
                  group relative aspect-square flex flex-col items-center justify-center 
                  rounded-2xl transition-all duration-300
                  ${status.color} ${status.border} ${status.hover}
                `}>
                <span className={`
                  text-5xl font-black transition-colors duration-300
                  ${status.text} ${!isCompleted && 'group-hover:text-accent-orange'}
                `}>
                  {id}
                </span>

                {/* Exibir Disciplina */}
                 {disciplina && (
                    <span className={`
                      absolute top-2 left-3 right-8 text-left text-[10px] font-bold uppercase tracking-wider truncate
                      ${isCompleted ? 'text-white/90' : 'text-primary/40'}
                    `}>
                      {disciplina}
                    </span>
                 )}
                
                {status.icon && (
                  <div className="absolute top-2 right-2">
                    {status.icon}
                  </div>
                )}

                {attempts[id] && (
                   <div className="absolute bottom-2 font-bold text-sm text-white/90">
                     {attempts[id].points > 0 ? '+' : ''}{attempts[id].points} pts
                   </div>
                )}
                
                {!isCompleted && (
                  <div className="absolute inset-0 rounded-2xl flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-bold text-accent-orange uppercase tracking-widest bg-white px-2 py-1 rounded-full shadow-sm border border-accent-orange/20">
                      Iniciar
                    </span>
                  </div>
                )}
              </div>
            );

            return (isCompleted || isTimeUp) ? (
              <div key={id} className="cursor-default">{CardContent}</div>
            ) : (
              <Link key={id} to={`/desafio/${id}`}>
                {CardContent}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

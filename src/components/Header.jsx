import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Leaderboard from './Leaderboard';

export default function Header({ teamName, points, completedCount, showBack = false }) {
  const navigate = useNavigate();
  const [pointsClass, setPointsClass] = useState('');
  const prevPointsRef = useRef(points);
  const [clicks, setClicks] = useState(0);
  const clickTimeoutRef = useRef(null);

  const handleSecretClick = () => {
    setClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        navigate('/admin');
        return 0;
      }
      return next;
    });
    
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setClicks(0), 1000);
  };
  
  useEffect(() => {
    if (prevPointsRef.current !== undefined && prevPointsRef.current !== points) {
      if (points > prevPointsRef.current) {
        setPointsClass('bg-accent-green text-white scale-110 shadow-lg');
      } else if (points < prevPointsRef.current) {
        setPointsClass('bg-accent-red text-white scale-110 shadow-lg');
      }
      const timer = setTimeout(() => setPointsClass(''), 500);
      prevPointsRef.current = points;
      return () => clearTimeout(timer);
    }
    prevPointsRef.current = points;
  }, [points]);

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {showBack && (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div 
            className="flex flex-col cursor-pointer select-none" 
            onClick={handleSecretClick}
          >
            <span className="text-xs font-bold text-accent-blue uppercase tracking-wider">Equipe</span>
            <span className="text-lg font-black text-white">{teamName || 'Convidado'}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-1">Total de Pontos</span>
          <div className="flex items-center space-x-3">
            <div className={`
              px-6 py-2 rounded-xl flex items-center justify-center transition-all duration-500 ease-out border border-white/20 min-w-[100px]
              ${pointsClass || 'bg-white/10'}
            `}>
              <span className={`text-2xl font-black transition-colors duration-300 ${pointsClass ? 'text-white' : 'text-accent-orange'}`}>
                {points}
              </span>
            </div>
            <span className="text-xs text-white/70 font-medium whitespace-nowrap hidden sm:inline">
              ({completedCount}/24 concluídos)
            </span>
          </div>
        </div>
      </div>
      
      {/* Barra de Leaderboard */}
      <div className="w-full bg-primary-dark/50 border-t border-white/10 px-4 py-1 overflow-x-auto">
        <Leaderboard />
      </div>
    </header>
  );
}

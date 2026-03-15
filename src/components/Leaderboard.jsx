// src/components/Leaderboard.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();

  if (isLoading) return <div className="text-white text-xs animate-pulse">Carregando placar...</div>;
  if (leaderboard.length === 0) return null;

  // Pegar apenas os top 5 para exibir no header (ou todos se couber)
  // Vamos exibir horizontalmente com scroll se necessário
  
  return (
    <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar py-2 px-2 w-full">
      <AnimatePresence>
        {leaderboard.map((team, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          
          let bgColor = 'bg-white/10';
          let textColor = 'text-white';
          let icon = null;

          if (isFirst) {
            bgColor = 'bg-accent-orange text-primary-dark shadow-lg shadow-accent-orange/20';
            textColor = 'text-primary-dark';
            icon = <Trophy size={14} className="mr-1" />;
          } else if (isSecond) {
            bgColor = 'bg-gray-300 text-gray-800';
            textColor = 'text-gray-800';
            icon = <Medal size={14} className="mr-1" />;
          } else if (isThird) {
            bgColor = 'bg-orange-200 text-orange-900';
            textColor = 'text-orange-900';
            icon = <Medal size={14} className="mr-1" />;
          }

          return (
            <motion.div
              key={team.name}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`
                flex items-center px-3 py-1.5 rounded-lg whitespace-nowrap min-w-fit
                ${bgColor} border border-white/10 backdrop-blur-sm
              `}
            >
              <span className="font-bold text-xs mr-2 flex items-center">
                {icon}
                #{index + 1}
              </span>
              <span className={`font-black text-sm mr-2 uppercase ${textColor}`}>
                {team.name}
              </span>
              <span className={`font-bold text-xs ${isFirst ? 'bg-white/20' : 'bg-black/10'} px-1.5 rounded`}>
                {team.points} pts
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

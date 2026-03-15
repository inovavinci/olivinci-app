// src/hooks/useLeaderboard.js
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar cache inicial
    const cachedLeaderboard = localStorage.getItem('leaderboard');
    if (cachedLeaderboard) {
      try {
        setLeaderboard(JSON.parse(cachedLeaderboard));
        setIsLoading(false);
      } catch (e) {
        console.error('Erro ao ler cache do Leaderboard:', e);
      }
    }

    const fetchLeaderboard = async () => {
      // Ler unidade, série e nome da equipe do localStorage
      const storedUnidade = localStorage.getItem('unidade');
      const storedSerie = localStorage.getItem('serie');
      const storedTeam = localStorage.getItem('teamName');

      if (!storedUnidade || !storedSerie) {
        setIsLoading(false);
        return;
      }

      try {
        // Agora usamos getData que suporta filtros e retorna { questoes: [], equipes: [] }
        const data = await api.getData(storedUnidade, storedSerie);
        
        // Extrair equipes do objeto retornado
        const teams = data.equipes || [];
        
        if (teams.length === 0) {
          setIsLoading(false);
          return;
        }

        // Tentar ler estado local da equipe atual para merge (sincronização instantânea)
        let localTeamData = null;
        if (storedTeam) {
          try {
            const cachedGameState = localStorage.getItem(`gameState_${storedTeam}`);
            if (cachedGameState) {
              localTeamData = JSON.parse(cachedGameState);
            }
          } catch (e) { console.error('Erro ao ler gameState local:', e); }
        }

        // Calcular pontos para cada equipe
        const teamsWithPoints = teams.map(team => {
          // Normalizar nome da equipe
          const name = team['Equipe'] || team['equipe'] || team['Nome'] || 'Desconhecido';
          
          // Se for a equipe atual e tivermos dados locais, usar a pontuação local (otimista)
          if (localTeamData && name === storedTeam && localTeamData.totalPoints !== undefined) {
             return {
               name,
               points: localTeamData.totalPoints,
               completed: Object.keys(localTeamData.attempts || {}).length, // Aproximação
               isLocal: true // Flag de debug
             };
          }

          // Caso contrário, calcular baseado na planilha
          let points = 0;
          let completed = 0;
          
          // Iterar de 1 a 24
          for (let i = 1; i <= 24; i++) {
            const status = team[`d${i}`];
            if (status) {
              if (status === 'CORRETO') points += 1;
              else if (status === 'ERRADO') points -= 3;
              // 'BRANCO' ou 'PULADO' = 0 pontos
              
              if (status !== '') completed++;
            }
          }
          
          return {
            name,
            points,
            completed
          };
        });

        // Ordenar por pontos (decrescente)
        const sortedTeams = teamsWithPoints.sort((a, b) => b.points - a.points);
        
        // Atualizar estado e cache apenas se mudou
        // Usar JSON.stringify pode ser caro, mas para listas pequenas (<100) é ok
        if (JSON.stringify(sortedTeams) !== JSON.stringify(leaderboard)) {
          console.log('Leaderboard atualizado (com merge local):', sortedTeams);
          setLeaderboard(sortedTeams);
          localStorage.setItem('leaderboard', JSON.stringify(sortedTeams));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
      }
    };

    // Primeira chamada (stale-while-revalidate)
    fetchLeaderboard();
    
    // Polling a cada 5s para refletir mudanças locais mais rápido se o usuário interagir
    // Idealmente seria ouvir evento 'storage', mas polling mais curto também resolve o "quase tempo real"
    const interval = setInterval(fetchLeaderboard, 5000); 

    return () => clearInterval(interval);
  }, []); // Dependência vazia ok pois unidade/serie vem do localStorage

  return { leaderboard, isLoading };
}

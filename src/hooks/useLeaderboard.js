import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const periodId = localStorage.getItem('periodId');
      const unitId = localStorage.getItem('unitId');
      const gradeId = localStorage.getItem('gradeId');

      if (!periodId || !unitId || !gradeId) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Buscar todas as turmas que competem juntas (mesmo período, unidade e série)
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('period_id', periodId)
          .eq('unit_id', unitId)
          .eq('grade_id', gradeId);

        if (classError) throw classError;
        if (!classes || classes.length === 0) {
          setLeaderboard([]);
          setIsLoading(false);
          return;
        }

        const classIds = classes.map(c => c.id);

        // 2. Buscar as equipes dessas turmas
        const { data: teams, error: teamError } = await supabase
          .from('teams')
          .select('id, name, class_id')
          .in('class_id', classIds);

        if (teamError) throw teamError;
        if (!teams || teams.length === 0) {
          setLeaderboard([]);
          setIsLoading(false);
          return;
        }

        const teamIds = teams.map(t => t.id);

        // 3. Buscar a soma de pontos de cada equipe diretamente
        const { data: answers, error: answerError } = await supabase
          .from('answers')
          .select('team_id, points')
          .in('team_id', teamIds);

        if (answerError) throw answerError;

        // 4. Calcular o placar consolidado
        const scores = teams.map(team => {
          const teamPoints = answers
            .filter(a => a.team_id === team.id)
            .reduce((acc, curr) => acc + (curr.points || 0), 0);
          
          return {
            id: team.id,
            name: team.name,
            points: teamPoints
          };
        });

        // 5. Ordenar por pontos (descendente)
        const sorted = scores.sort((a, b) => b.points - a.points);
        
        setLeaderboard(sorted);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    // Atualiza a cada 15 segundos para não sobrecarregar o banco mas manter o "tempo real"
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return { leaderboard, isLoading };
}

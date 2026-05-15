import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

export default function Ranking() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [units, setUnits] = useState([]);
  const [grades, setGrades] = useState([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const p = await api.getPeriods();
      const u = await api.getUnits();
      const g = await api.getGrades();
      
      setPeriods(p);
      setUnits(u);
      setGrades(g);
      
      if (p.length > 0) setSelectedPeriod(p[0]);
      if (u.length > 0) setSelectedUnit(u[0]);
      if (g.length > 0) setSelectedGrade(g[0]);
    } catch (err) {
      setError('Erro ao carregar filtros');
    }
  };

  const fetchRanking = async () => {
    if (!selectedPeriod || !selectedUnit || !selectedGrade) return;

    try {
      // 1. Buscar todas as turmas que dão match com os filtros
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('period_id', selectedPeriod.id)
        .eq('unit_id', selectedUnit.id)
        .eq('grade_id', selectedGrade.id);

      if (classError) throw classError;

      const classIds = classes.map(c => c.id);
      if (classIds.length === 0) {
        setRanking([]);
        return;
      }

      // 2. Buscar equipes dessas turmas
      const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id, name, class_id')
        .in('class_id', classIds);

      if (teamError) throw teamError;

      const teamIds = teams.map(t => t.id);
      if (teamIds.length === 0) {
        setRanking([]);
        return;
      }

      // 3. Buscar todas as respostas dessas equipes
      const { data: answers, error: answerError } = await supabase
        .from('answers')
        .select('team_id, points')
        .in('team_id', teamIds);

      if (answerError) throw answerError;

      // 4. Calcular pontuação por equipe
      const teamScores = teams.map(team => {
        const teamAnswers = answers.filter(a => a.team_id === team.id);
        const totalPoints = teamAnswers.reduce((sum, a) => sum + (a.points || 0), 0);
        const className = classes.find(c => c.id === team.class_id)?.name || '';
        return {
          id: team.id,
          name: `${team.name} (${className})`,
          points: totalPoints
        };
      });

      // 5. Ordenar
      const sortedRanking = teamScores.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
      });

      setRanking(sortedRanking);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      setError('Falha ao atualizar o ranking.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod && selectedUnit && selectedGrade) {
      setIsLoading(true);
      fetchRanking();
      const interval = setInterval(fetchRanking, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedPeriod, selectedUnit, selectedGrade]);

  return (
    <div className="min-h-screen bg-gray-50 text-primary flex flex-col">
      <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Trophy className="text-accent-orange" size={24} />
            <h1 className="text-xl font-black uppercase tracking-widest">Ranking Oficial</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        {/* Filtros */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Calendar size={14} className="mr-1" /> Período
              </label>
              <select 
                value={selectedPeriod?.id}
                onChange={(e) => setSelectedPeriod(periods.find(p => p.id === e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-primary focus:outline-none focus:border-accent-orange"
              >
                {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Unidade */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
              <div className="flex gap-2">
                {units.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUnit(u)}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                      selectedUnit?.id === u.id ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {u.name.toUpperCase().slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Série */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Série</label>
              <select 
                value={selectedGrade?.id}
                onChange={(e) => setSelectedGrade(grades.find(g => g.id === e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-primary focus:outline-none focus:border-accent-orange"
              >
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 space-y-4">
              <Loader2 size={48} className="animate-spin text-primary/20" />
              <p className="font-bold text-primary/30">Atualizando classificação...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center text-red-500 font-bold">
              <AlertCircle className="mx-auto mb-2" size={32} />
              {error}
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest">
              Nenhuma equipe encontrada
            </div>
          ) : (
            ranking.map((team, index) => (
              <div 
                key={team.id}
                className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200 shadow-md' : 'bg-white border-transparent'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}º
                  </div>
                  <span className="font-bold text-lg text-primary">{team.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`font-black text-xl ${index === 0 ? 'text-yellow-600' : 'text-primary'}`}>
                    {team.points} <span className="text-[10px] uppercase opacity-50">pts</span>
                  </span>
                  {index === 0 && <Trophy className="text-yellow-400" size={24} />}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

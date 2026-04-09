import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Ranking() {
  const navigate = useNavigate();
  const [unidade, setUnidade] = useState('S');
  const [serie, setSerie] = useState('1');
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Função para buscar e calcular o ranking
  const fetchRanking = async () => {
    try {
      // Não ativamos isLoading no polling para não piscar a tela
      // Apenas na primeira carga ou mudança de filtro
      
      const data = await api.getData(unidade, serie);
      
      if (!data || !data.equipes) {
        throw new Error('Dados inválidos recebidos da API');
      }

      const teams = data.equipes;
      
      // Calcular pontos e ordenar
      const teamsWithPoints = teams.map(team => {
        const name = team['Equipe'] || team['equipe'] || team['Nome'] || 'Desconhecido';
        let points = 0;
        
        // Iterar colunas d1 a d20
        for (let i = 1; i <= 20; i++) {
          const status = team[`d${i}`];
          if (status === 'CORRETO') points += 1;
          else if (status === 'ERRADO') points -= 3;
        }
        
        return { name, points };
      });

      // Ordenar: Maior pontuação primeiro
      // Se empate, ordem alfabética
      const sortedTeams = teamsWithPoints.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
      });

      setRanking(sortedTeams);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      setError('Falha ao atualizar o ranking. Tentando novamente...');
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para carregar dados quando mudar filtros
  useEffect(() => {
    setIsLoading(true);
    fetchRanking();
    
    // Polling a cada 10 segundos
    const interval = setInterval(fetchRanking, 10000);
    return () => clearInterval(interval);
  }, [unidade, serie]);

  return (
    <div className="min-h-screen bg-gray-50 text-primary flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Voltar para Home"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center space-x-2">
            <Trophy className="text-accent-orange" size={24} />
            <h1 className="text-xl font-black uppercase tracking-widest">Ranking Oficial</h1>
          </div>
          
          <div className="w-10"></div> {/* Espaçador para centralizar título */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        
        {/* Filtros */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Seletor de Unidade */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Unidade</label>
              <div className="grid grid-cols-3 gap-2">
                {['S', 'N', 'T'].map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnidade(u)}
                    className={`
                      py-3 rounded-xl font-black text-lg transition-all duration-200
                      ${unidade === u 
                        ? 'bg-primary text-white shadow-md transform scale-105' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }
                    `}
                  >
                    {u === 'S' ? 'SUL' : u === 'N' ? 'NORTE' : 'TAG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de Série */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Série</label>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSerie(s)}
                    className={`
                      py-3 rounded-xl font-black text-lg transition-all duration-200
                      ${serie === s 
                        ? 'bg-accent-orange text-primary-dark shadow-md transform scale-105' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }
                    `}
                  >
                    {s}ª Série
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Lista de Ranking */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary/50 space-y-4">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-bold animate-pulse">Carregando classificação...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl text-center">
              <AlertCircle className="mx-auto text-red-400 mb-2" size={32} />
              <p className="text-red-500 font-bold">{error}</p>
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-bold">
              Nenhuma equipe encontrada para esta seleção.
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Atualizado em tempo real
                </span>
              </div>
              
              {ranking.map((team, index) => {
                // Top 3 destaque
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                let rankStyle = "bg-white border border-gray-100 text-gray-600";
                let rankBadge = "bg-gray-100 text-gray-500";
                
                if (isFirst) {
                  rankStyle = "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-md transform scale-[1.02] z-10";
                  rankBadge = "bg-yellow-400 text-yellow-900";
                } else if (isSecond) {
                  rankStyle = "bg-gray-50 border-gray-200";
                  rankBadge = "bg-gray-300 text-gray-700";
                } else if (isThird) {
                  rankStyle = "bg-orange-50/50 border-orange-100";
                  rankBadge = "bg-orange-200 text-orange-800";
                }

                return (
                  <div 
                    key={index}
                    className={`
                      relative p-4 rounded-xl flex items-center justify-between transition-all duration-500 animate-fade-in-up
                      ${rankStyle}
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`
                        w-10 h-10 flex items-center justify-center rounded-full font-black text-lg shadow-sm
                        ${rankBadge}
                      `}>
                        {index + 1}º
                      </div>
                      <span className={`font-bold text-lg ${isFirst ? 'text-primary' : 'text-gray-700'}`}>
                        {team.name}
                      </span>
                    </div>
                    
                    {isFirst && <Trophy className="text-yellow-400 drop-shadow-sm" size={24} />}
                  </div>
                );
              })}
            </>
          )}
        </div>

      </main>
    </div>
  );
}

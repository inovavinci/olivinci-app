import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Loader2, AlertCircle, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function Home() {
  const [unidade, setUnidade] = useState('');
  const [serie, setSerie] = useState('');
  const [accessKey, setAccessKey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e) => {
    e.preventDefault();
    
    if (isLocked) return;

    if (unidade && serie && accessKey.trim()) {
      setIsLoading(true);
      setError('');
      
      try {
        // Busca dados filtrados por unidade e série
        const data = await api.getData(unidade, serie);
        
        console.log('Dados recebidos no Home:', data); // Debug log

        // Verifica se a chave existe na lista de equipes
        if (!data || !data.equipes) {
           throw new Error('Formato de dados inválido recebido da API.');
        }

        // Log das chaves disponíveis para debug
        const availableKeys = data.equipes.map(t => ({
          key: t.chave || t.Chave || t.CHAVE || t.codigo || t.id,
          team: t.equipe || t.Equipe || t.Nome
        }));
        console.log('Chaves disponíveis:', availableKeys);
        console.log('Chave digitada:', accessKey);

        const foundTeam = data.equipes.find(t => {
           // Normalizar chave de entrada
           const inputKey = String(accessKey).trim();
           
           // Tentar encontrar a chave em várias propriedades possíveis
           const teamKey = t.chave || t.Chave || t.CHAVE || t.codigo || t.Codigo || t.id || t.ID || '';
           
           // Comparação flexível
           return String(teamKey).trim() === inputKey;
        });
        
        if (foundTeam) {
          // Sucesso
          const teamName = foundTeam.equipe || foundTeam.Equipe || foundTeam.Nome || foundTeam.name || '';
          
          if (!teamName) {
             console.error('Equipe encontrada mas sem nome:', foundTeam);
             setError('Erro: Equipe encontrada mas nome não identificado.');
             setIsLoading(false);
             return;
          }

          localStorage.setItem('unidade', unidade);
          localStorage.setItem('serie', serie);
          localStorage.setItem('teamName', teamName);
          localStorage.setItem('accessKey', accessKey); // Salvar para usar no POST
          
          navigate('/dashboard');
        } else {
          // Falha
          console.warn('Chave não encontrada na lista.');
          handleLoginError();
        }
      } catch (error) {
        console.error(error);
        setError('Erro ao conectar com o servidor. Verifique o console para detalhes.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Por favor, preencha todos os campos.');
    }
  };

  const handleLoginError = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setIsLocked(true);
      setError('Muitas tentativas inválidas. Aguarde 5 segundos.');
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        setError('');
      }, 5000);
    } else {
      setError('Chave de acesso inválida para esta Unidade/Série.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-primary p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-tr-full pointer-events-none"></div>

        <div className="flex justify-center mb-6 relative z-10">
          <div className="bg-white p-4 rounded-full shadow-lg animate-bounce">
            <Trophy size={48} className="text-accent-orange" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-wider relative z-10">
          Olimpíada Escolar
        </h1>
        <p className="text-white/80 mb-8 font-medium relative z-10">Área de Acesso das Equipes</p>
        
        <form onSubmit={handleStart} className="space-y-4 relative z-10">
          
          {/* Seletor de Unidade */}
          <div className="relative group">
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="w-full bg-white text-primary px-6 py-4 rounded-xl focus:outline-none border-2 border-transparent focus:border-accent-orange appearance-none font-bold text-lg text-center"
              required
              disabled={isLoading || isLocked}
            >
              <option value="" disabled>Selecione a Unidade</option>
              <option value="S">Sul (S)</option>
              <option value="N">Norte (N)</option>
              <option value="T">Taguatinga (T)</option>
            </select>
          </div>

          {/* Seletor de Série */}
          <div className="relative group">
            <select
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className="w-full bg-white text-primary px-6 py-4 rounded-xl focus:outline-none border-2 border-transparent focus:border-accent-orange appearance-none font-bold text-lg text-center"
              required
              disabled={isLoading || isLocked}
            >
              <option value="" disabled>Selecione a Série</option>
              <option value="1">1ª Série</option>
              <option value="2">2ª Série</option>
              <option value="3">3ª Série</option>
            </select>
          </div>

          {/* Input de Chave */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-primary/40" size={20} />
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value);
                if (!isLocked) setError('');
              }}
              placeholder="Chave de Acesso"
              className={`w-full bg-white text-primary placeholder-primary/50 pl-12 pr-6 py-4 rounded-xl focus:outline-none transition-all duration-300 text-lg font-bold text-center border-2
                ${error 
                  ? 'border-accent-red focus:border-accent-red' 
                  : 'border-transparent focus:border-accent-orange'}
                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              required
              disabled={isLoading || isLocked}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-2 text-white bg-accent-red p-3 rounded-lg animate-fade-in shadow-md text-sm font-bold">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || isLocked}
            className={`w-full bg-accent-orange hover:bg-yellow-400 text-primary-dark font-black py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-xl uppercase tracking-widest flex items-center justify-center
              ${(isLoading || isLocked) ? 'opacity-70 cursor-not-allowed transform-none' : ''}
            `}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Acessar Painel'}
          </button>
          
          <div className="pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-3 px-6 rounded-xl border-2 border-white/30 transition-all duration-200 text-lg uppercase tracking-widest flex items-center justify-center group"
            >
              <Trophy className="mr-2 text-yellow-400 group-hover:scale-110 transition-transform" size={20} />
              Ver Ranking Oficial
            </button>
          </div>
        </form>

        <div className="mt-8 relative z-10 text-center">
            <button 
                onClick={() => navigate('/admin')} 
                className="text-white/30 text-xs hover:text-white/60 transition-colors uppercase tracking-widest font-bold"
            >
                Acesso Administrativo
            </button>
        </div>
      </div>
    </div>
  );
}

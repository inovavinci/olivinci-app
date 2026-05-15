import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Loader2, AlertCircle, Lock, ArrowRight, School, MapPin, GraduationCap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useGameState } from '../hooks/GameStateContext';

export default function Home() {
  const [step, setStep] = useState('entry'); // 'entry' | 'confirm'
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingData, setPendingData] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useGameState();

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const classData = await api.getClassByCode(accessCode);
      
      if (!classData) {
        setError('Código de acesso inválido ou expirado.');
        setIsLoading(false);
        return;
      }

      const autoTeamName = `${classData.grades.name} ${classData.name}`;
      const team = await api.getOrCreateTeam(classData.id, autoTeamName);
      
      setPendingData({
        classData,
        team,
        accessCode: accessCode.toUpperCase()
      });
      
      setStep('confirm');
    } catch (err) {
      console.error(err);
      setError('Erro ao validar acesso. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChallenge = async () => {
    if (!pendingData) return;
    
    setIsLoading(true);
    try {
      // Iniciar o cronômetro no banco
      await api.startTeamTimer(pendingData.team.id);

      // Login no contexto
      login({
        classId: pendingData.classData.id,
        teamId: pendingData.team.id,
        teamName: pendingData.team.name,
        unidade: pendingData.classData.units.name,
        unitId: pendingData.classData.unit_id,
        serie: pendingData.classData.grades.name,
        periodId: pendingData.classData.period_id,
        gradeId: pendingData.classData.grade_id,
        accessCode: pendingData.accessCode
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Erro ao iniciar desafio. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-primary p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-tr-full pointer-events-none"></div>

        <div className="flex justify-center mb-6 relative z-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="bg-white p-4 rounded-full shadow-lg"
          >
            <Trophy size={48} className="text-accent-orange" />
          </motion.div>
        </div>

        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-wider relative z-10">
          Olivinci
        </h1>
        <p className="text-white/80 mb-8 font-medium relative z-10">Desafio de Conhecimento</p>

        <AnimatePresence mode="wait">
          {step === 'entry' ? (
            <motion.div
              key="entry-step"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="relative z-10"
            >
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-primary/40" size={20} />
                  </div>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="Código da Turma"
                    className={`w-full bg-white text-primary placeholder-primary/50 pl-12 pr-6 py-4 rounded-xl focus:outline-none transition-all duration-300 text-lg font-bold text-center border-2
                      ${error ? 'border-accent-red' : 'border-transparent focus:border-accent-orange'}
                    `}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center space-x-2 text-white bg-accent-red p-3 rounded-lg shadow-md text-sm font-bold"
                  >
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !accessCode}
                  className={`w-full bg-accent-orange hover:bg-yellow-400 text-primary-dark font-black py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-xl uppercase tracking-widest flex items-center justify-center
                    ${isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''}
                  `}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Entrar no Desafio'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="confirm-step"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="relative z-10"
            >
              <div className="bg-white/10 rounded-2xl p-6 mb-6 text-left border border-white/20 space-y-4">
                <div className="flex items-center space-x-4 text-white">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin size={20} className="text-accent-orange" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Unidade</p>
                    <p className="text-lg font-bold">{pendingData?.classData?.units?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-white">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <GraduationCap size={20} className="text-accent-orange" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Série / Ano</p>
                    <p className="text-lg font-bold">{pendingData?.classData?.grades?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-white">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <School size={20} className="text-accent-orange" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Turma</p>
                    <p className="text-lg font-bold">{pendingData?.classData?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleStartChallenge}
                  disabled={isLoading}
                  className="w-full bg-accent-green hover:bg-green-400 text-white font-black py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-xl uppercase tracking-widest flex items-center justify-center group"
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                    <>
                      Iniciar Desafio
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep('entry')}
                  disabled={isLoading}
                  className="w-full text-white/60 hover:text-white transition-colors text-xs uppercase font-bold flex items-center justify-center py-2"
                >
                  <ArrowLeft size={14} className="mr-1" /> Voltar e alterar código
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'entry' && (
          <div className="mt-8 relative z-10 text-center">
            <button
              onClick={() => navigate('/ranking')}
              className="text-white/40 text-xs hover:text-white/60 transition-colors uppercase tracking-widest font-bold flex items-center justify-center mx-auto"
            >
              <Trophy size={14} className="mr-1" /> Ver Ranking Oficial
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 text-white/20 text-[10px] hover:text-white/40 transition-colors uppercase tracking-widest font-bold block mx-auto"
            >
              Acesso Administrativo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

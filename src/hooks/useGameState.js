// src/hooks/useGameState.js
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export function useGameState() {
  const [unidade, setUnidade] = useState('');
  const [serie, setSerie] = useState('');
  const [teamName, setTeamName] = useState('');
  
  const [questoes, setQuestoes] = useState([]);
  const [attempts, setAttempts] = useState({}); 
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerDuration, setTimerDuration] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
  const prevPointsRef = useRef(0);

  // Carregar dados iniciais do localStorage
  useEffect(() => {
    const storedUnidade = localStorage.getItem('unidade');
    const storedSerie = localStorage.getItem('serie');
    const storedTeam = localStorage.getItem('teamName');
    
    if (storedUnidade) setUnidade(storedUnidade);
    if (storedSerie) setSerie(storedSerie);
    if (storedTeam) setTeamName(storedTeam);

    // Tentar carregar cache de questões
    const cachedQuestoes = localStorage.getItem(`questoes_${storedUnidade}_${storedSerie}`);
    if (cachedQuestoes) {
      try {
        setQuestoes(JSON.parse(cachedQuestoes));
      } catch(e) { console.error('Cache questoes error', e); }
    }

    // Tentar carregar cache do estado do jogo
    if (storedTeam) {
      const cachedGameState = localStorage.getItem(`gameState_${storedTeam}`);
      if (cachedGameState) {
        try {
          const parsed = JSON.parse(cachedGameState);
          setAttempts(parsed.attempts || {});
          setTotalPoints(parsed.totalPoints || 0);
          prevPointsRef.current = parsed.totalPoints || 0;
        } catch(e) { console.error('Cache gameState error', e); }
      }
      
      // Carregar cache do Timer
      const cachedTimeLeft = localStorage.getItem(`timer_${storedTeam}`);
      if (cachedTimeLeft) {
        setTimeLeft(parseInt(cachedTimeLeft));
      }
    }
  }, []);

  // Polling para sincronizar com a planilha a cada 10 segundos
  useEffect(() => {
    if (!teamName || !unidade || !serie) return;

    const fetchData = async () => {
      try {
        // Agora buscamos dados filtrados por unidade e série
        const data = await api.getData(unidade, serie);
        
        // VERIFICAÇÃO DE RESET REMOTO (Sincronização de exclusão)
        if (data.lastReset) {
          const localLastReset = parseInt(localStorage.getItem('lastResetTimestamp') || '0');
          // Se o timestamp do servidor for maior que o local, houve um reset
          if (data.lastReset > localLastReset) {
             console.warn('Reset remoto detectado. Sincronizando progresso...');
             
             // Limpeza seletiva: remove apenas o estado do jogo, mantém login (unidade, serie, teamName)
             localStorage.removeItem(`gameState_${teamName}`);
             localStorage.setItem('lastResetTimestamp', String(data.lastReset));
             
             // Zerar o estado local para atualizar a UI instantaneamente sem precisar de reload
             setAttempts({});
             setTotalPoints(0);
             prevPointsRef.current = 0;
             
             console.log('Reset silencioso concluído. O usuário permanece no painel.');
          }
        }

        if (data.questoes && data.questoes.length > 0) {
          setQuestoes(data.questoes);
          localStorage.setItem(`questoes_${unidade}_${serie}`, JSON.stringify(data.questoes));
        }

        // Processar Timer Duration (HH:MM:SS para segundos)
        if (data.timerDuration && !timerDuration) {
          const [h, m, s] = data.timerDuration.split(':').map(Number);
          const totalSeconds = (h * 3600) + (m * 60) + s;
          setTimerDuration(totalSeconds);
          
          // Se não tiver timeLeft no cache, inicializa com o total
          if (timeLeft === null) {
            setTimeLeft(totalSeconds);
            localStorage.setItem(`timer_${teamName}`, String(totalSeconds));
          }
        }

        // Encontrar a equipe do usuário na lista retornada
        const myTeam = data.equipes.find(t => 
          t['equipe'] === teamName || t['Equipe'] === teamName || t['Nome'] === teamName
        );

        if (myTeam) {
          const newAttempts = {};
          let newPoints = 0;

          // Processar colunas d1 até d20
          for (let i = 1; i <= 20; i++) {
            const status = myTeam[`d${i}`];
            if (status) {
              let points = 0;
              let attemptStatus = '';

              if (status === 'CORRETO') {
                points = 1;
                attemptStatus = 'correct';
              } else if (status === 'ERRADO') {
                points = -3;
                attemptStatus = 'wrong';
              }

              if (attemptStatus) {
                newAttempts[i] = { status: attemptStatus, points };
                newPoints += points;
              }
            }
          }

          // MERGE INTELIGENTE: Combinar dados da planilha com cache local
          // Se o cache tiver algo que a planilha não tem (ainda), manter o cache (preservar update otimista)
          // Se a planilha tiver algo novo, aceitar a planilha
          const mergedAttempts = { ...attempts }; // Começa com o local
          let hasChanges = false;

          // Limpeza de status 'skipped' (legado)
          Object.keys(mergedAttempts).forEach(key => {
            if (mergedAttempts[key].status === 'skipped') {
              delete mergedAttempts[key];
              hasChanges = true;
            }
          });

          Object.keys(newAttempts).forEach(key => {
            // Se a planilha tem dado e é diferente do local, ou o local não tem
            if (!mergedAttempts[key] || mergedAttempts[key].status !== newAttempts[key].status) {
               // Preservar a resposta do usuário (userAnswer) se já existir localmente, pois a API só retorna status
               const localAnswer = mergedAttempts[key]?.userAnswer;
               mergedAttempts[key] = { ...newAttempts[key] };
               if (localAnswer) {
                 mergedAttempts[key].userAnswer = localAnswer;
               }
               hasChanges = true;
            }
          });
          
          // Se houve mudança real vinda do servidor, atualizar
          if (hasChanges) {
            const calculatedPoints = Object.values(mergedAttempts).reduce((acc, curr) => acc + (curr.points || 0), 0);
            
            setAttempts(mergedAttempts);
            setTotalPoints(calculatedPoints);
            
            localStorage.setItem(`gameState_${teamName}`, JSON.stringify({
              attempts: mergedAttempts,
              totalPoints: calculatedPoints,
              timestamp: Date.now()
            }));

            // Tocar som se pontos aumentaram
            if (calculatedPoints > prevPointsRef.current) {
              audioRef.current.play().catch(e => console.log('Erro som:', e));
            }
            prevPointsRef.current = calculatedPoints;
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    };

    fetchData(); // Primeira chamada
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [teamName, unidade, serie, timerDuration, timeLeft]); // Dependências do efeito

  // Efeito do Cronômetro
  useEffect(() => {
    if (timeLeft === null || isTimeUp || isTimerPaused) return;

    if (timeLeft <= 0) {
      setIsTimeUp(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        localStorage.setItem(`timer_${teamName}`, String(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimeUp, isTimerPaused, teamName]);

  // Efeito para Salvar Tempo ao Finalizar (20 desafios)
  useEffect(() => {
    const completedCount = Object.keys(attempts).length;
    if (completedCount === 20 && !isTimerPaused && timeLeft > 0) {
      console.log('Todos desafios concluídos! Travando timer e salvando tempo...');
      setIsTimerPaused(true);
      
      // Formatar segundos restantes de volta para HH:MM:SS
      const h = Math.floor(timeLeft / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60;
      const formattedTime = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      
      api.saveTime(unidade, serie, teamName, formattedTime)
        .then(() => console.log('Tempo salvo com sucesso na planilha'))
        .catch(err => console.error('Erro ao salvar tempo:', err));
    }
  }, [attempts, isTimerPaused, timeLeft, unidade, serie, teamName]);

  // Função para enviar resposta
  const submitAnswer = async (challengeId, userAnswer) => {
    // Encontrar a questão correspondente no array de questões carregado
    const question = questoes.find(q => q.numero == challengeId || q.id == challengeId);
    const targetQuestion = question || questoes[challengeId - 1]; 
    
    const correctAnswer = targetQuestion ? targetQuestion.resposta : ''; // Campo 'resposta' do GAB
    
    let status = '';
    let points = 0;
    let sheetStatus = ''; // 'CORRETO', 'ERRADO', 'BRANCO'

    if (targetQuestion && userAnswer.trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase()) {
      status = 'correct';
      points = 1;
      sheetStatus = 'CORRETO';
    } else {
      status = 'wrong';
      points = -3;
      sheetStatus = 'ERRADO';
    }

    // Atualização Otimista
    const newAttempts = {
      ...attempts,
      [challengeId]: { status, points, userAnswer }
    };
    
    const newTotalPoints = Object.values(newAttempts).reduce((acc, curr) => acc + (curr.points || 0), 0);
    
    setAttempts(newAttempts);
    setTotalPoints(newTotalPoints);
    prevPointsRef.current = newTotalPoints;
    
    localStorage.setItem(`gameState_${teamName}`, JSON.stringify({
      attempts: newAttempts,
      totalPoints: newTotalPoints,
      timestamp: Date.now()
    }));

    if (newTotalPoints > totalPoints) {
       audioRef.current.play().catch(e => console.log('Erro som:', e));
    }

    try {
      // Enviar para API com novo formato
      await api.submitChallenge({
        unidade,
        serie,
        equipe: teamName,
        chave: localStorage.getItem('accessKey') || '', 
        desafio: `d${challengeId}`,
        resultado: sheetStatus
      });
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      // Aqui poderíamos reverter o estado otimista se quiséssemos ser estritos,
      // mas como temos retry no api.js e fallback, mantemos o otimismo para UX.
    }
  };

  const completedCount = Object.keys(attempts).length;

  return {
    unidade,
    serie,
    teamName,
    questoes,
    attempts,
    submitAnswer,
    totalPoints,
    completedCount,
    timeLeft,
    isTimeUp,
    formatTime: (seconds) => {
      if (seconds === null) return "--:--:--";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    },
    setUnidade,
    setSerie,
    setTeamName,
    setQuestoes
  };
}

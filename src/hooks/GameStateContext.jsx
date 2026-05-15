import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const GameStateContext = createContext();

export function GameStateProvider({ children }) {
  const [classId, setClassId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [unidade, setUnidade] = useState('');
  const [serie, setSerie] = useState('');
  
  const [questoes, setQuestoes] = useState([]);
  const [attempts, setAttempts] = useState({}); 
  const [totalPoints, setTotalPoints] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerDuration] = useState(3600); // 1 hora
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  
  const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
  const prevPointsRef = useRef(0);
  const timeLeftRef = useRef(null);

  // Inicialização
  const initializeState = async (storedData = {}) => {
    const data = {
      classId: storedData.classId || localStorage.getItem('classId'),
      teamId: storedData.teamId || localStorage.getItem('teamId'),
      teamName: storedData.teamName || localStorage.getItem('teamName'),
      unidade: storedData.unidade || localStorage.getItem('unidade'),
      serie: storedData.serie || localStorage.getItem('serie'),
    };

    if (data.classId) setClassId(data.classId);
    if (data.teamId) setTeamId(data.teamId);
    if (data.teamName) setTeamName(data.teamName);
    if (data.unidade) setUnidade(data.unidade);
    if (data.serie) setSerie(data.serie);

    if (data.teamId) {
      try {
        const teamData = await api.getTeamById(data.teamId);
        syncTimerWithData(teamData);
      } catch (e) { console.error('Erro init:', e); }
    }
  };

  const syncTimerWithData = (teamData) => {
    // Heurística: Se não tem started_at, mas tem respostas, considera iniciado
    const hasStarted = teamData?.started_at || Object.keys(attempts).length > 0;
    
    if (teamData && (teamData.started_at || hasStarted)) {
      const startTime = new Date(teamData.started_at || teamData.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      
      setTimeLeft(remaining);
      timeLeftRef.current = remaining;
      setIsTimerPaused(false);
      if (remaining <= 0) setIsTimeUp(true);
    } else {
      // Se não começou, fica pausado em 1h
      setTimeLeft(timerDuration);
      timeLeftRef.current = timerDuration;
      setIsTimerPaused(true);
    }
  };

  useEffect(() => {
    initializeState();
  }, []);

  // Polling de sincronização
  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      try {
        const pId = localStorage.getItem('periodId');
        const gId = localStorage.getItem('gradeId');
        
        if (pId && gId && questoes.length === 0) {
          const qData = await api.getQuestions(pId, gId);
          setQuestoes(qData);
        }

        const teamData = await api.getTeamById(teamId);
        syncTimerWithData(teamData);

        const progress = await api.getTeamProgress(teamId);
        const newAttempts = {};
        let newPoints = 0;
        progress.forEach(ans => {
          newAttempts[ans.question_id] = {
            status: ans.is_correct ? 'correct' : 'wrong',
            points: ans.points,
            userAnswer: ans.selected_option
          };
          newPoints += ans.points;
        });

        const isFullyCompleted = questoes.length > 0 && Object.keys(newAttempts).length >= questoes.length;

        if (Object.keys(newAttempts).length > 0 && !isFullyCompleted) {
          setIsTimerPaused(false);
        } else if (isFullyCompleted) {
          setIsTimerPaused(true); // Congela o tempo se terminou tudo
        }

        setAttempts(newAttempts);
        setTotalPoints(newPoints);
        
        if (newPoints > prevPointsRef.current && prevPointsRef.current !== 0) {
          audioRef.current.play().catch(() => {});
        }
        prevPointsRef.current = newPoints;
      } catch (err) { console.error(err); }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [teamId, questoes.length]);

  // Tick local para suavidade
  useEffect(() => {
    if (isTimerPaused || isTimeUp || timeLeft === null) return;
    
    const ticker = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        timeLeftRef.current = prev - 1;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [isTimerPaused, isTimeUp, timeLeft === null]);

  const login = (data) => {
    localStorage.setItem('classId', data.classId);
    localStorage.setItem('teamId', data.teamId);
    localStorage.setItem('teamName', data.teamName);
    localStorage.setItem('unidade', data.unidade);
    localStorage.setItem('unitId', data.unitId);
    localStorage.setItem('serie', data.serie);
    localStorage.setItem('periodId', data.periodId);
    localStorage.setItem('gradeId', data.gradeId);
    initializeState(data);
  };

  const submitAnswer = async (questionId, userAnswer) => {
    if (attempts[questionId] || isTimeUp) return;
    const question = questoes.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = userAnswer.trim().toUpperCase() === question.correct_option.trim().toUpperCase();
    const points = isCorrect ? 1 : -2;

    const updatedAttempts = { ...attempts, [questionId]: { status: isCorrect ? 'correct' : 'wrong', points, userAnswer } };
    setAttempts(updatedAttempts);
    setTotalPoints(prev => prev + points);
    
    // Se era a última questão, congela o tempo agora mesmo
    if (Object.keys(updatedAttempts).length >= questoes.length) {
      setIsTimerPaused(true);
    } else {
      setIsTimerPaused(false);
    }

    try { await api.submitAnswer({ teamId, questionId: question.id, selectedOption: userAnswer, isCorrect, points });
    } catch (err) { console.error(err); }
  };

  const value = {
    teamName, unidade, serie, questoes, attempts, totalPoints,
    completedCount: Object.keys(attempts).length,
    timeLeft, isTimeUp, login, submitAnswer,
    formatTime: (seconds) => {
      if (seconds === null) return "01:00:00";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    }
  };

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within a GameStateProvider');
  return context;
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Trash2, Calendar, Users, BookOpen, BarChart3, 
  ChevronRight, RefreshCw, ShieldCheck, Lock, AlertTriangle, 
  CheckCircle, X, Image as ImageIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('adminAuth') === 'true');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('periods');
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [units, setUnits] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedGradeForQuestions, setSelectedGradeForQuestions] = useState(null);
  
  const [newPeriodName, setNewPeriodName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [filterUnit, setFilterUnit] = useState(null);
  const [filterGrade, setFilterGrade] = useState(null);

  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [editMode, setEditMode] = useState({}); // { [qId]: 'visual' | 'code' }

  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm', 'input', 'fraction', 'sqrt'
    inputValue: '',
    num: '',
    den: '',
    sqrtValue: '',
    targetId: null,
    onConfirm: () => {},
    confirmText: 'Confirmar'
  });

  const [savedRange, setSavedRange] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedPeriod && isAuthenticated) {
      loadPeriodData(selectedPeriod.id);
    }
  }, [selectedPeriod, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Leo@1234oli') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setAuthError('');
    } else {
      setAuthError('Senha incorreta. Acesso negado.');
      setPassword('');
    }
  };

  const handleOpenFractionModal = (targetId = null) => {
    const html = `<span class="math-fraction"><span class="num"></span><span class="den"></span></span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    const selection = window.getSelection();
    selection.collapseToEnd();
  };

  const handleOpenSqrtModal = (targetId = null) => {
    const html = `<span class="math-sqrt"><span class="sqrt-content"></span></span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    const selection = window.getSelection();
    selection.collapseToEnd();
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const p = await api.getPeriods();
      const u = await api.getUnits();
      const g = await api.getGrades();
      setPeriods(p);
      setUnits(u);
      setGrades(g);
      if (p.length > 0 && !selectedPeriod) setSelectedPeriod(p[0]);
    } catch (err) {
      showMsg('error', 'Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodData = async (periodId) => {
    try {
      const c = await api.getClasses(periodId);
      setClasses(c);
    } catch (err) {
      showMsg('error', 'Erro ao carregar turmas do período');
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // --- RENDERING LOGIN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-orange/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-primary/10 max-w-md w-full border border-gray-100 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="bg-primary/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
              <Lock size={40} className="text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Área Restrita</h1>
            <p className="text-gray-400 font-medium text-sm mt-2">Acesso exclusivo para administradores Olivinci</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest block mb-2 ml-1">Senha de Acesso</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="••••••••••••"
                  className={`w-full bg-gray-50 border-2 p-4 rounded-2xl font-bold focus:outline-none transition-all duration-300 text-center text-lg tracking-widest
                    ${authError ? 'border-accent-red text-accent-red animate-shake' : 'border-transparent focus:border-primary'}
                  `}
                />
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center space-x-2 text-accent-red mt-3 text-xs font-bold"
                  >
                    <AlertTriangle size={14} />
                    <span>{authError}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!password}
              className="w-full bg-primary hover:bg-primary-light text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-primary/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm uppercase tracking-widest flex items-center justify-center group"
            >
              Autenticar
              <ShieldCheck size={18} className="ml-2 group-hover:rotate-12 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-gray-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest py-2"
            >
              Voltar ao Início
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- HANDLERS ---

  const handleCreatePeriod = async () => {
    if (!newPeriodName.trim()) return;
    setLoading(true);
    try {
      const p = await api.createPeriod(newPeriodName);
      setPeriods([p, ...periods]);
      setSelectedPeriod(p);
      setNewPeriodName('');
      showMsg('success', 'Período criado com sucesso!');
    } catch (err) {
      showMsg('error', 'Erro ao criar período');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClasses = async (unitId, gradeId, count) => {
    setLoading(true);
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < count; i++) {
        const className = alphabet[i];
        const accessCode = `${selectedPeriod.name.slice(-2)}${unitId.slice(0,1).toUpperCase()}${gradeId.slice(0,1).toUpperCase()}${className}${Math.floor(100 + Math.random() * 900)}`;
        
        await api.createClass({
          period_id: selectedPeriod.id,
          unit_id: unitId,
          grade_id: gradeId,
          name: className,
          access_code: accessCode
        });
      }
      loadPeriodData(selectedPeriod.id);
      showMsg('success', `${count} turmas geradas com sucesso!`);
    } catch (err) {
      showMsg('error', 'Erro ao gerar turmas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id) => {
    setLoading(true);
    try {
      await api.deleteClass(id);
      loadPeriodData(selectedPeriod.id);
      showMsg('success', 'Turma excluída');
    } catch (err) {
      console.error('ERRO AO EXCLUIR:', err);
      showMsg('error', 'Erro ao excluir turma');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (gradeId) => {
    if (!selectedPeriod || !gradeId) return;
    setLoading(true);
    try {
      const q = await api.getQuestions(selectedPeriod.id, gradeId);
      setQuestions(q);
      setSelectedGradeForQuestions(grades.find(g => g.id === gradeId));
    } catch (err) {
      showMsg('error', 'Erro ao carregar questões');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (qData) => {
    setLoading(true);
    try {
      await api.saveQuestion({
        ...qData,
        period_id: selectedPeriod.id,
        grade_id: selectedGradeForQuestions.id
      });
      loadQuestions(selectedGradeForQuestions.id);
      showMsg('success', 'Questão salva com sucesso!');
    } catch (err) {
      showMsg('error', 'Erro ao salvar questão');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    setModal({
      isOpen: true,
      title: 'Excluir Questão',
      message: 'Tem certeza que deseja excluir esta questão?',
      type: 'confirm',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.deleteQuestion(id);
          loadQuestions(selectedGradeForQuestions.id);
          showMsg('success', 'Questão excluída');
        } catch (err) {
          showMsg('error', 'Erro ao excluir questão');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // --- RENDERERS ---

  const renderModal = () => {
    if (!modal.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black text-primary uppercase tracking-tight">{modal.title}</h3>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <p className="text-gray-500 font-medium mb-6">{modal.message}</p>
            
            {modal.type === 'input' && (
              <input
                type="number"
                autoFocus
                value={modal.inputValue}
                onChange={(e) => setModal({ ...modal, inputValue: e.target.value })}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 focus:border-accent-orange rounded-2xl font-bold outline-none mb-6 transition-all"
                placeholder="Digite um número..."
              />
            )}

            {modal.type === 'fraction' && (
              <div className="flex flex-col items-center space-y-4 mb-6">
                <input
                  type="text"
                  autoFocus
                  placeholder="Numerador"
                  value={modal.num}
                  onChange={(e) => setModal({ ...modal, num: e.target.value })}
                  className="w-32 p-4 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-black text-center text-xl outline-none transition-all"
                />
                <div className="w-40 h-1 bg-gray-200 rounded-full"></div>
                <input
                  type="text"
                  placeholder="Denominador"
                  value={modal.den}
                  onChange={(e) => setModal({ ...modal, den: e.target.value })}
                  className="w-32 p-4 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-black text-center text-xl outline-none transition-all"
                />
              </div>
            )}
            
            {modal.type === 'sqrt' && (
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="flex items-center text-3xl font-black text-primary">
                  <span className="mr-1">√</span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Valor"
                    value={modal.sqrtValue}
                    onChange={(e) => setModal({ ...modal, sqrtValue: e.target.value })}
                    className="w-48 p-4 bg-gray-50 border-2 border-primary border-t-4 rounded-b-xl font-black text-center text-xl outline-none transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (modal.type === 'input') {
                    modal.onConfirm(modal.inputValue);
                  } else if (modal.type === 'fraction') {
                    modal.onConfirm({ num: modal.num, den: modal.den, targetId: modal.targetId });
                  } else if (modal.type === 'sqrt') {
                    modal.onConfirm({ sqrtValue: modal.sqrtValue, targetId: modal.targetId });
                  } else {
                    modal.onConfirm();
                  }
                  setModal({ ...modal, isOpen: false });
                }}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 transition-all"
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="w-64 bg-primary text-white flex flex-col h-full border-r border-white/10">
      <div className="p-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-accent-orange">Olivinci</h1>
        <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Painel Admin v2.0</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {[
          { id: 'periods', label: 'Períodos', icon: Calendar },
          { id: 'classes', label: 'Turmas & Códigos', icon: Users },
          { id: 'questions', label: 'Banco de Questões', icon: BookOpen },
          { id: 'monitor', label: 'Monitoramento', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === tab.id ? 'bg-accent-orange text-primary shadow-lg' : 'hover:bg-white/5 text-white/60'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={() => {
            sessionStorage.removeItem('adminAuth');
            navigate('/');
          }} 
          className="text-white/40 hover:text-white flex items-center text-xs font-bold uppercase transition-colors"
        >
          <ChevronRight size={14} className="rotate-180 mr-2" /> Sair do Painel
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {renderModal()}
      {renderSidebar()}

      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Global Notifications */}
        {message.text && (
          <div className={`fixed top-8 right-8 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold">{message.text}</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-primary uppercase tracking-wider">
                {activeTab === 'periods' && 'Gestão de Períodos'}
                {activeTab === 'classes' && 'Configuração de Turmas'}
                {activeTab === 'questions' && 'Banco de Questões'}
                {activeTab === 'monitor' && 'Monitoramento ao Vivo'}
              </h2>
              <p className="text-gray-400 font-medium">
                {selectedPeriod ? `Período Ativo: ${selectedPeriod.name}` : 'Nenhum período selecionado'}
              </p>
            </div>

            {activeTab !== 'periods' && (
              <select 
                value={selectedPeriod?.id} 
                onChange={(e) => setSelectedPeriod(periods.find(p => p.id === e.target.value))}
                className="bg-white border-2 border-gray-100 p-3 rounded-xl font-bold text-primary focus:outline-none focus:border-accent-orange transition-all shadow-sm"
              >
                {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {/* TAB: PERIODS */}
          {activeTab === 'periods' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-primary mb-6 uppercase flex items-center">
                  <Plus size={20} className="mr-2 text-accent-orange" /> Novo Período
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ex: Ano 2026"
                    value={newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-accent-orange rounded-2xl font-bold outline-none transition-all"
                  />
                  <button 
                    onClick={handleCreatePeriod}
                    disabled={loading || !newPeriodName}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-primary-light transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                    <span>Salvar Período</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {periods.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPeriod(p)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedPeriod?.id === p.id 
                        ? 'bg-white border-accent-orange shadow-lg scale-[1.02]' 
                        : 'bg-white border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${selectedPeriod?.id === p.id ? 'bg-accent-orange text-primary' : 'bg-gray-100 text-gray-400'}`}>
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="font-black text-xl text-primary">{p.name}</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                          {classes.filter(c => c.period_id === p.id).length} Turmas Cadastradas
                        </p>
                      </div>
                    </div>
                    {p.is_active && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ativo</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CLASSES */}
          {activeTab === 'classes' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-4 font-black text-gray-400 uppercase text-xs">Unidade</th>
                      {grades.map(g => (
                        <th key={g.id} className="pb-4 px-4 font-black text-gray-400 uppercase text-xs text-center">{g.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {units.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-6 font-black text-primary uppercase">{u.name}</td>
                        {grades.map(g => {
                          const existing = classes.filter(c => c.unit_id === u.id && c.grade_id === g.id);
                          return (
                            <td key={g.id} className="py-6 px-4 text-center">
                              {existing.length > 0 ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs">
                                    {existing.length}
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setFilterUnit(u.id);
                                      setFilterGrade(g.id);
                                      window.scrollTo({ top: 600, behavior: 'smooth' });
                                    }}
                                    className="text-[10px] font-bold text-accent-orange uppercase hover:underline"
                                  >
                                    Ver Códigos
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setModal({
                                      isOpen: true,
                                      title: 'Gerar Turmas',
                                      message: `Quantas turmas (A, B, C...) para ${g.name} em ${u.name}?`,
                                      type: 'input',
                                      inputValue: '1',
                                      confirmText: 'Gerar',
                                      onConfirm: (val) => handleGenerateClasses(u.id, g.id, parseInt(val))
                                    });
                                  }}
                                  className="w-8 h-8 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 hover:border-accent-orange hover:text-accent-orange transition-all"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Codes Grid Header */}
              <div className="flex items-center justify-between mt-12 mb-4">
                <h3 className="text-xl font-black text-primary uppercase">Listagem de Códigos</h3>
                {(filterUnit || filterGrade) && (
                  <button 
                    onClick={() => { setFilterUnit(null); setFilterGrade(null); }}
                    className="text-accent-orange text-xs font-bold uppercase hover:underline"
                  >
                    Mostrar Todos
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {classes
                  .filter(c => {
                    if (filterUnit && c.unit_id !== filterUnit) return false;
                    if (filterGrade && c.grade_id !== filterGrade) return false;
                    return true;
                  })
                  .map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:border-accent-orange transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-primary leading-tight">{c.grades.name} {c.name}</p>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{c.units.name}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setModal({
                            isOpen: true,
                            title: 'Excluir Turma',
                            message: 'Excluir esta turma e todos os dados relacionados?',
                            type: 'confirm',
                            onConfirm: () => handleDeleteClass(c.id)
                          });
                        }}
                        className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                      <code className="text-accent-orange font-black text-lg tracking-widest">{c.access_code}</code>
                      <button className="p-2 text-gray-400 hover:text-primary"><RefreshCw size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {grades.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => loadQuestions(g.id)}
                    className={`p-4 rounded-2xl border-2 font-bold transition-all text-xs uppercase tracking-widest ${
                      selectedGradeForQuestions?.id === g.id 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-gray-400 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              {selectedGradeForQuestions ? (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-primary uppercase">
                      Questões: {selectedGradeForQuestions.name}
                    </h3>
                    <button 
                      onClick={() => {
                        const order = questions.length + 1;
                        handleSaveQuestion({
                          order_index: order,
                          componente: 'Geral',
                          enunciado: 'Nova Questão',
                          options: { A: '', B: '', C: '', D: '', E: '' },
                          correct_option: 'A'
                        });
                      }}
                      className="bg-accent-orange text-primary font-black px-4 py-2 rounded-xl flex items-center space-x-2 text-sm uppercase"
                    >
                      <Plus size={18} /> <span>Nova Questão</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-accent-blue/30">
                        {/* Header da Questão (Visível) */}
                        <div 
                          onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                          className="p-5 flex justify-between items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <span className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-xl font-black shadow-sm">{q.order_index}</span>
                            <div>
                              <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Componente Curricular</h4>
                              <input 
                                type="text" 
                                value={q.componente} 
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newQs = [...questions];
                                  const idx = newQs.findIndex(item => item.id === q.id);
                                  newQs[idx].componente = e.target.value;
                                  setQuestions(newQs);
                                }}
                                className="font-black text-accent-blue uppercase text-sm tracking-tight outline-none border-b border-transparent focus:border-accent-blue bg-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex space-x-1">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleSaveQuestion(q); }} 
                                 className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                 title="Salvar Alterações"
                               >
                                 <Save size={20} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }} 
                                 className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Excluir Questão"
                               >
                                 <Trash2 size={20} />
                               </button>
                            </div>
                            <div className={`text-primary/20 transition-transform duration-300 ${expandedQuestionId === q.id ? 'rotate-180' : ''}`}>
                               <ChevronRight size={24} />
                            </div>
                          </div>
                        </div>

                        {/* Corpo da Questão (Toggle) */}
                        {expandedQuestionId === q.id && (
                          <div className="p-8 bg-gray-50/50 border-t border-gray-50 animate-in slide-in-from-top duration-300">
                            <div className="mb-6">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest block">Enunciado da Questão</label>
                                <div className="flex items-center space-x-3">
                                  <div className="flex bg-white border border-gray-100 rounded-lg p-1 shadow-sm space-x-1">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); document.execCommand('bold'); }} className="px-2 py-1 hover:bg-gray-50 rounded text-xs font-black text-primary" title="Negrito (Ctrl+B)">B</button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); document.execCommand('insertUnorderedList'); }} className="px-2 py-1 hover:bg-gray-50 rounded text-xs font-black text-primary" title="Lista">• List</button>
                                    <button type="button" onClick={(e) => { 
                                      e.stopPropagation(); 
                                      document.execCommand('insertOrderedList');
                                      const selection = window.getSelection();
                                      if (selection.rangeCount > 0) {
                                        let container = selection.getRangeAt(0).commonAncestorContainer;
                                        while (container && container.nodeName !== 'OL' && container.nodeName !== 'BODY') {
                                          container = container.parentNode;
                                        }
                                        if (container && container.nodeName === 'OL') {
                                          container.setAttribute('type', 'I');
                                        }
                                      }
                                    }} className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-black text-primary border-x border-gray-100" title="Lista Romana">I. II.</button>
                                    <button 
                                      type="button" 
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleOpenFractionModal(`editor-${q.id}`);
                                      }} 
                                      className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-black text-primary" 
                                      title="Fração"
                                    >
                                      ½
                                    </button>
                                    <button 
                                      type="button" 
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleOpenSqrtModal(`editor-${q.id}`);
                                      }} 
                                      className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-black text-primary border-r border-gray-100" 
                                      title="Raiz Quadrada"
                                    >
                                      √x
                                    </button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); document.execCommand('subscript'); }} className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-black text-primary" title="Subescrito">x₂</button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); document.execCommand('superscript'); }} className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-black text-primary" title="Sobrescrito">x²</button>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const isToCode = editMode[q.id] !== 'code';
                                      if (isToCode) {
                                        const cleaned = cleanHTML(q.enunciado);
                                        const newQs = [...questions];
                                        const idx = newQs.findIndex(item => item.id === q.id);
                                        newQs[idx] = { ...newQs[idx], enunciado: cleaned }; 
                                        setQuestions(newQs);
                                      }
                                      setEditMode(prev => ({ ...prev, [q.id]: isToCode ? 'code' : 'visual' }));
                                    }}
                                    className="text-[10px] font-bold text-accent-blue hover:underline uppercase"
                                  >
                                    {editMode[q.id] === 'code' ? '👁️ Ver Visual' : ' </> Ver Código'}
                                  </button>
                                </div>
                              </div>

                              {editMode[q.id] === 'code' ? (
                                <textarea 
                                  id={`q-text-${q.id}`}
                                  value={formatHTML(cleanHTML(q.enunciado))}
                                  onChange={(e) => {
                                    const newQs = [...questions];
                                    const idx = newQs.findIndex(item => item.id === q.id);
                                    newQs[idx] = { ...newQs[idx], enunciado: e.target.value };
                                    setQuestions(newQs);
                                  }}
                                  className="w-full bg-slate-900 p-6 rounded-2xl border border-gray-100 font-mono text-[11px] outline-none shadow-sm text-green-400 mb-4"
                                  rows="12"
                                />
                              ) : (
                                <VisualEditor 
                                  qId={q.id}
                                  initialValue={q.enunciado}
                                  onChange={(html) => {
                                    const newQs = [...questions];
                                    const idx = newQs.findIndex(item => item.id === q.id);
                                    newQs[idx] = { ...newQs[idx], enunciado: html };
                                    setQuestions(newQs);
                                  }}
                                />
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                <div key={opt} className="flex flex-col space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <button 
                                      onClick={() => {
                                        const newQs = [...questions];
                                        const idx = newQs.findIndex(item => item.id === q.id);
                                        newQs[idx].correct_option = opt;
                                        setQuestions(newQs);
                                      }}
                                      className={`w-10 h-10 rounded-xl font-black text-sm transition-all shadow-sm ${q.correct_option === opt ? 'bg-green-500 text-white scale-110' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}
                                    >
                                      {opt}
                                    </button>
                                    <div className="flex-1 flex flex-col space-y-1">
                                      <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-bold text-gray-300 uppercase">Alternativa {opt}</span>
                                        <button 
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            handleOpenFractionModal(`opt-editor-${q.id}-${opt}`);
                                          }}
                                          className="text-[9px] font-bold text-accent-blue hover:underline uppercase"
                                        >
                                          + Fração
                                        </button>
                                        <button 
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            handleOpenSqrtModal(`opt-editor-${q.id}-${opt}`);
                                          }}
                                          className="text-[9px] font-bold text-accent-blue hover:underline uppercase ml-3"
                                        >
                                          + Raiz
                                        </button>
                                      </div>
                                      <VisualEditor 
                                        id={`opt-editor-${q.id}-${opt}`}
                                        qId={q.id}
                                        initialValue={q.options[opt] || ''}
                                        onChange={(html) => {
                                          const newQs = [...questions];
                                          const idx = newQs.findIndex(item => item.id === q.id);
                                          const options = { ...newQs[idx].options, [opt]: html };
                                          newQs[idx] = { ...newQs[idx], options };
                                          setQuestions(newQs);
                                        }}
                                        className="bg-white p-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-accent-orange shadow-sm font-bold text-primary/80 rich-text-content min-h-[44px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center space-x-3 bg-white/50 p-4 rounded-2xl">
                               <ImageIcon size={20} className="text-primary/30" />
                               <div className="flex-1">
                                 <label className="text-[9px] font-black text-primary/40 uppercase block">Link da Imagem Ilustrativa</label>
                                 <input 
                                   type="text" 
                                   placeholder="https://exemplo.com/imagem.jpg"
                                   value={q.image_url || ''}
                                   onChange={(e) => {
                                     const newQs = [...questions];
                                     const idx = newQs.findIndex(item => item.id === q.id);
                                     newQs[idx].image_url = e.target.value;
                                     setQuestions(newQs);
                                   }}
                                   className="w-full bg-transparent text-sm text-accent-blue font-bold outline-none placeholder:text-gray-300"
                                 />
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center">
                  <BookOpen size={48} className="mx-auto text-gray-100 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest">Selecione uma série para gerenciar as questões</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'monitor' && <MonitoringView periodId={selectedPeriod?.id} timerDuration={3600} units={units} grades={grades} setModal={setModal} showMsg={showMsg} />}
        </div>
      </main>
    </div>
  );
}

function MonitoringView({ periodId, timerDuration, units, grades, setModal, showMsg }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const handleResetTeam = async (teamId, teamName) => {
    setModal({
      isOpen: true,
      title: 'Resetar Equipe',
      message: `Tem certeza que deseja apagar todos os dados da equipe "${teamName}"? Isso zerará os pontos e reiniciará o cronômetro para 1 hora.`,
      type: 'confirm',
      confirmText: 'Resetar Tudo',
      onConfirm: async () => {
        try {
          await supabase.from('answers').delete().eq('team_id', teamId);
          await supabase.from('teams').update({ started_at: null }).eq('id', teamId);
          showMsg('success', `Equipe "${teamName}" resetada com sucesso!`);
          fetchMonitoringData();
        } catch (err) {
          console.error(err);
          showMsg('error', 'Erro ao resetar equipe');
        }
      }
    });
  };

  const [questionCounts, setQuestionCounts] = useState({});

  const fetchMonitoringData = async () => {
    if (!periodId) return;
    try {
      const { data: qCounts } = await supabase.rpc('get_question_counts_per_grade');
      if (!qCounts) {
        const { data: allQs } = await supabase.from('questions').select('grade_id');
        const counts = {};
        allQs?.forEach(q => counts[q.grade_id] = (counts[q.grade_id] || 0) + 1);
        setQuestionCounts(counts);
      } else {
        const counts = {};
        qCounts.forEach(c => counts[c.grade_id] = c.count);
        setQuestionCounts(counts);
      }

      const { data: classes } = await supabase.from('classes').select('*').eq('period_id', periodId);
      if (!classes) return;
      
      const { data: teamsData } = await supabase.from('teams').select('*').in('class_id', classes.map(c => c.id));
      if (!teamsData) return;

      const { data: allAnswers } = await supabase.from('answers').select('*').in('team_id', teamsData.map(t => t.id));
      const { data: allQuestions } = await supabase.from('questions').select('id, order_index, grade_id').eq('period_id', periodId);

      const enrichedTeams = teamsData.map(team => {
        const teamClass = classes.find(c => c.id === team.class_id);
        const teamAnswers = (allAnswers || []).filter(a => a.team_id === team.id);
        const teamGradeQuestions = (allQuestions || []).filter(q => q.grade_id === teamClass?.grade_id);
        const points = teamAnswers.reduce((acc, curr) => acc + (curr.points || 0), 0);
        
        const answersMap = {};
        teamAnswers.forEach(ans => {
          const q = teamGradeQuestions.find(q => q.id === ans.question_id);
          if (q) answersMap[q.order_index] = ans;
        });

        return {
          ...team,
          unit_id: teamClass?.unit_id,
          grade_id: teamClass?.grade_id,
          unitName: units.find(u => u.id === teamClass?.unit_id)?.name,
          gradeName: grades.find(g => g.id === teamClass?.grade_id)?.name,
          points,
          answersCount: teamAnswers.length,
          correctCount: teamAnswers.filter(a => a.is_correct).length,
          answers: teamAnswers,
          answersMap
        };
      });

      setTeams(enrichedTeams.sort((a, b) => b.points - a.points));
      setIsLoading(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 10000);
    const ticker = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(ticker); };
  }, [periodId]);

  const filteredTeams = teams.map(team => {
    const totalQs = questionCounts[team.grade_id] || 20;
    const hasStarted = team.started_at || team.answersCount > 0;
    const isFinished = team.answersCount >= totalQs && totalQs > 0;
    
    let timeLeft = timerDuration;
    if (hasStarted) {
      const startTime = new Date(team.started_at || team.created_at).getTime();
      timeLeft = Math.max(0, timerDuration - Math.floor((currentTime - startTime) / 1000));
      if (isFinished && team.answers.length > 0) {
        const lastAnswerTime = new Date(Math.max(...team.answers.map(a => new Date(a.created_at).getTime()))).getTime();
        timeLeft = Math.max(0, timerDuration - Math.floor((lastAnswerTime - startTime) / 1000));
      }
    }
    
    return { ...team, timeLeft, isPaused: !hasStarted || isFinished, isFinished };
  }).filter(t => {
    const hasStarted = t.started_at || t.answersCount > 0;
    if (!hasStarted) return false;
    if (filterUnit !== 'all' && t.unit_id !== filterUnit) return false;
    if (filterGrade !== 'all' && t.grade_id !== filterGrade) return false;
    return true;
  });

  if (isLoading) return <div className="p-20 text-center text-primary font-bold animate-pulse uppercase tracking-widest">Carregando Monitoramento...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary uppercase">Monitoramento</h2>
          <p className="text-xs font-bold text-primary/40 uppercase">Acompanhe o progresso das equipes ao vivo</p>
        </div>
        <div className="flex gap-2">
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="bg-white border border-gray-100 p-2 rounded-lg text-xs font-bold uppercase outline-none focus:border-accent-orange">
            <option value="all">Todas Unidades</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="bg-white border border-gray-100 p-2 rounded-lg text-xs font-bold uppercase outline-none focus:border-accent-orange">
            <option value="all">Todas as Séries</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTeams.map(team => (
          <div key={team.id} className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 group transition-all ${team.isFinished ? 'border-accent-green bg-green-50/30' : 'border-gray-100'} ${team.isPaused && !team.isFinished ? 'opacity-60' : 'opacity-100'}`}>
            <div className="min-w-[180px]">
              <div className="text-[10px] font-bold text-accent-blue uppercase tracking-tighter">{team.unitName} | {team.gradeName}</div>
              <div className="text-xl font-black text-primary uppercase leading-tight flex items-center gap-2">
                {team.name}
                {team.isFinished && <div className="bg-accent-green text-white text-[8px] px-2 py-0.5 rounded-full">CONCLUÍDO</div>}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-10 gap-1.5">
              {Array.from({ length: 20 }, (_, i) => {
                const qNum = i + 1;
                const ans = team.answersMap[qNum];
                const bgColor = ans ? (ans.is_correct ? 'bg-accent-green' : 'bg-accent-red') : 'bg-gray-100';
                return <div key={i} className={`w-full aspect-square rounded-md ${bgColor} flex items-center justify-center text-[10px] font-black text-white shadow-sm`}>{qNum}</div>;
              })}
            </div>
            <div className="flex items-center gap-6 border-l border-gray-100 pl-6">
              <div className="text-center">
                <div className="text-[10px] font-bold text-primary/40 uppercase">Pontos</div>
                <div className={`text-2xl font-black ${team.points >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{team.points}</div>
              </div>
              <div className="text-center min-w-[80px]">
                <div className="text-[10px] font-bold text-primary/40 uppercase">Tempo</div>
                <div className={`text-xl font-mono font-black ${team.isFinished ? 'text-accent-green' : (team.isPaused && !team.isFinished) ? 'text-gray-300' : team.timeLeft < 300 ? 'text-accent-red animate-pulse' : 'text-primary'}`}>
                  {team.isPaused && !team.isFinished && !team.started_at ? '60:00' : `${Math.floor(team.timeLeft / 60)}:${(team.timeLeft % 60).toString().padStart(2, '0')}`}
                </div>
              </div>
              <button onClick={() => handleResetTeam(team.id, team.name)} className="p-3 text-gray-300 hover:text-accent-orange hover:bg-orange-50 rounded-2xl transition-all"><RefreshCw size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const cleanHTML = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const all = div.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    all[i].removeAttribute('style');
    all[i].removeAttribute('class');
    all[i].removeAttribute('id');
    all[i].removeAttribute('dir');
  }
  return div.innerHTML;
};

const formatHTML = (html) => {
  if (!html) return "";
  let formatted = '';
  let indent = '';
  const tab = '  ';
  html.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('input')) indent += tab;
  });
  return formatted.substring(1, formatted.length - 3);
};

const VisualEditor = ({ qId, initialValue, onChange, className, id }) => {
  const editorRef = useRef(null);
  const lastValue = useRef(initialValue);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue;
      lastValue.current = initialValue;
    }
  }, [qId, initialValue]);

  return (
    <div 
      ref={editorRef}
      contentEditable
      onClick={(e) => {
        if (e.target.tagName === 'IMG') {
          document.querySelectorAll('.img-resizer-handle').forEach(h => h.remove());
          const img = e.target;
          const handle = document.createElement('div');
          handle.className = 'img-resizer-handle';
          handle.style.cssText = "width: 12px; height: 12px; background: #3b82f6; position: absolute; cursor: nwse-resize; border-radius: 2px; z-index: 10; border: 2px solid white;";
          img.parentElement.style.position = 'relative';
          img.parentElement.appendChild(handle);
          const updateHandlePos = () => {
             handle.style.top = (img.offsetTop + img.offsetHeight - 6) + 'px';
             handle.style.left = (img.offsetLeft + img.offsetWidth - 6) + 'px';
          };
          updateHandlePos();
          let isResizing = false;
          handle.onmousedown = (md) => {
            md.preventDefault(); md.stopPropagation(); isResizing = true;
            const startX = md.clientX; const startWidth = img.offsetWidth;
            const onMouseMove = (mm) => {
              if (!isResizing) return;
              img.style.width = (startWidth + (mm.clientX - startX)) + 'px';
              updateHandlePos();
            };
            const onMouseUp = () => {
              isResizing = false;
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
              handle.remove();
              onChange(editorRef.current.innerHTML);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          };
        }
      }}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onPaste={(e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            hasImage = true;
            const reader = new FileReader();
            reader.onload = (event) => {
              document.execCommand('insertHTML', false, `<img src="${event.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`);
            };
            reader.readAsDataURL(items[i].getAsFile());
          }
        }
        if (!hasImage) {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }
      }}
      className={className || "w-full bg-white p-6 rounded-2xl border border-gray-100 font-medium outline-none focus:border-accent-orange shadow-sm text-primary mb-4 min-h-[150px] rich-text-content"}
      id={id}
    />
  );
};

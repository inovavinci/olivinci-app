import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [unidade, setUnidade] = useState('ALL');
  const [serie, setSerie] = useState('1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm
  const navigate = useNavigate();

  const handleReset = async () => {
    setLoading(true);
    setStatus('Processando... Isso pode levar alguns segundos.');
    try {
      // Se unidade for ALL, passamos serie como string vazia ou qualquer coisa, o backend ignora
      const result = await api.adminReset(unidade, serie, password);
      
      if (result.status === 'success') {
        setStatus('Reset realizado com sucesso!\n' + (result.details ? result.details.join('\n') : ''));
        // Limpar dados locais também para garantir sincronia se o admin estiver usando o app
        localStorage.clear();
        // Setar timestamp novo para evitar loop de reload imediato se implementado check
        if (result.lastReset) {
            localStorage.setItem('lastResetTimestamp', result.lastReset);
        }
      } else {
        setStatus('Erro: ' + (result.message || 'Falha desconhecida'));
      }
    } catch (error) {
      console.error(error);
      setStatus('Erro de conexão ou senha inválida.');
    } finally {
      setLoading(false);
      // Mantemos na tela de resultado (Step 2 modificado ou volta pro 1?)
      // Vamos voltar pro 1 mas com status visível
      setStep(1);
    }
  };

  if (step === 2) {
    return (
      <div className="p-8 bg-red-50 min-h-screen flex flex-col items-center justify-center text-red-900">
        <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-red-500 max-w-lg w-full">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-600">⚠️ PERIGO EXTREMO ⚠️</h1>
            <p className="text-lg mb-6 text-center">
            Você está prestes a apagar <strong>PERMANENTEMENTE</strong> todo o progresso e respostas 
            {unidade === 'ALL' ? ' de TODAS as unidades e séries.' : ` da unidade ${unidade} série ${serie}.`}
            </p>
            <p className="text-sm mb-8 text-center text-gray-600">
            Esta ação limpará as colunas de respostas na planilha Google e invalidará os caches de todos os dispositivos conectados na próxima sincronização.
            </p>
            <div className="flex gap-4 justify-center">
            <button 
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-colors animate-pulse"
            >
                {loading ? 'Apagando...' : 'CONFIRMAR DESTRUIÇÃO'}
            </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
        <button onClick={() => navigate('/')} className="text-blue-600 underline">Voltar</button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-gray-700">Senha Mestra</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Digite a senha de admin"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-gray-700">Escopo do Reset</label>
          <select 
            value={unidade} 
            onChange={e => setUnidade(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">GLOBAL (Todas as Unidades/Séries)</option>
            <option value="S">Sul</option>
            <option value="N">Norte</option>
            <option value="T">Taguatinga</option>
          </select>
        </div>

        {unidade !== 'ALL' && (
          <div className="mb-8">
            <label className="block text-sm font-bold mb-2 text-gray-700">Série Específica</label>
            <select 
              value={serie} 
              onChange={e => setSerie(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="1">1ª Série</option>
              <option value="2">2ª Série</option>
              <option value="3">3ª Série</option>
            </select>
          </div>
        )}

        <button 
          onClick={() => setStep(2)}
          disabled={!password}
          className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          INICIAR RESET DE DADOS
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded-lg text-sm whitespace-pre-wrap ${status.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {status}
          </div>
        )}
        
        <div className="mt-8 border-t border-gray-200 pt-6">
           <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Ferramentas Locais</h3>
           <button 
             onClick={() => {
               if(confirm('Isso limpará apenas o cache deste navegador. Os dados na nuvem permanecerão intactos. Continuar?')) {
                 localStorage.clear();
                 alert('Cache local limpo com sucesso.');
                 window.location.hash = '#/';
                 window.location.reload();
               }
             }}
             className="w-full bg-blue-50 text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
           >
             Limpar Cache Local (Debug)
           </button>
        </div>
      </div>
    </div>
  );
}

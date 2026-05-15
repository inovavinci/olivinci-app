import { supabase } from '../lib/supabase';

export const api = {
  // --- PARTICIPANT METHODS ---

  // Buscar classe pelo código de acesso
  getClassByCode: async (code) => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        periods (id, name, is_active),
        units (id, name),
        grades (id, name)
      `)
      .eq('access_code', code.trim().toUpperCase())
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar questões para uma classe (baseado em período e série)
  getQuestions: async (periodId, gradeId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('period_id', periodId)
      .eq('grade_id', gradeId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Buscar ou criar equipe em uma turma
  getTeamById: async (teamId) => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    if (error) throw error;
    return data;
  },

  getOrCreateTeam: async (classId, teamName) => {
    // Tenta buscar equipe existente
    const { data: existing, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('class_id', classId)
      .eq('name', teamName)
      .maybeSingle();
    
    if (fetchError) throw fetchError;

    if (existing) {
      return existing;
    }

    // Se não existe, cria (sem definir started_at ainda)
    const { data: created, error: createError } = await supabase
      .from('teams')
      .insert([{ 
        class_id: classId, 
        name: teamName
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    return created;
  },

  // Iniciar o cronômetro da equipe
  startTeamTimer: async (teamId) => {
    const { data, error } = await supabase
      .from('teams')
      .update({ started_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Enviar resposta
  submitAnswer: async ({ teamId, questionId, selectedOption, isCorrect, points }) => {
    const { data, error } = await supabase
      .from('answers')
      .upsert({
        team_id: teamId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        points: points
      }, { onConflict: 'team_id,question_id' });

    if (error) throw error;
    return data;
  },

  // Buscar progresso da equipe
  getTeamProgress: async (teamId) => {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data;
  },

  // --- ADMIN METHODS ---

  getPeriods: async () => {
    const { data, error } = await supabase.from('periods').select('*').order('name', { ascending: false });
    if (error) throw error;
    return data;
  },

  createPeriod: async (name) => {
    const { data, error } = await supabase.from('periods').insert([{ name }]).select().single();
    if (error) throw error;
    return data;
  },

  getGrades: async () => {
    const { data, error } = await supabase.from('grades').select('*').order('level', { ascending: true });
    if (error) throw error;
    return data;
  },

  getUnits: async () => {
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) throw error;
    return data;
  },

  getClasses: async (periodId) => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        units (name),
        grades (name)
      `)
      .eq('period_id', periodId);
    if (error) throw error;
    return data;
  },

  createClass: async (classData) => {
    const { data, error } = await supabase.from('classes').insert([classData]).select().single();
    if (error) throw error;
    return data;
  },

  saveQuestion: async (qData) => {
    const { data, error } = await supabase
      .from('questions')
      .upsert(qData, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteQuestion: async (id) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  deleteClass: async (id) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // LEGACY COMPATIBILITY (Temporary mapping to avoid breaking hooks immediately)
  getData: async (unidade, serie) => {
     // This would need a more complex join to match the old behavior
     // For now, let's just return an empty structure or implement a simplified version
     console.warn('api.getData is deprecated. Use getClassByCode and getQuestions.');
     return { equipes: [], questoes: [] };
  },

  saveTime: async (unidade, serie, teamName, time) => {
     // Implement later if needed in team settings
     console.warn('api.saveTime is deprecated.');
     return { status: 'success' };
  }
};

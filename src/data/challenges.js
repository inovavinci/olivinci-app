export const challenges = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  question: `Qual é a resposta para o Desafio ${i + 1}?`,
  description: `Resolva o problema matemático simples: Quanto é ${(i + 1)} + 0? (Apenas o número)`,
}));

import { Question, Language } from './types';
import questionsData from './data/questions.json';

// Load questions from static JSON
const questions: Question[] = questionsData as Question[];

// Total number of questions
export const TOTAL_QUESTIONS = questions.length;

// Get all questions (use sparingly)
export function getAllQuestions(): Question[] {
  return questions;
}

// Get a single question by ticket_id
export function getQuestionById(ticketId: number): Question | null {
  return questions.find((q) => q.ticket_id === ticketId) || null;
}

// Get questions in a range (inclusive)
export function getQuestionsInRange(start: number, end: number): Question[] {
  return questions.filter(
    (q) => q.ticket_id >= start && q.ticket_id <= end
  );
}

// Get a random question, optionally excluding certain ticket_ids
export function getRandomQuestion(excludeIds: number[] = []): Question | null {
  const available = questions.filter(
    (q) => !excludeIds.includes(q.ticket_id)
  );
  
  if (available.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

// Get a weighted random question (for prioritizing weak questions)
export function getWeightedRandomQuestion(
  excludeIds: number[] = [],
  priorityIds: number[] = [],
  priorityWeight: number = 3
): Question | null {
  const available = questions.filter(
    (q) => !excludeIds.includes(q.ticket_id)
  );
  
  if (available.length === 0) {
    return null;
  }
  
  // Build weighted pool
  const weightedPool: Question[] = [];
  
  for (const question of available) {
    const weight = priorityIds.includes(question.ticket_id) 
      ? priorityWeight 
      : 1;
    
    for (let i = 0; i < weight; i++) {
      weightedPool.push(question);
    }
  }
  
  const randomIndex = Math.floor(Math.random() * weightedPool.length);
  return weightedPool[randomIndex];
}

// Get random questions for exam (30 questions, no exclusions)
export function getExamQuestions(count: number = 30): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

// Get question preview text (first N characters)
export function getQuestionPreview(
  question: Question, 
  language: Language = 'en',
  maxLength: number = 50
): string {
  const text = question.question[language];
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

// Check if answer is correct
export function isAnswerCorrect(
  question: Question, 
  selectedIndex: number
): boolean {
  const answer = question.answers.find((a) => a.index === selectedIndex);
  return answer?.is_correct ?? false;
}

// Get correct answer index
export function getCorrectAnswerIndex(question: Question): number {
  const correctAnswer = question.answers.find((a) => a.is_correct);
  return correctAnswer?.index ?? -1;
}

// Get multiple questions by IDs
export function getQuestionsByIds(ticketIds: number[]): Question[] {
  return questions.filter((q) => ticketIds.includes(q.ticket_id));
}

// Get next question ID (for sequential navigation)
export function getNextQuestionId(currentId: number): number | null {
  const currentIndex = questions.findIndex((q) => q.ticket_id === currentId);
  if (currentIndex === -1 || currentIndex === questions.length - 1) {
    return null;
  }
  return questions[currentIndex + 1].ticket_id;
}

// Get previous question ID (for sequential navigation)
export function getPreviousQuestionId(currentId: number): number | null {
  const currentIndex = questions.findIndex((q) => q.ticket_id === currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return questions[currentIndex - 1].ticket_id;
}

// Get all ticket IDs
export function getAllTicketIds(): number[] {
  return questions.map((q) => q.ticket_id);
}

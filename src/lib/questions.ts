import { Question, Language, QuestionResponse } from './types';
import questionsData from './data/questions.json';

type PrevAndLastIds = {
  prev_ticket_id: number;
  next_ticket_id: number;
};

// Load questions from static JSON
const questions: Question[] = questionsData as Question[];

// Total number of questions
export const TOTAL_QUESTIONS = questions.length;

// Get all questions (use sparingly)
export function getAllQuestions(): Question[] {
  return questions;
}

// Get a single question by ticket_id
export function getQuestionById(ticketId: number): QuestionResponse | null {
  let questionIndex;

  const question = questions.find((q, index) => {
    if (q.ticket_id === ticketId) {
      questionIndex = index;
      return true;
    } else {
      return false;
    }
  });

  if (question && typeof questionIndex === 'number') {
    const { prev_ticket_id, next_ticket_id } = getPrevAndNextIds(questionIndex);
    return {
      ...question,
      prev_ticket_id,
      next_ticket_id
    };
  }
  return null;
}

// Get questions in a range (inclusive)
export function getQuestionsInRange(start: number, end: number): Question[] {
  return questions.filter(
    (q) => q.ticket_id >= start && q.ticket_id <= end
  );
}

// Get a random question, optionally excluding certain ticket_ids
export function getRandomQuestion(excludeIds: number[] = []): QuestionResponse | null {
  const available = questions.filter(
    (q) => !excludeIds.includes(q.ticket_id)
  );
  
  if (available.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * available.length);
  const { prev_ticket_id, next_ticket_id } = getPrevAndNextIds(randomIndex);
  return {
    ...available[randomIndex],
    prev_ticket_id,
    next_ticket_id
  };
}

// Get a weighted random question (for prioritizing weak questions)
export function getWeightedRandomQuestion(
  excludeIds: number[] = [],
  priorityIds: number[] = [],
  priorityWeight: number = 3
): QuestionResponse | null {
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
  const { prev_ticket_id, next_ticket_id } = getPrevAndNextIds(questions.indexOf(weightedPool[randomIndex]));
  return {
    ...weightedPool[randomIndex],
    prev_ticket_id,
    next_ticket_id
  };
}

// Get random questions for exam (30 questions, no exclusions)
// TODO: implement categorization and ensure balanced coverage of topics
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

function getPrevAndNextIds(index: number): PrevAndLastIds {
  const isLast = index === questions.length - 1;
  const isFirst = index === 0;

  const prev_ticket_id = isFirst
    ? questions[questions.length - 1].ticket_id
    : questions[index - 1].ticket_id;
  
  const next_ticket_id = isLast
    ? questions[0].ticket_id
    : questions[index + 1].ticket_id;

  return { prev_ticket_id, next_ticket_id };
}

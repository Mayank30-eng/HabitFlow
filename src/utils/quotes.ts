export interface MotivationalQuote {
  text: string;
  author: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  { text: "Your future is built by what you repeat today.", author: "HabitFlow Principle" },
  { text: "Every habit is a vote for the person you are becoming.", author: "James Clear" },
  { text: "Small actions, repeated consistently, create extraordinary change.", author: "Consistency First" },
  { text: "Progress is not perfection. It is the decision to return tomorrow.", author: "Daily Mindset" },
  { text: "Build a system that keeps you moving, even when motivation disappears.", author: "System Over Goals" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "Atomic Habits" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Commitment" },
  { text: "Missing once is a mistake. Missing twice is the start of a new habit.", author: "Never Miss Twice" },
  { text: "Momentum is quiet before it is unstoppable. Keep the chain unbroken.", author: "Momentum Law" },
  { text: "Success is the compound interest of self-improvement.", author: "Daily Compounding" },
  { text: "The quality of your life is the quality of your daily rituals.", author: "Ritual Design" },
  { text: "Show up for yourself today, especially when motivation feels absent.", author: "Identity First" },
  { text: "Consistency beats intensity every single time.", author: "Growth Law" },
  { text: "Identity change happens one small repetition at a time.", author: "Self Evolution" },
  { text: "Today's effort is tomorrow's baseline. Take the first step.", author: "Daily Action" },
  { text: "Be the architect of your habits, not the victim of your impulses.", author: "Daily Focus" },
];

const SESSION_QUOTE_KEY = 'habitflow_session_quote';
const LAST_INDEX_KEY = 'habitflow_last_quote_index';

/**
 * Get the current session quote, or select a new one.
 * If forceNew is true, selects a new quote distinct from the previous one.
 */
export const getOrSelectSessionQuote = (forceNew = false): MotivationalQuote => {
  if (!forceNew) {
    const cached = sessionStorage.getItem(SESSION_QUOTE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as MotivationalQuote;
      } catch {
        // Fall back to picking
      }
    }
  }

  const lastIndex = Number(sessionStorage.getItem(LAST_INDEX_KEY) ?? -1);
  let nextIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  if (nextIndex === lastIndex && MOTIVATIONAL_QUOTES.length > 1) {
    nextIndex = (nextIndex + 1) % MOTIVATIONAL_QUOTES.length;
  }
  sessionStorage.setItem(LAST_INDEX_KEY, String(nextIndex));

  const quote = MOTIVATIONAL_QUOTES[nextIndex];
  sessionStorage.setItem(SESSION_QUOTE_KEY, JSON.stringify(quote));
  window.dispatchEvent(new CustomEvent('habitflow:quote_updated', { detail: quote }));
  return quote;
};

/**
 * Clear current session quote on logout.
 */
export const clearSessionQuote = (): void => {
  sessionStorage.removeItem(SESSION_QUOTE_KEY);
  sessionStorage.removeItem('habitflow_show_quote_popup');
};

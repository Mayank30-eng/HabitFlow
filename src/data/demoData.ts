import type { Habit } from '../types';
import { generateId, getToday, subDays, addDays, getDaysInRange } from '../utils/helpers';

const createDemoHabits = (): Habit[] => {
  const today = getToday();
  const habits: Habit[] = [
    {
      id: generateId(),
      name: 'Morning Workout',
      category: 'Fitness',
      type: 'good',
      description: '30 min exercise every morning',
      frequency: 'daily',
      startDate: subDays(today, 60),
      createdAt: subDays(today, 60),
      history: [],
      order: 0,
    },
    {
      id: generateId(),
      name: 'Read 30 Pages',
      category: 'Learning',
      type: 'good',
      description: 'Read a book for 30 pages daily',
      frequency: 'daily',
      startDate: subDays(today, 45),
      createdAt: subDays(today, 45),
      history: [],
      order: 1,
    },
    {
      id: generateId(),
      name: 'Drink 3L Water',
      category: 'Health',
      type: 'good',
      description: 'Stay hydrated throughout the day',
      frequency: 'daily',
      startDate: subDays(today, 30),
      createdAt: subDays(today, 30),
      history: [],
      order: 2,
    },
    {
      id: generateId(),
      name: 'Meditate',
      category: 'Mindfulness',
      type: 'good',
      description: '10 minutes of meditation',
      frequency: 'daily',
      startDate: subDays(today, 40),
      createdAt: subDays(today, 40),
      history: [],
      order: 3,
    },
    {
      id: generateId(),
      name: 'No Sugar',
      category: 'Health',
      type: 'bad',
      description: 'Avoid sugary snacks and drinks',
      frequency: 'daily',
      startDate: subDays(today, 25),
      createdAt: subDays(today, 25),
      history: [],
      order: 4,
    },
    {
      id: generateId(),
      name: 'Limit Social Media',
      category: 'Productivity',
      type: 'bad',
      description: 'Less than 30 min social media per day',
      frequency: 'daily',
      startDate: subDays(today, 20),
      createdAt: subDays(today, 20),
      history: [],
      order: 5,
    },
    {
      id: generateId(),
      name: 'Deep Work Session',
      category: 'Productivity',
      type: 'good',
      description: '2 hours of focused work without distractions',
      frequency: 'daily',
      startDate: subDays(today, 35),
      createdAt: subDays(today, 35),
      history: [],
      order: 6,
    },
    {
      id: generateId(),
      name: 'Gratitude Journal',
      category: 'Mindfulness',
      type: 'good',
      description: 'Write 3 things you are grateful for',
      frequency: 'daily',
      startDate: subDays(today, 50),
      createdAt: subDays(today, 50),
      history: [],
      order: 7,
    },
  ];

  // Generate realistic history for each habit
  habits.forEach((habit) => {
    const range = getDaysInRange(habit.startDate, today);

    const baseRate = habit.type === 'good' ? 0.75 : 0.3;
    habit.history = range.map((date) => {
      const random = Math.random();
      // More realistic: some streaks, some misses
      const completed = random < baseRate;
      return { date, completed };
    });
  });

  return habits;
};

export default createDemoHabits;

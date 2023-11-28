export interface User {
  uid: string;
  email: string;
  name?: string;
  embodyGoal?: string;
  pointsGoal?: number;
  todos?: TodoItem[];
}

export interface TodoItem {
  id: string | null;
  label: string;
  points: number;
  checked: boolean;
}

export interface DayData {
  todos: TodoItem[];
  score: number;
  pointsGoal?: number;
  date?: string;
}
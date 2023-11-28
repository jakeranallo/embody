export interface User {
  uid: string;
  email: string;
  name?: string;
  embodyGoal?: string;
  pointsGoal?: number;
  todos?: TodoItem[]; // Assuming you have a Todo type defined
}

export interface TodoItem {
  id: string | null;
  label: string;
  points: number;
  checked: boolean;
}

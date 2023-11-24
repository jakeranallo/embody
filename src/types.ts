export interface User {
    uid: string;
    email: string;
    name?: string;
    embodyGoal?: string;
    pointsGoal?: number;
    todos?: Todo[]; // Assuming you have a Todo type defined
  }
  
export interface Todo {
    id: string;
    label: string;
    points: number;
    checked: boolean;
  }
import React, { useState } from "react";

interface TodoItem {
  id: number;
  label: string;
  points: number;
  checked: boolean;
}

interface ScoreDisplayProps {
  name: string;
  embodiment: string;
  totalScore: number;
  pointsGoal: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  name,
  embodiment,
  totalScore,
  pointsGoal,
}) => {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

  const isGoalReached = totalScore >= pointsGoal;
  const textColor = isGoalReached ? "green" : totalScore < 0 ? "red" : "black";

  return (
    <div>
      <h1>Hello {name}</h1>
      <h2>
        Your {dayOfWeek} as a {embodiment}
      </h2>
      <div style={{ color: textColor }}>
        <strong>Total Score:</strong> {totalScore} points
      </div>
      <div>
        <strong>Points Goal:</strong> {pointsGoal} points
      </div>
    </div>
  );
};

const TodoList: React.FC = () => {
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState<string>("");
  const [newItemPoints, setNewItemPoints] = useState<string>("0");
  const [pointsGoal, setPointsGoal] = useState<number>(100); // Default points goal
  const [isAddItemFormVisible, setIsAddItemFormVisible] =
    useState<boolean>(false);

  const addTodoItem = () => {
    if (newItemLabel.trim() === "" || isNaN(parseInt(newItemPoints))) return;

    const newTodoItem: TodoItem = {
      id: Date.now(),
      label: newItemLabel,
      points: parseInt(newItemPoints),
      checked: false,
    };

    setTodoList((prevTodoList) => [...prevTodoList, newTodoItem]);
    setNewItemLabel("");
    setNewItemPoints("0");
    setIsAddItemFormVisible(false);
  };

  const handlePointsChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9-]/g, "");
    setNewItemPoints(sanitizedValue);
  };

  const toggleTodoItem = (id: number) => {
    setTodoList((prevTodoList) =>
      prevTodoList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deleteTodoItem = (id: number) => {
    setTodoList((prevTodoList) =>
      prevTodoList.filter((item) => item.id !== id)
    );
  };

  const calculateScore = () => {
    return todoList.reduce(
      (acc, item) => (item.checked ? acc + item.points : acc),
      0
    );
  };

  return (
    <div>
      <div>
        <ScoreDisplay
          name="YourName"
          embodiment="Superhero"
          totalScore={calculateScore()}
          pointsGoal={pointsGoal}
        />
      </div>
      <ul>
        {todoList.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleTodoItem(item.id)}
            />
            <span>
              {item.label} ({item.points} points)
              <button onClick={() => deleteTodoItem(item.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      <button onClick={() => setIsAddItemFormVisible(!isAddItemFormVisible)}>
        {isAddItemFormVisible ? "Collapse Form" : "Add Item"}
      </button>
      {isAddItemFormVisible && (
        <div>
          <label>
            New Item:
            <input
              type="text"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
            />
          </label>
          <label>
            Points:
            <input
              type="text"
              value={newItemPoints}
              onChange={(e) => handlePointsChange(e.target.value)}
            />
          </label>
          <button onClick={addTodoItem}>Add</button>
        </div>
      )}
      <div>
        <label>
          Points Goal:
          <input
            type="number"
            value={pointsGoal}
            onChange={(e) => setPointsGoal(parseInt(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};

export default TodoList;

import React, { useState, useEffect } from "react";
import { User, TodoItem, DayData } from "../types";
import { getDatabase, ref, get, set, push, update } from "firebase/database";
import { Checkbox } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";

const TodoNew: React.FC<{ user: User }> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [localTodos, setLocalTodos] = useState<{ [todoId: string]: TodoItem }>(
    {}
  );
  const [historicData, setHistoricData] = useState<DayData[]>([]);
  const [newTodoLabel, setNewTodoLabel] = useState<string>("");
  const [newTodoPoints, setNewTodoPoints] = useState<number>(0);

  const calculateScore = (todos: { [todoId: string]: TodoItem }) => {
    if (typeof todos !== "object" || todos === null) {
      console.error("todos is not an object:", todos);
      return 0;
    }

    return Object.values(todos).reduce(
      (acc, item) => (item.checked ? acc + (item.points || 0) : acc),
      0
    );
  };

  const fetchData = async () => {
    try {
      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userDataFromDatabase = snapshot.val();

      if (userDataFromDatabase) {
        setUserData(userDataFromDatabase);
        setLocalTodos(userDataFromDatabase.todos || {});
        // console.log("User Data from Database:", userDataFromDatabase);
        return userDataFromDatabase; // Return the fetched data
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error.message);
    }
  };

  // Fetch historic data
  const fetchHistoricData = async () => {
    try {
      const database = getDatabase();
      const historyRef = ref(database, `users/${user.uid}/history`);
      const snapshot = await get(historyRef);
      const historicDataFromDatabase: { [date: string]: DayData } =
        snapshot.val() || {};

      const formattedHistoricData = Object.keys(historicDataFromDatabase).map(
        (date) => ({
          date,
          ...historicDataFromDatabase[date],
        })
      );

      setHistoricData(formattedHistoricData);
      console.log("fetched data:", historicData);
    } catch (error: any) {
      console.error("Error fetching historic data:", error.message);
    }
  };

  // Fetch historic data when the selected day or user ID changes
  useEffect(() => {
    fetchHistoricData();
  }, [user.uid, localTodos, userData?.todos]);

  const saveHistoricData = async (
    date: string,
    pointsGoal: number,
    todos: TodoItem[]
  ) => {
    const database = getDatabase();
    try {
      const historicEntryRef = ref(
        database,
        `users/${user.uid}/history/${date}`
      );
      const historicEntry: DayData = {
        todos,
        score: calculateScore(localTodos),
        pointsGoal,
      };

      await set(historicEntryRef, historicEntry);
    } catch (error: any) {
      console.error("Error saving historic data:", error.message);
    }
    fetchHistoricData();
  };

  // Save historic data when todoList or pointsGoal changes
  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];

    // Check if userData and userData.todos are defined
    if (userData && userData.todos) {
      saveHistoricData(date, userData.pointsGoal || 0, userData.todos);
    } else {
      // Handle the case when userData.todos is undefined
      console.error("userData or userData.todos is undefined");
      // You might want to add some fallback behavior or logging here
    }
  }, [user.uid, userData?.pointsGoal, localTodos]);

  const handleCheckboxChange = async (todoId: string | any) => {
    try {
      console.log("Start of handleCheckboxChange");

      if (!userData) {
        console.error("User data is undefined");
        return;
      }

      setLocalTodos((prevLocalTodos) => {
        const updatedLocalTodos = {
          ...prevLocalTodos,
          [todoId]: {
            ...prevLocalTodos[todoId],
            checked: !prevLocalTodos[todoId]?.checked || false,
          },
        };
        return updatedLocalTodos;
      }); // Update the local state using the updater function

      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);

      if (!userData.todos || !userData.todos[todoId]) {
        console.error("Todo data is undefined");
        return;
      }

      const updatedTodos = {
        ...userData.todos,
        [todoId]: {
          ...userData.todos[todoId],
          checked: !userData.todos[todoId]?.checked || false,
        },
      };

      console.log("Before updating todos:", userData.todos);

      await update(userRef, { todos: updatedTodos });

      console.log("After updating todos:", updatedTodos);

      // Fetch the latest data after the update
      await fetchData();

      console.log("Checkbox updated successfully");
    } catch (error: any) {
      console.error("Error updating checkbox:", error.message);
    }
  };

  const handleAddTodo = async () => {
    try {
      const todoId = push(ref(getDatabase(), `users/${user.uid}/todos`)).key;
      const newTodo: TodoItem = {
        id: todoId,
        label: newTodoLabel,
        points: newTodoPoints,
        checked: false,
      };

      // Update local state
      setLocalTodos((prevLocalTodos) => ({
        ...prevLocalTodos,
        [todoId as any]: newTodo,
      }));

      // Update Firebase
      await update(ref(getDatabase(), `users/${user.uid}/todos`), {
        [todoId as any]: newTodo,
      });

      // Clear the form
      setNewTodoLabel("");
      setNewTodoPoints(0);

      console.log("Todo added successfully");
    } catch (error: any) {
      console.error("Error adding todo:", error.message);
    }
    fetchData();
  };

  // Fetch user data when the selected day or user ID changes
  useEffect(() => {
    fetchData();
  }, [user.uid]); // Add any other dependencies that affect your fetch logic

  if (!userData) {
    // If user data is not available, render a loading state or handle it as needed
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ScoreDisplay
        name={userData?.name ?? ""}
        embodiment={userData?.embodyGoal ?? ""}
        totalScore={calculateScore(localTodos)}
        pointsGoal={userData?.pointsGoal ?? 0}
        header
      />
      {Object.entries(localTodos).map(([todoId, todo], index) => (
        <Checkbox
          key={todoId}
          label={todo.label}
          checked={todo.checked || false}
          onChange={() => handleCheckboxChange(todoId)}
        />
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Handle adding new todo here
          handleAddTodo();
        }}
      >
        <label>
          Todo Label:
          <input
            type="text"
            value={newTodoLabel}
            onChange={(e) => setNewTodoLabel(e.target.value)}
          />
        </label>
        <label>
          Todo Points:
          <input
            type="number"
            value={newTodoPoints}
            onChange={(e) => setNewTodoPoints(Number(e.target.value))}
          />
        </label>
        <button type="submit">Add Todo</button>
      </form>

      {/* Display historic data */}
      <div>
        <h2>Historic Data</h2>
        {historicData.map(({ date, pointsGoal, score, todos }, index) => (
          <div key={index}>
            <p>Date: {date}</p>
            <p>Points Goal: {pointsGoal}</p>
            <p>Score: {score}</p>
            <ul>
              {Object.values(todos)
                .filter((todo: TodoItem) => todo.checked)
                .map((todo: TodoItem, todoIndex) => (
                  <li key={todoIndex}>{todo.label}</li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
export default TodoNew;

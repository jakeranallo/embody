import React, { useState, useEffect } from "react";
import { User, TodoItem } from "../types";
import { getDatabase, ref, get, set, push, update } from "firebase/database";
import { Checkbox } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";

const TodoNew: React.FC<{ user: User }> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [localTodos, setLocalTodos] = useState<{ [todoId: string]: TodoItem }>(
    {}
  );

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
        console.log("User Data from Database:", userDataFromDatabase);
        return userDataFromDatabase; // Return the fetched data
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error.message);
    }
  };

  const handleCheckboxChange = async (todoId: string | any) => {
    try {
      console.log("Start of handleCheckboxChange");

      if (!userData) {
        console.error("User data is undefined");
        return;
      }

      const updatedLocalTodos = {
        ...localTodos,
        [todoId]: {
          ...localTodos[todoId],
          checked: !localTodos[todoId]?.checked || false,
        },
      };

      setLocalTodos(updatedLocalTodos); // Update the local state immediately

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

  // Fetch user data when the selected day or user ID changes
  useEffect(() => {
    fetchData();
  }, [user.uid, user.todos]); // Add any other dependencies that affect your fetch logic

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
    </div>
  );
};
export default TodoNew;

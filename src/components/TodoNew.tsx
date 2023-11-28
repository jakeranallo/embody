import React, { useState, useEffect } from "react";
import { User } from "../types";
import { getDatabase, ref, get, set, push, update } from "firebase/database";
import { Checkbox } from "@mantine/core";

const TodoNew: React.FC<{ user: User }> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(null);

  const fetchData = async () => {
    try {
      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userDataFromDatabase = snapshot.val();

      if (userDataFromDatabase) {
        setUserData(userDataFromDatabase);
        console.log("User Data from Database:", userDataFromDatabase);
        return userDataFromDatabase; // Return the fetched data
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error.message);
    }
  };

  const handleCheckboxChange = async (todoId: string | any) => {
    try {
      const database = getDatabase();

      console.log("Start of handleCheckboxChange");

      if (!userData) {
        console.error("User data is undefined");
        return;
      }

      const userRef = ref(database, `users/${user.uid}`);

      if (!userData.todos || !userData.todos[todoId]) {
        console.error("Todo data is undefined");
        return;
      }

      console.log("Before updating todos:", userData.todos);

      const updatedTodos = {
        ...userData.todos,
        [todoId]: {
          ...userData.todos[todoId],
          checked: !userData.todos[todoId]?.checked || false,
        },
      };

      console.log("After updating todos:", updatedTodos);

      await update(userRef, { todos: updatedTodos });

      console.log("Checkbox updated successfully");
    } catch (error: any) {
      console.error("Error updating checkbox:", error.message);
    }
    fetchData();
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
      {Object.entries(userData?.todos || {}).map(([todoId, todo], index) => (
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

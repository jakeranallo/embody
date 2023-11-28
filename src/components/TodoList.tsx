import React, { useState, useEffect } from "react";
import { useTrail, animated } from "react-spring";
import { Input, Button, Container, Flex } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";
import CustomCheckbox from "./CustomCheckbox";
import { Tabs, rem } from "@mantine/core";
import { IconSunset2, IconCalendar, IconSettings } from "@tabler/icons-react";
import { User } from "../types";
import { signOut } from "firebase/auth";
import { auth, database } from "../firebase";
import { getDatabase, ref, get, set, push } from "firebase/database";

interface TodoItem {
  id: string | null;
  label: string;
  points: number;
  checked: boolean;
}

interface DayData {
  todos: TodoItem[];
  score: number;
  pointsGoal?: number;
}

const TodoList: React.FC<{ user: User }> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(null);

  const [newEmbodyGoal, setNewEmbodyGoal] = useState<string>("");
  const [newPointsGoal, setNewPointsGoal] = useState<number>(0);
  const [newName, setNewName] = useState<string>("");

  const [currentDay, setCurrentDay] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState<string>("");
  const [newItemPoints, setNewItemPoints] = useState<string>("");
  const [isAddItemFormVisible, setIsAddItemFormVisible] =
    useState<boolean>(false);
  const [isSettingsChanged, setSettingsChanged] = useState<boolean>(false);
  const iconStyle = { width: rem(24), height: rem(24) };
  const listTrail = useTrail(Object.keys(userData?.todos || {}).length, {
    opacity: 1,
    transform: "translate3d(0,0,0)",
    from: { opacity: 0, transform: "translate3d(50px,0,0)" },
  });

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

  const calculateScore = () => {
    const todos = userData?.todos || {};

    if (typeof todos !== "object" || todos === null) {
      // Handle the case where todos is not an object
      console.error("userData.todos is not an object:", todos);
      return 0; // or handle it based on your specific use case
    }

    return Object.values(todos).reduce(
      (acc, item) => (item.checked ? acc + (item.points || 0) : acc),
      0
    );
  };

  const saveHistoricData = async (
    date: string,
    pointsGoal: number,
    todos: TodoItem[]
  ) => {
    try {
      const historicEntryRef = ref(
        database,
        `users/${user.uid}/history/${date}`
      );
      const historicEntry: DayData = {
        todos,
        score: calculateScore(),
        pointsGoal, // Include pointsGoal in the historic entry
      };

      await set(historicEntryRef, historicEntry);
      console.log(`Historic data for ${date} saved successfully.`);
    } catch (error: any) {
      console.error("Error saving historic data:", error.message);
    }
  };

  // Fetch user data when the selected day or user ID changes
  useEffect(() => {
    fetchData();
  }, [currentDay, user.uid]); // Add any other dependencies that affect your fetch logic

  // Reset todos for a new day
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date().toISOString().split("T")[0];
      if (currentDate !== currentDay) {
        resetDailyTodos();
        setCurrentDay(currentDate);
      }
    }, 1000 * 60 * 60); // Check every hour

    return () => clearInterval(interval);
  }, [currentDay, user.uid]); // Updated dependencies

  // Save historic data when todoList or pointsGoal changes
  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    saveHistoricData(date, userData?.pointsGoal || 0, todoList);
  }, [currentDay, todoList, user.uid, userData?.pointsGoal]);

  if (!userData) {
    // If user data is not available, render a loading state or handle it as needed
    return <div>Loading...</div>;
  }

  const resetDailyTodos = async () => {
    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      await set(todosRef, null);
      setTodoList([]);
      console.log("Todos reset for the day.");
    } catch (error: any) {
      console.error("Error resetting todos for the day:", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  const handleUserDataUpdate = async (
    newEmbodyGoal: string,
    newName: string,
    newPointsGoal: number
  ) => {
    try {
      // Update embodyGoal
      const embodyGoalRef = ref(database, `users/${user.uid}/embodyGoal`);
      await set(embodyGoalRef, newEmbodyGoal);

      // Update name
      const nameRef = ref(database, `users/${user.uid}/name`);
      await set(nameRef, newName);

      // Update pointsGoal
      const pointsGoalRef = ref(database, `users/${user.uid}/pointsGoal`);
      await set(pointsGoalRef, newPointsGoal);

      // Fetch the updated user data and update the local state
      const updatedSnapshot = await get(ref(database, `users/${user.uid}`));
      const updatedUserData = updatedSnapshot.val();

      if (updatedUserData) {
        setUserData((prevUser) => ({
          ...prevUser!,
          ...updatedUserData,
        }));
        setSettingsChanged(false);
      }
    } catch (error: any) {
      console.error("Error updating user data:", error.message);
    }
  };

  const handlePointsChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9-]/g, "");
    setNewItemPoints(sanitizedValue);
  };

  const addTodoItem = async () => {
    if (newItemLabel.trim() === "" || isNaN(parseInt(newItemPoints))) return;

    // Obtain a reference to the 'todos' node and push a new child
    const todosRef = ref(database, `users/${user.uid}/todos`);
    const newTodoRef = push(todosRef);

    const newTodoItem: TodoItem = {
      id: newTodoRef.key || null,
      label: newItemLabel,
      points: parseInt(newItemPoints),
      checked: false,
    };

    try {
      // Set the new todo item with the generated key
      await set(newTodoRef, newTodoItem);

      // Update the local state (todoList)
      setTodoList((prevTodoList) => [...prevTodoList, newTodoItem]);
      setNewItemLabel("");
      setNewItemPoints("");
      setIsAddItemFormVisible(false);

      // Update the historic entry for the day
      // Update the historic entry for the day
      const date = new Date().toISOString().split("T")[0];
      await saveHistoricData(
        date,
        userData?.pointsGoal || 0,
        todoList.concat(newTodoItem)
      );
    } catch (error: any) {
      console.error("Error adding todo item to the database:", error.message);
    }
    fetchData();
  };

  const toggleTodoItem = async (id: string | null) => {
    if (!id) {
      // If id is null, do nothing
      return;
    }

    try {
      const updatedList = todoList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );

      // Update the checked status in the database
      const databaseRef = ref(
        database,
        `users/${user.uid}/todos/${id}/checked`
      );
      const newCheckedValue = !updatedList.find((todo) => todo.id === id)
        ?.checked;
      await set(databaseRef, newCheckedValue);

      // Update the historic entry for the day
      const date = new Date().toISOString().split("T")[0];
      saveHistoricData(date, userData?.pointsGoal || 0, updatedList);

      // Update the state and fetch data in sequence
      setTodoList(updatedList);
      await fetchData();
    } catch (error: any) {
      console.error("Error updating todo item:", error.message);
      // Handle error if necessary
    }
  };
  

  const deleteTodoItem = async (id: string | null) => {
    console.log("Delete todo item called with id:", id);

    if (!id) {
      // If id is null, do nothing
      return;
    }

    // Update the local state (todoList and calendar)
    setTodoList((prevTodoList) =>
      prevTodoList.filter((item) => item.id !== id)
    );

    try {
      // Remove the item from the database
      const databaseRef = ref(database, `users/${user.uid}/todos/${id}`);

      // Update the historic entry for the day
      const date = new Date().toISOString().split("T")[0];
      await saveHistoricData(
        date,
        userData?.pointsGoal || 0,
        todoList.filter((item) => item.id !== id)
      );

      await set(databaseRef, null);
    } catch (error: any) {
      console.error(
        "Error deleting todo item from the database:",
        error.message
      );
    }

    // After deleting todo, refetch user data
    fetchData();
  };

  const handlePointsGoalChange = (value: string) => {
    setNewPointsGoal(parseInt(value));
    setSettingsChanged(true);
  };

  const handleEmbodyChange = (value: string) => {
    setNewEmbodyGoal(value);
    setSettingsChanged(true);
  };

  const handleNameChange = (value: string) => {
    setNewName(value);
    setSettingsChanged(true);
  };

  const isAddButtonDisabled =
    newItemLabel.trim() === "" || newItemPoints.trim() === "";

  return (
    <Container>
      <Tabs defaultValue="today">
        <Tabs.List>
          <Tabs.Tab
            value="today"
            leftSection={<IconSunset2 style={iconStyle} />}
          >
            Today
          </Tabs.Tab>
          <Tabs.Tab
            value="calendar"
            leftSection={<IconCalendar style={iconStyle} />}
          >
            Calendar
          </Tabs.Tab>
          <Tabs.Tab
            value="settings"
            leftSection={<IconSettings style={iconStyle} />}
          >
            Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="today">
          <Container>
            <ScoreDisplay
              name={userData?.name ?? ""}
              embodiment={userData?.embodyGoal ?? ""}
              totalScore={calculateScore()}
              pointsGoal={userData?.pointsGoal ?? 0}
              header
            />
            <ul>
              {Object.entries(userData?.todos || {}).map(
                ([todoId, todo], index) => {
                  if (!todo) {
                    console.error(`Invalid todoId or todo for id: ${todoId}`);
                    return null; // or handle the error in your preferred way
                  }

                  return (
                    <animated.li key={todoId} style={listTrail[index]}>
                      <CustomCheckbox
                        label={`${todo.label ?? ""} (${
                          todo.points ?? ""
                        } points)`}
                        checked={todo.checked ?? false}
                        onChange={() => toggleTodoItem(todoId)}
                      />
                      <Button onClick={() => deleteTodoItem(todoId)}>
                        Delete
                      </Button>
                    </animated.li>
                  );
                }
              )}
            </ul>

            <Button
              onClick={() => setIsAddItemFormVisible(!isAddItemFormVisible)}
            >
              {isAddItemFormVisible ? "Collapse Form" : "Add Item"}
            </Button>
            {isAddItemFormVisible && (
              <Flex>
                <Input.Wrapper label="New Item">
                  <Input
                    placeholder="Todo Title"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Points">
                  <Input
                    type="number"
                    placeholder="Points"
                    value={newItemPoints}
                    onChange={(e) => handlePointsChange(e.target.value)}
                  />
                </Input.Wrapper>
                <Button onClick={addTodoItem} disabled={isAddButtonDisabled}>
                  Add
                </Button>
              </Flex>
            )}
          </Container>
        </Tabs.Panel>

        <Tabs.Panel value="calendar">
          <Container></Container>
        </Tabs.Panel>

        <Tabs.Panel value="settings">
          <Container>
            <Input.Wrapper label="Points Goal">
              <Input
                type="number"
                value={newPointsGoal.toString()}
                onChange={(e) => handlePointsGoalChange(e.target.value)}
              />
            </Input.Wrapper>
            <Input.Wrapper label="Embody Goal">
              <Input
                type="text"
                id="newEmbodyGoal"
                value={newEmbodyGoal}
                onChange={(e) => handleEmbodyChange(e.target.value)}
              />
            </Input.Wrapper>
            <Input.Wrapper label="Name">
              <Input
                type="text"
                id="newName"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </Input.Wrapper>
            <Button
              onClick={(e) =>
                handleUserDataUpdate(newEmbodyGoal, newName, newPointsGoal)
              }
              disabled={!isSettingsChanged}
            >
              Submit
            </Button>
            <button onClick={handleSignOut}>Sign Out</button>
          </Container>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default TodoList;

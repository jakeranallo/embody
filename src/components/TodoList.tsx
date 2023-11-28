import React, { useState, useEffect } from "react";
import { useTrail, animated } from "react-spring";
import {
  Input,
  Button,
  Container,
  Flex,
} from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";
import CustomCheckbox from "./CustomCheckbox";
import { Tabs, rem } from "@mantine/core";
import { IconSunset2, IconCalendar, IconSettings } from "@tabler/icons-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
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

  const [calendar, setCalendar] = useState<Record<string, DayData>>({});
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

  useEffect(() => {
    // Update the todo list when the selected day changes
    setTodoList(calendar[currentDay]?.todos || []);
  }, [calendar, currentDay]);

  const fetchData = async () => {
    try {
      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userDataFromDatabase = snapshot.val();

      if (userDataFromDatabase) {
        setUserData(userDataFromDatabase);
        console.log(userDataFromDatabase);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error.message);
    }
  };

  useEffect(() => {
    // Fetch user data when the selected day or user ID changes
    fetchData();
  }, [user.uid, currentDay]); // Updated dependencies

  if (!userData) {
    // If user data is not available, render a loading state or handle it as needed
    return <div>Loading...</div>;
  }

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

      // Update the local state (todoList and calendar)
      setTodoList((prevTodoList) => [...prevTodoList, newTodoItem]);
      setNewItemLabel("");
      setNewItemPoints("");
      setIsAddItemFormVisible(false);

      // Update the calendar with the new todo item
      const updatedCalendar = { ...calendar };
      if (!updatedCalendar[currentDay]) {
        updatedCalendar[currentDay] = { todos: [], score: 0 };
      }
      updatedCalendar[currentDay].todos.push(newTodoItem);

      // Update the score
      updatedCalendar[currentDay].score += newTodoItem.checked
        ? newTodoItem.points
        : 0;

      setCalendar(updatedCalendar);
    } catch (error: any) {
      console.error("Error adding todo item to the database:", error.message);
    }
    fetchData();
  };

  const handlePointsChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9-]/g, "");
    setNewItemPoints(sanitizedValue);
  };

  const toggleTodoItem = async (id: string | null) => {
    if (!id) {
      // If id is null, do nothing
      return;
    }

    setTodoList((prevTodoList) =>
      prevTodoList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );

    // Update the calendar with the new checked status
    const updatedCalendar = { ...calendar };
    if (!updatedCalendar[currentDay]) {
      updatedCalendar[currentDay] = { todos: [], score: 0 };
    }
    const updatedTodo = updatedCalendar[currentDay].todos.find(
      (todo) => todo.id === id
    );
    if (updatedTodo) {
      updatedTodo.checked = !updatedTodo.checked;
      updatedCalendar[currentDay].score += updatedTodo.checked
        ? updatedTodo.points
        : -updatedTodo.points;
    }

    setCalendar(updatedCalendar);

    try {
      // Update the checked status in the database
      const databaseRef = ref(
        database,
        `users/${user.uid}/todos/${id}/checked`
      );
      await set(databaseRef, !updatedTodo?.checked);
    } catch (error: any) {
      console.error(
        "Error updating checked status in the database:",
        error.message
      );

      // If there's an error with the database update, you may want to rollback
      // the local state changes or handle the error in some other way.
    }
    fetchData();
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

    // Update the calendar by removing the todo item
    const updatedCalendar = { ...calendar };
    if (!updatedCalendar[currentDay]) {
      updatedCalendar[currentDay] = { todos: [], score: 0 };
    }
    const deletedTodo = updatedCalendar[currentDay].todos.find(
      (todo) => todo.id === id
    );
    if (deletedTodo) {
      updatedCalendar[currentDay].score -= deletedTodo.checked
        ? deletedTodo.points
        : 0;
      updatedCalendar[currentDay].todos = updatedCalendar[
        currentDay
      ].todos.filter((todo) => todo.id !== id);
    }

    setCalendar(updatedCalendar);

    try {
      // Remove the item from the database
      const databaseRef = ref(database, `users/${user.uid}/todos/${id}`);
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

  const calculateScore = () => {
    const todos = userData?.todos || {};
  
    if (typeof todos !== 'object' || todos === null) {
      // Handle the case where todos is not an object
      console.error("userData.todos is not an object:", todos);
      return 0; // or handle it based on your specific use case
    }
  
    return Object.values(todos).reduce((acc, item) => (item.checked ? acc + (item.points || 0) : acc), 0);
  };

  const handleDayChange = (value: any) => {
    const selectedDay = new Date(value).toLocaleDateString("en-US");
    setCurrentDay(selectedDay);
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
          <Container>
            <Calendar onChange={handleDayChange} value={new Date(currentDay)} />
            <ul>
              {calendar[currentDay]?.todos.map((item) => (
                <li key={item.id}>
                  <ScoreDisplay
                    name="YourName"
                    embodiment="Superhero"
                    totalScore={calendar[currentDay]?.score || 0}
                    pointsGoal={userData?.pointsGoal ?? 0}
                  />
                  <CustomCheckbox
                    label={`${item.label} (${item.points} points)`}
                    checked={item.checked}
                    onChange={() => toggleTodoItem(item.id)}
                  />
                </li>
              ))}
            </ul>
          </Container>
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

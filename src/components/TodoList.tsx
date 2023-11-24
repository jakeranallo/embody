import React, { useState, useEffect } from "react";
import { useTrail, animated } from "react-spring";
import { Input, Button, Container, Box, Flex } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";
import CustomCheckbox from "./CustomCheckbox";
import { Tabs, rem } from "@mantine/core";
import { IconSunset2, IconCalendar, IconSettings } from "@tabler/icons-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { User } from "../types";
import { signOut } from "firebase/auth";
import { auth, database } from "../firebase";
import { getDatabase, ref, get, set } from "firebase/database";

interface TodoItem {
  id: number;
  label: string;
  points: number;
  checked: boolean;
}

interface DayData {
  todos: TodoItem[];
  score: number;
}

const TodoList: React.FC<{ user: User }> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [newEmbodyGoal, setNewEmbodyGoal] = useState<string>('');
  const [calendar, setCalendar] = useState<Record<string, DayData>>({});
  const [currentDay, setCurrentDay] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState<string>("");
  const [newItemPoints, setNewItemPoints] = useState<string>("");
  const [pointsGoal, setPointsGoal] = useState<number>(100);
  const [isAddItemFormVisible, setIsAddItemFormVisible] =
    useState<boolean>(false);
  const [settingsPointsGoal, setSettingsPointsGoal] =
    useState<number>(pointsGoal);
  const [isSettingsChanged, setSettingsChanged] =
    useState<boolean>(false);
  const iconStyle = { width: rem(24), height: rem(24) };
  const listTrail = useTrail(todoList.length, {
    opacity: 1,
    transform: "translate3d(0,0,0)",
    from: { opacity: 0, transform: "translate3d(50px,0,0)" },
  });

  useEffect(() => {
    // Update the todo list when the selected day changes
    setTodoList(calendar[currentDay]?.todos || []);
  }, [calendar, currentDay]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const database = getDatabase();
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userDataFromDatabase = snapshot.val();

        if (userDataFromDatabase) {
          setUserData(userDataFromDatabase);
        }
      } catch (error: any) {
        console.error("Error fetching user data:", error.message);
      }
    };

    fetchData();
  }, [user.uid]);

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Assuming you have the reference to the authentication instance
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  const handleEmbodyGoalUpdate = async (newEmbodyGoal: string) => {
    try {
      const userRef = ref(database, `users/${user.uid}/embodyGoal`);
      await set(userRef, newEmbodyGoal);

      // Fetch the updated user data and update the local state
      const updatedSnapshot = await get(ref(database, `users/${user.uid}`));
      const updatedUserData = updatedSnapshot.val();

      if (updatedUserData) {
        setUserData((prevUser) => ({
          ...prevUser!,
          ...updatedUserData,
        }));
      }
    } catch (error:any) {
      console.error('Error updating embodyGoal:', error.message);
    }
  };

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
  };

  const deleteTodoItem = (id: number) => {
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
  };

  const calculateScore = () => {
    return todoList.reduce(
      (acc, item) => (item.checked ? acc + item.points : acc),
      0
    );
  };

  const handleDayChange = (value: any) => {
    const selectedDay = new Date(value).toLocaleDateString("en-US");
    setCurrentDay(selectedDay);
  };

  const submitSettings = () => {
    setPointsGoal(settingsPointsGoal);
    handleEmbodyGoalUpdate(newEmbodyGoal)
    setSettingsChanged(false);
  };

  const handlePointsGoalChange = (value: string) => {
    setPointsGoal(parseInt(value));
    setSettingsChanged(true);
  };

  const handleEmbodyChange = (value: string) => {
    setNewEmbodyGoal(value);
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
              pointsGoal={pointsGoal}
              header
            />
            <ul>
              {listTrail.map((style, index) => (
                <animated.li key={todoList[index].id} style={style}>
                  <CustomCheckbox
                    label={`${todoList[index].label} (${todoList[index].points} points)`}
                    checked={todoList[index].checked}
                    onChange={() => toggleTodoItem(todoList[index].id)}
                  />
                  <Button onClick={() => deleteTodoItem(todoList[index].id)}>
                    Delete
                  </Button>
                </animated.li>
              ))}
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
                    pointsGoal={pointsGoal}
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
                value={settingsPointsGoal.toString()}
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
            <Button onClick={submitSettings} disabled={!isSettingsChanged}>
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

import React, { useState } from "react";
import { useTrail, animated } from "react-spring";
import { Input, Button, Container, Box, Flex } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";
import CustomCheckbox from "./CustomCheckbox";
import { Tabs, rem } from "@mantine/core";
import Calendar from 'react-calendar'
import {
  IconSunset2,
  IconCalendar,
  IconSettings,
} from "@tabler/icons-react";

interface TodoItem {
  id: number;
  label: string;
  points: number;
  checked: boolean;
}

const TodoList: React.FC = () => {
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState<string>("");
  const [newItemPoints, setNewItemPoints] = useState<string>("");
  const [pointsGoal, setPointsGoal] = useState<number>(100);
  const [isAddItemFormVisible, setIsAddItemFormVisible] =
    useState<boolean>(false);
  const [settingsPointsGoal, setSettingsPointsGoal] =
    useState<number>(pointsGoal);
  const [isPointsGoalChanged, setIsPointsGoalChanged] =
    useState<boolean>(false);
  const iconStyle = { width: rem(24), height: rem(24) };

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

  // React Spring animation configuration for the entire list
  const listTrail = useTrail(todoList.length, {
    opacity: 1,
    transform: "translate3d(0,0,0)",
    from: { opacity: 0, transform: "translate3d(50px,0,0)" },
  });

  const handlePointsGoalChange = (value: string) => {
    const newPointsGoal = parseInt(value);
    setSettingsPointsGoal(newPointsGoal);
    setIsPointsGoalChanged(newPointsGoal !== pointsGoal);
  };

  const submitPointsGoal = () => {
    setPointsGoal(settingsPointsGoal);
    setIsPointsGoalChanged(false);
  };

  const isAddButtonDisabled =
    newItemLabel.trim() === "" || isNaN(parseInt(newItemPoints));

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
              name="YourName"
              embodiment="Superhero"
              totalScore={calculateScore()}
              pointsGoal={pointsGoal}
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
                    placeholder="New Item"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Points">
                  <Input
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

        <Tabs.Panel value="calendar"><Calendar/></Tabs.Panel>

        <Tabs.Panel value="settings">
          <Container>
            <Input.Wrapper label="Points Goal">
              <Input
                type="number"
                placeholder="Points Goal"
                value={settingsPointsGoal.toString()}
                onChange={(e) => handlePointsGoalChange(e.target.value)}
              />
            </Input.Wrapper>
            <Button
              onClick={submitPointsGoal}
              disabled={!isPointsGoalChanged}
            >
              Submit
            </Button>
          </Container>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default TodoList;

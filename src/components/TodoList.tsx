import React, { useState } from "react";
import { useTrail, animated } from "react-spring";
import { Checkbox, Input, Button, Container, Grid } from "@mantine/core";
import ScoreDisplay from "./ScoreDisplay";
import CustomCheckbox from "./CustomCheckbox";

interface TodoItem {
  id: number;
  label: string;
  points: number;
  checked: boolean;
}

const TodoList: React.FC = () => {
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState<string>("");
  const [newItemPoints, setNewItemPoints] = useState<string>("0");
  const [pointsGoal, setPointsGoal] = useState<number>(100);
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

  // React Spring animation configuration for the entire list
  const listTrail = useTrail(todoList.length, {
    opacity: 1,
    transform: "translate3d(0,0,0)",
    from: { opacity: 0, transform: "translate3d(50px,0,0)" },
  });

  return (
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
      <Button onClick={() => setIsAddItemFormVisible(!isAddItemFormVisible)}>
        {isAddItemFormVisible ? "Collapse Form" : "Add Item"}
      </Button>
      {isAddItemFormVisible && (
        <Grid>
          <Input
            placeholder="New Item"
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
          />
          <Input
            placeholder="Points"
            value={newItemPoints}
            onChange={(e) => handlePointsChange(e.target.value)}
          />
          <Button onClick={addTodoItem}>Add</Button>
        </Grid>
      )}
      <Grid>
        <Input
          type="number"
          placeholder="Points Goal"
          value={pointsGoal.toString()}
          onChange={(e) => setPointsGoal(parseInt(e.target.value))}
        />
      </Grid>
    </Container>
  );
};

export default TodoList;

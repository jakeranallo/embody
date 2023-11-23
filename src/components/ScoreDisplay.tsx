import React, { useState, useEffect } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface ScoreDisplayProps {
  name: string;
  embodiment: string;
  totalScore: number;
  pointsGoal: number;
  header?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  name,
  embodiment,
  totalScore,
  pointsGoal,
  header,
}) => {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

  const greetings = [
    "Hello",
    "Greetings",
    "Hi there",
    "Welcome",
    "Good day",
    "Salutations",
    "Hey",
    "Howdy",
    "Hola",
    "Bonjour",
    "Ciao",
    "Namaste",
    "Aloha",
    "Shalom",
    "Yo",
    "What’s up",
    "Sup",
    "Hiya",
    "Cheers",
    "Hail",
  ];

  const getRandomGreeting = () => {
    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  };

  const [greeting, setGreeting] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Calculate progress as a percentage
    const calculatedProgress = (totalScore / pointsGoal) * 100;
    setProgress(calculatedProgress);
  }, [totalScore, pointsGoal]);

  useEffect(() => {
    // Run this effect only once on component mount
    setGreeting(getRandomGreeting());
  }, []); // Empty dependency array means this effect runs once on mount

  const isGoalReached = totalScore >= pointsGoal;
  const textColor = isGoalReached ? "green" : totalScore < 0 ? "red" : "black";

  return (
    <div>
      {header && (
        <div>
          <h1>
            {greeting} {name}
          </h1>
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
      )}
      <div style={{ width: "100px", margin: "20px auto" }}>
        <CircularProgressbar
          value={progress}
          text={`${progress.toFixed(2)}%`}
        />
      </div>
    </div>
  );
};

export default ScoreDisplay;

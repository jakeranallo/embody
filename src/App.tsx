import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./firebase";
import TodoList from "./components/TodoList";
import { User } from "./types";

const App: React.FC = () => {
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [name, setName] = useState("");
  const [embodyGoal, setEmbodyGoal] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser ? (authUser as User) : null);
      console.log(authUser ? authUser : "No user detected");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signUpEmail,
        signUpPassword
      );
      const authUser = userCredential.user;
      const userData: User = {
        uid: authUser.uid,
        email: authUser.email || '',
        pointsGoal: 0,
        todos: [],
        name,
        embodyGoal,
      };

      await set(ref(database, `users/${authUser.uid}`), userData);
    } catch (error: any) {
      console.error("Error signing up:", error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
    } catch (error: any) {
      console.error("Error signing in:", error.message);
    }
  };

  return (
    <div>
      {user ? (
        <TodoList user={user} />
      ) : (
        <>
          <h2>Sign Up</h2>
          <input
            type="email"
            placeholder="Email"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Embody Goal"
            value={embodyGoal}
            onChange={(e) => setEmbodyGoal(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
          />
          <button onClick={handleSignUp}>Sign Up</button>

          <h2>Sign In</h2>
          <input
            type="email"
            placeholder="Email"
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={signInPassword}
            onChange={(e) => setSignInPassword(e.target.value)}
          />
          <button onClick={handleSignIn}>Sign In</button>
        </>
      )}
    </div>
  );
};

export default App;

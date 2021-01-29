import "./normalize.css";
import "./styles.scss";

import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import RoomsList from "./components/RoomsList";
import Enter from "./components/Enter";
import Form from "./components/Form";
import Chat from "./components/Chat";
import ChatProvider from "./context/chatContext";

function App() {
  return (
    <ChatProvider>
      <div className="wrapper">
        <Router>
          <Switch>
            <Route exact path="/">
              <RoomsList />
            </Route>
            <Route path="/enter">
              <Enter />
            </Route>
            <Route path="/sign-up">
              <Form />
            </Route>
            <Route path="/login">
              <Form />
            </Route>
            <Route path="/new-room">
              <Form />
            </Route>
            <Route path="/:room">
              <Chat />
            </Route>
          </Switch>
        </Router>
      </div>
    </ChatProvider>
  );
}

export default App;

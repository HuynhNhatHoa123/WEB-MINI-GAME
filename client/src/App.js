import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import HomePage from "./HomePage";
import Admin from "./Admin";

function App() {
  return (
    <Router>
      <Routes>
        {/* Mặc định khi mở web (localhost:3000) sẽ hiện trang Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/admin" element={<Admin />} />

        {/* Nếu gõ bậy bạ sẽ quay về Login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
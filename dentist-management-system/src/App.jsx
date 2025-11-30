import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar/sidebar.jsx";
import Calendar from "./pages/appointments/calendar.jsx";
import Add from "./pages/appointments/add.jsx";
import PostSummary from "./pages/appointments/post_summary.jsx";
import "./index.css";
import "./components/sidebar/sidebar.css";

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/appointments/calendar" element={<Calendar />} />
            <Route path="/appointments/add" element={<Add />} />
            <Route
              path="/appointments/post-summary/:id"
              element={<PostSummary />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}



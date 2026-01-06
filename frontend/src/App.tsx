import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./app/components/LandingPage";
import { FeedPage } from "./app/components/FeedPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
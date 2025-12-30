import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./app/components/LandingPage";
import { FeedPage } from "./app/components/FeedPage";
import { ProfilePage } from "./app/components/ProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/feed" element={<FeedPage onLogout={() => {}} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
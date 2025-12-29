import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./app/components/LandingPage";
import { FeedPage } from "./app/components/FeedPage";
import { ProfilePage } from "./app/components/ProfilePage";
import { useAuth } from "./app/hooks/useAuth";

function App() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Загрузка...</p>
          </div>
        </div>
    );
  }

  return (
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
              path="/"
              element={
                currentUser ? (
                    <Navigate to="/feed" replace />
                ) : (
                    <LandingPage />
                )
              }
          />

          {/* Protected routes */}
          <Route
              path="/feed"
              element={
                  <FeedPage onLogout={() => {}} />
              }
          />

          <Route
              path="/profile"
              element={
                currentUser ? (
                    <ProfilePage />
                ) : (
                    <Navigate to="/" replace />
                )
              }
          />

          <Route
              path="/profile/:userId"
              element={
                currentUser ? (
                    <ProfilePage />
                ) : (
                    <Navigate to="/" replace />
                )
              }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
  );
}

export default App;

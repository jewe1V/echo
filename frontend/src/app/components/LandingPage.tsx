import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "./AuthModal";

export function LandingPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenLogin = () => {
    setModalError(null);
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setModalError(null);
    setAuthMode("register");
    setIsAuthModalOpen(true);
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      navigate("/feed");
    } else {
      setModalError(result.error || "Ошибка входа");
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const result = await register(name, email, password);
    if (result.success) {
      navigate("/feed");
    } else {
      setModalError(result.error || "Ошибка регистрации");
    }
  };


  return (
      <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(0, 255, 157, 0.15) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(0, 255, 157, 0.15) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(0, 255, 157, 0.15) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
          />
          <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 80% 80%, rgba(0, 232, 142, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 20%, rgba(0, 232, 142, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 80%, rgba(0, 232, 142, 0.1) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
          />
        </div>

        <motion.button
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            onClick={() => navigate("/feed")}
            className="absolute top-6 right-6 px-3 py-1 bg-transparent border-2 border-[#808080] text-[#808080] rounded-full  transition-all z-20 flex items-center text-sm"
        >
          Войти как гость
        </motion.button>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
              initial={{scale: 0, rotate: -180}}
              animate={{scale: 1, rotate: 0}}
              transition={{duration: 0.8, type: "spring"}}
              className="inline-block mb-8"
          >
            <div
                className="w-24 h-24 rounded-full bg-[#00FF9D] flex items-center justify-center shadow-[0_0_60px_rgba(0,255,157,0.5)]">
              <span className="text-5xl font-bold text-[#0F0F0F]">E</span>
            </div>
          </motion.div>

          <motion.h1
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3}}
              className="mb-4 text-6xl font-bold text-[#E0E0E0]"
          >
            Добро пожаловать в{" "}
            <span className="text-[#00FF9D]">Echo</span>
          </motion.h1>

          <motion.p
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.5}}
              className="mb-12 text-xl text-[#888888] max-w-2xl mx-auto"
          >
            Минималистичная платформа для создания и обмена визуальными историями.
            Делитесь моментами, вдохновляйте других.
          </motion.p>

          <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.7}}
              className="flex gap-4 justify-center flex-wrap"
          >
            <motion.button
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={handleOpenLogin}
                className="px-8 py-4 bg-[#00FF9D] text-[#0F0F0F] rounded-full hover:shadow-[0_0_40px_rgba(0,255,157,0.6)] transition-all font-semibold text-lg"
            >
              Войти
            </motion.button>
            <motion.button
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={handleOpenRegister}
                className="px-8 py-4 bg-transparent border-2 border-[#00FF9D] text-[#00FF9D] rounded-full hover:bg-[#00FF9D] hover:text-[#0F0F0F] transition-all font-semibold text-lg"
            >
              Зарегистрироваться
            </motion.button>
          </motion.div>
        </div>


        <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => {
              setIsAuthModalOpen(false);
              setModalError(null);
            }}
            onLogin={handleLogin}
            onRegister={handleRegister}
            initialMode={authMode}
        />

        {/* Modal Error Display (outside modal) */}
        {modalError && !isAuthModalOpen && (
            <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -20}}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm"
            >
              <p className="text-red-400 text-sm">{modalError}</p>
            </motion.div>
        )}
      </div>
  );
}

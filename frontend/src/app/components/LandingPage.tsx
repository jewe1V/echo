import { motion } from "framer-motion";
import { useState } from "react";
import { AuthModal } from "./AuthModal.tsx";

interface LandingPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, password: string) => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleOpenLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode("register");
    setIsAuthModalOpen(true);
  };

  const handleLogin = (email: string, password: string) => {
    onLogin(email, password);
    setIsAuthModalOpen(false);
  };

  const handleRegister = (name: string, email: string, password: string) => {
    onRegister(name, email, password);
    setIsAuthModalOpen(false);
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

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="inline-block mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-[#00FF9D] flex items-center justify-center shadow-[0_0_60px_rgba(0,255,157,0.5)]">
            <span className="text-5xl font-bold text-[#0F0F0F]">E</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-6xl font-bold text-[#E0E0E0]"
        >
          Добро пожаловать в{" "}
          <span className="text-[#00FF9D]">Echo</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12 text-xl text-[#888888] max-w-2xl mx-auto"
        >
          Минималистичная платформа для создания и обмена визуальными историями.
          Делитесь моментами, вдохновляйте других.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenLogin}
            className="px-8 py-4 bg-[#00FF9D] text-[#0F0F0F] rounded-full hover:shadow-[0_0_40px_rgba(0,255,157,0.6)] transition-all"
          >
            Войти
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenRegister}
            className="px-8 py-4 bg-transparent border-2 border-[#00FF9D] text-[#00FF9D] rounded-full hover:bg-[#00FF9D] hover:text-[#0F0F0F] transition-all"
          >
            Зарегистрироваться
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="p-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 rounded-full bg-[#00FF9D]/20 flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="mb-2 text-[#E0E0E0]">Визуальный контент</h3>
            <p className="text-[#888888]">
              Создавайте красивые посты с изображениями и текстом
            </p>
          </div>

          <div className="p-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 rounded-full bg-[#00FF9D]/20 flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="mb-2 text-[#E0E0E0]">Живое общение</h3>
            <p className="text-[#888888]">
              Обсуждайте, комментируйте и взаимодействуйте с сообществом
            </p>
          </div>

          <div className="p-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 rounded-full bg-[#00FF9D]/20 flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="mb-2 text-[#E0E0E0]">Минимализм</h3>
            <p className="text-[#888888]">
              Современный интерфейс без отвлекающих элементов
            </p>
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        initialMode={authMode}
      />
    </div>
  );
}

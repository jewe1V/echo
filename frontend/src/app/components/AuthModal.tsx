import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, password: string) => void;
  initialMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Сброс при изменении initialMode
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { name: "", email: "", password: "" };
    let isValid = true;

    if (mode === "register" && !formData.name.trim()) {
      newErrors.name = "Имя обязательно";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email обязателен";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Неверный формат email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === "login") {
      onLogin(formData.email, formData.password);
    } else {
      onRegister(formData.name, formData.email, formData.password);
    }

    // Сброс формы
    setFormData({ name: "", email: "", password: "" });
    setErrors({ name: "", email: "", password: "" });
    setShowPassword(false);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setErrors({ name: "", email: "", password: "" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-[0_0_60px_rgba(0,255,157,0.1)] overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9D]/5 to-transparent pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#2A2A2A] text-[#888888] hover:text-[#00FF9D] hover:bg-[#333333] transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.3)]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="relative p-8">
              {/* Logo */}
              <motion.div
                key={mode}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mb-6"
              >
                <div className="w-16 h-16 rounded-full bg-[#00FF9D] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,157,0.4)]">
                  <span className="text-3xl text-[#0F0F0F]">E</span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                key={`title-${mode}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-2 text-[#E0E0E0]"
              >
                {mode === "login" ? "Вход в Echo" : "Регистрация в Echo"}
              </motion.h2>

              <p className="text-center mb-8 text-[#888888]">
                {mode === "login"
                  ? "Добро пожаловать обратно!"
                  : "Создайте аккаунт и начните делиться"}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="text"
                          placeholder="Ваше имя"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className={`w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border ${
                            errors.name ? "border-[#FF4757]" : "border-[#2A2A2A]"
                          } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all`}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-[#FF4757]">{errors.name}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border ${
                        errors.email ? "border-[#FF4757]" : "border-[#2A2A2A]"
                      } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-[#FF4757]">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Пароль"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full pl-12 pr-12 py-3 bg-[#0F0F0F] border ${
                        errors.password ? "border-[#FF4757]" : "border-[#2A2A2A]"
                      } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#00FF9D] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-[#FF4757]">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-[#00FF9D] text-[#0F0F0F] rounded-xl hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all mt-6"
                >
                  {mode === "login" ? "Войти" : "Зарегистрироваться"}
                </motion.button>
              </form>

              {/* Switch Mode */}
              <div className="mt-6 text-center">
                <p className="text-[#888888]">
                  {mode === "login"
                    ? "Ещё нет аккаунта?"
                    : "Уже есть аккаунт?"}{" "}
                  <button
                    onClick={switchMode}
                    className="text-[#00FF9D] hover:underline transition-all"
                  >
                    {mode === "login" ? "Зарегистрироваться" : "Войти"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

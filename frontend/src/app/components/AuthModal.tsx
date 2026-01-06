
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onLogin?: (email: string, password: string) => void;
  onRegister?: (name: string, email: string, password: string) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onLogin,
  onRegister,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    login,
    register,
    isLoading: authLoading,
    error: authError,
    clearError
  } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setFormData({ name: "", email: "", password: "", username: "" });
    setErrors({});
    setSubmitError(null);
    clearError();
  }, [initialMode]);

  useEffect(() => {
    if (authError) {
      setSubmitError(authError);
    }
  }, [authError]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (mode === "register") {
      if (!formData.name.trim()) {
        newErrors.name = "Имя обязательно";
        isValid = false;
      } else if (formData.name.length < 2) {
        newErrors.name = "Имя должно содержать минимум 2 символа";
        isValid = false;
      }

      if (formData.username && formData.username.length < 3) {
        newErrors.username = "Имя пользователя должно содержать минимум 3 символа";
        isValid = false;
      }
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
    setSubmitError(null);
    clearError();

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;

      if (mode === "login") {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
            formData.name,
            formData.email,
            formData.password,
            formData.username || undefined
        );
      }

      if (result.success) {
        const completedForm = { ...formData };
        setFormData({ name: "", email: "", password: "", username: "" });
        setErrors({});
        setShowPassword(false);
        
        try {
          if (mode === "login" && onLogin) {
            await onLogin(completedForm.email, completedForm.password);
          } else if (mode === "register" && onRegister) {
            await onRegister(completedForm.name, completedForm.email, completedForm.password);
          }
          onClose();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "Произошла ошибка");
        } finally {
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      setSubmitError("Неизвестная ошибка. Попробуйте еще раз.");
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setFormData({ name: "", email: "", password: "", username: "" });
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", password: "", username: "" });
    setErrors({});
    setSubmitError(null);
    setShowPassword(false);
    clearError();
    onClose();
  };

  const isLoading = isSubmitting || authLoading;

  return (
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleClose}
                  className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative z-50 w-full max-w-md bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-[0_0_60px_rgba(0,255,157,0.1)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9D]/5 to-transparent pointer-events-none" />

                <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#2A2A2A] text-[#888888] hover:text-[#00FF9D] hover:bg-[#333333] transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative p-8">
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

                  {submitError && (
                      <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg"
                      >
                        <p className="text-sm text-[#FF4757] text-center">
                          {submitError}
                        </p>
                      </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                      {mode === "register" && (
                          <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4"
                          >
                            <div>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                                <input
                                    type="text"
                                    placeholder="Ваше имя"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    disabled={isLoading}
                                    className={`w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border ${
                                        errors.name ? "border-[#FF4757]" : "border-[#2A2A2A]"
                                    } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                              </div>
                              {errors.name && (
                                  <p className="mt-1 text-sm text-[#FF4757]">{errors.name}</p>
                              )}
                            </div>

                            <div>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                                <input
                                    type="text"
                                    placeholder="Имя пользователя (опционально)"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    disabled={isLoading}
                                    className={`w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border ${
                                        errors.username ? "border-[#FF4757]" : "border-[#2A2A2A]"
                                    } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                              </div>
                              {errors.username && (
                                  <p className="mt-1 text-sm text-[#FF4757]">{errors.username}</p>
                              )}
                            </div>
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
                            disabled={isLoading}
                            className={`w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border ${
                                errors.email ? "border-[#FF4757]" : "border-[#2A2A2A]"
                            } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
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
                            disabled={isLoading}
                            className={`w-full pl-12 pr-12 py-3 bg-[#0F0F0F] border ${
                                errors.password ? "border-[#FF4757]" : "border-[#2A2A2A]"
                            } rounded-xl text-[#E0E0E0] placeholder:text-[#555555] focus:outline-none focus:border-[#00FF9D] focus:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#00FF9D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        className="w-full py-3 bg-[#00FF9D] text-[#0F0F0F] rounded-xl hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {mode === "login" ? "Вход..." : "Регистрация..."}
                          </>
                      ) : (
                          mode === "login" ? "Войти" : "Зарегистрироваться"
                      )}
                    </motion.button>
                  </form>
                  <div className="mt-6 text-center">
                    <p className="text-[#888888]">
                      {mode === "login"
                          ? "Ещё нет аккаунта?"
                          : "Уже есть аккаунт?"}{" "}
                      <button
                          onClick={switchMode}
                          disabled={isLoading}
                          className="text-[#00FF9D] hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {mode === "login" ? "Зарегистрироваться" : "Войти"}
                      </button>
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-[#555555] text-center">
                    <p>Пароль должен содержать минимум 6 символов</p>
                  </div>
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
  );
}

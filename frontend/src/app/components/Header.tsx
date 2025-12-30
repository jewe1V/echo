import { Plus, User, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { getAvatarData } from "../utils";

interface HeaderProps {
  onCreatePost: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onLogin: () => void; // Новая функция для авторизации
  userName?: string;
  userEmail?: string;
  isAuthenticated: boolean; // Флаг авторизации
}

export function Header({
  onCreatePost,
  onProfileClick,
  onLogout,
  onLogin,
  userName,
  userEmail,
  isAuthenticated,
}: HeaderProps) {
  // Получаем данные для аватарки если пользователь авторизован
  const avatarData = isAuthenticated ? getAvatarData({ name: userName, email: userEmail }) : null;
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212] border-b border-[#2A2A2A]">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00FF9D] flex items-center justify-center">
            <span className="font-bold text-[#0F0F0F]">E</span>
          </div>
          <h1 className="font-bold text-[#00FF9D]">Echo</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Кнопка создания поста - показываем только для авторизованных */}
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreatePost}
              className="px-4 py-2 bg-[#00FF9D] text-[#0F0F0F] rounded-full flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,157,0.5)] transition-shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Создать</span>
            </motion.button>
          )}

          {/* Блок пользователя / авторизации */}
          {isAuthenticated ? (
            // Если пользователь авторизован - показываем аватарку и меню
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#1A1A1A] transition-colors"
              >
                {/* Аватарка сгенерированная по функции */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#00FF9D]"
                  style={{ backgroundColor: avatarData?.color }}
                >
                  <span className="font-bold text-white text-sm">
                    {avatarData?.letter}
                  </span>
                </div>
              </motion.button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-12 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b border-[#2A2A2A]">
                  <p className="text-[#E0E0E0] font-medium">{userName || "Пользователь"}</p>
                  {userEmail && (
                    <p className="text-sm text-gray-400 truncate">{userEmail}</p>
                  )}
                </div>
                <button
                  onClick={onProfileClick}
                  className="w-full px-4 py-2 text-left text-[#E0E0E0] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Профиль</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-[#E0E0E0] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors rounded-b-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выход</span>
                </button>
              </div>
            </div>
          ) : (
            // Если пользователь не авторизован - показываем кнопку входа
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogin}
              className="px-4 py-2 bg-[#00FF9D] text-[#0F0F0F] rounded-full flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,157,0.5)] transition-shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Войти</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
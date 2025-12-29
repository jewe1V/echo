import { useState, useEffect } from "react";
import { type User } from "../types";

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Загружаем пользователя из localStorage при монтировании
    useEffect(() => {
        const storedUser = localStorage.getItem("echo_current_user");
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing stored user:", error);
                localStorage.removeItem("echo_current_user");
            }
        }
        setIsLoading(false);
    }, []);

    const getStoredUsers = (): User[] => {
        const stored = localStorage.getItem("echo_users");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error("Error parsing stored users:", error);
                return [];
            }
        }
        return [];
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const login = (email: string, password: string): { success: boolean; error?: string } => {
        if (!email.trim() || !password.trim()) {
            return { success: false, error: "Заполните все поля" };
        }

        if (!validateEmail(email)) {
            return { success: false, error: "Введите корректный email" };
        }

        const users = getStoredUsers();
        const user = users.find((u) => u.email === email && u.password === password);

        if (user) {
            setCurrentUser(user);
            localStorage.setItem("echo_current_user", JSON.stringify(user));
            return { success: true };
        }

        return { success: false, error: "Неверный email или пароль" };
    };

    const register = (name: string, email: string, password: string): { success: boolean; error?: string } => {
        // Валидация полей
        if (!name.trim() || !email.trim() || !password.trim()) {
            return { success: false, error: "Заполните все поля" };
        }

        if (name.length < 2) {
            return { success: false, error: "Имя должно содержать минимум 2 символа" };
        }

        if (!validateEmail(email)) {
            return { success: false, error: "Введите корректный email" };
        }

        if (password.length < 6) {
            return { success: false, error: "Пароль должен содержать минимум 6 символов" };
        }

        const users = getStoredUsers();

        // Проверка на существующий email
        if (users.some((u) => u.email === email)) {
            return { success: false, error: "Пользователь с таким email уже существует" };
        }

        // Создание нового пользователя
        const newUser: User = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            bio: "Новый пользователь Echo",
        };

        // Сохраняем пользователя
        const updatedUsers = [...users, newUser];
        localStorage.setItem("echo_users", JSON.stringify(updatedUsers));
        setCurrentUser(newUser);
        localStorage.setItem("echo_current_user", JSON.stringify(newUser));

        return { success: true };
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("echo_current_user");
    };

    const updateProfile = (updates: Partial<User>) => {
        if (!currentUser) return false;

        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        localStorage.setItem("echo_current_user", JSON.stringify(updatedUser));

        // Обновляем также в списке пользователей
        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
            u.id === currentUser.id ? updatedUser : u
        );
        localStorage.setItem("echo_users", JSON.stringify(updatedUsers));

        return true;
    };

    // Функция для инициализации тестового пользователя (опционально)
    const initDemoUser = () => {
        const demoUser: User = {
            id: "demo_123",
            name: "Демо Пользователь",
            email: "test@echo.com",
            password: "password123",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
            bio: "Тестовый пользователь для демонстрации",
        };

        const users = getStoredUsers();
        if (!users.some(u => u.email === demoUser.email)) {
            const updatedUsers = [...users, demoUser];
            localStorage.setItem("echo_users", JSON.stringify(updatedUsers));
        }
    };

    return {
        currentUser,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        initDemoUser,
    };
};

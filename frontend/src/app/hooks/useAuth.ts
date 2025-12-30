import { useState, useEffect } from "react";
import { type User } from "../types";

const API_BASE_URL = "https://d5dokul9oqi12k1uin8p.trruwy79.apigw.yandexcloud.net";

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Загружаем пользователя и токен из localStorage при монтировании
    useEffect(() => {
        const storedUser = localStorage.getItem("echo_current_user");
        const storedToken = localStorage.getItem("echo_auth_token");

        if (storedUser && storedToken) {
            try {
                setCurrentUser(JSON.parse(storedUser));
                setAuthToken(storedToken);
            } catch (err) {
                console.error("Ошибка парсинга сохраненных данных:", err);
                clearStoredAuth();
            }
        }
        setIsLoading(false);
    }, []);

    // Очистка сохраненных данных авторизации
    const clearStoredAuth = () => {
        localStorage.removeItem("echo_current_user");
        localStorage.removeItem("echo_auth_token");
        setCurrentUser(null);
        setAuthToken(null);
        setError(null);
    };

    // Валидация email
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Общая функция для API запросов
    const apiRequest = async <T>(
        endpoint: string,
        method: string = "GET",
        data?: any,
        requireAuth: boolean = false
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
        setError(null);

        // Проверка авторизации если требуется
        if (requireAuth && !authToken) {
            return { success: false, error: "Требуется авторизация" };
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Обработка специфичных ошибок
                if (response.status === 401) {
                    clearStoredAuth();
                    return {
                        success: false,
                        error: "Сессия истекла. Пожалуйста, войдите снова.",
                    };
                }

                return {
                    success: false,
                    error: responseData.error || `Ошибка ${response.status}`,
                };
            }

            return { success: true, data: responseData };
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Ошибка соединения с сервером";

            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Логин через API
    const login = async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        // Валидация полей
        if (!email.trim() || !password.trim()) {
            return { success: false, error: "Заполните все поля" };
        }

        if (!validateEmail(email)) {
            return { success: false, error: "Введите корректный email" };
        }

        setIsLoading(true);

        try {
            const result = await apiRequest<{
                success: boolean;
                token: string;
                user: {
                    user_id: string;
                    email: string;
                    username?: string;
                    display_name?: string;
                };
            }>("/auth/login", "POST", {
                email: email.trim().toLowerCase(),
                password: password.trim(),
            });

            setIsLoading(false);

            if (result.success && result.data) {
                const { token, user } = result.data;

                // Преобразуем ответ API в формат User
                const transformedUser: User = {
                    id: user.user_id,
                    name: user.display_name || user.username || user.email.split('@')[0],
                    email: user.email,
                    username: user.username || user.email.split('@')[0],
                    displayName: user.display_name,
                };

                // Сохраняем токен и пользователя
                setAuthToken(token);
                setCurrentUser(transformedUser);

                localStorage.setItem("echo_auth_token", token);
                localStorage.setItem("echo_current_user", JSON.stringify(transformedUser));

                return { success: true };
            }

            return {
                success: false,
                error: result.error || "Неверный email или пароль",
            };
        } catch (err) {
            setIsLoading(false);
            return {
                success: false,
                error: "Ошибка соединения с сервером",
            };
        }
    };

    // Регистрация через API
    const register = async (
        name: string,
        email: string,
        password: string,
        username?: string
    ): Promise<{ success: boolean; error?: string }> => {
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

        setIsLoading(true);

        try {
            const result = await apiRequest<{
                success: boolean;
                token: string;
                user: {
                    user_id: string;
                    email: string;
                    username?: string;
                    display_name?: string;
                };
            }>("/auth/register", "POST", {
                email: email.trim().toLowerCase(),
                password: password.trim(),
                display_name: name.trim(),
                username: username || email.split('@')[0],
            });

            setIsLoading(false);

            if (result.success && result.data) {
                const { token, user } = result.data;

                // Преобразуем ответ API в формат User
                const transformedUser: User = {
                    id: user.user_id,
                    name: user.display_name || user.username || name.trim(),
                    email: user.email,
                    username: user.username || email.split('@')[0],
                    displayName: user.display_name,
                };

                // Сохраняем токен и пользователя
                setAuthToken(token);
                setCurrentUser(transformedUser);

                localStorage.setItem("echo_auth_token", token);
                localStorage.setItem("echo_current_user", JSON.stringify(transformedUser));

                return { success: true };
            }

            return {
                success: false,
                error: result.error || "Ошибка при регистрации",
            };
        } catch (err) {
            setIsLoading(false);
            return {
                success: false,
                error: "Ошибка соединения с сервером",
            };
        }
    };

    // Выход
    const logout = () => {
        clearStoredAuth();
    };

    // Обновление профиля (если API поддерживает)
    const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
        if (!currentUser || !authToken) return false;

        // TODO: Реализовать при наличии соответствующего endpoint в API
        console.log("Обновление профиля:", updates);
        return false;
    };

    // Проверка валидности токена
    const validateToken = async (): Promise<boolean> => {
        if (!authToken) return false;

        // Проверяем, есть ли токен и пользователь в localStorage
        const storedToken = localStorage.getItem("echo_auth_token");
        const storedUser = localStorage.getItem("echo_current_user");

        return !!(storedToken && storedUser);
    };

    // Сброс ошибки
    const clearError = () => {
        setError(null);
    };

    return {
        // Состояние
        currentUser,
        authToken,
        isLoading,
        error,

        // Методы
        login,
        register,
        logout,
        updateProfile,
        validateToken,
        apiRequest,
        clearError,
    };
};

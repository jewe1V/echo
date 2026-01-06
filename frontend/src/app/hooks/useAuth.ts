import { useState, useEffect } from "react";
import { type User } from "../types";
import {API_URL} from "../apiUrl"

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const clearStoredAuth = () => {
        localStorage.removeItem("echo_current_user");
        localStorage.removeItem("echo_auth_token");
        setCurrentUser(null);
        setAuthToken(null);
        setError(null);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("echo_current_user");
        const storedToken = localStorage.getItem("echo_auth_token");

        let isValid = false;
        let parsedUser: User | null = null;
        if (storedUser && storedToken) {
            try {
                parsedUser = JSON.parse(storedUser);
                isValid = true;
            } catch (err) {
                console.error("Ошибка парсинга сохраненных данных:", err);
                localStorage.removeItem("echo_current_user");
                localStorage.removeItem("echo_auth_token");
            }
        }
        if (isValid && parsedUser) {
            setTimeout(() => {
                setCurrentUser(parsedUser);
                setAuthToken(storedToken);
                setIsLoading(false);
            }, 0);
        } else {
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
    }, []);


    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const apiRequest = async <T>(
        endpoint: string,
        method: string = "GET",
        data?: unknown,
        requireAuth: boolean = false
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
        setError(null);

        if (requireAuth && !authToken) {
            return { success: false, error: "Требуется авторизация" };
        }

        const url = `${API_URL}${endpoint}`;
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

    const login = async (
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
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

                const transformedUser: User = {
                    id: user.user_id,
                    name: user.display_name || user.username || user.email.split('@')[0],
                    email: user.email,
                    username: user.username || user.email.split('@')[0],
                    displayName: user.display_name,
                };

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
        } catch {
            setIsLoading(false);
            return {
                success: false,
                error: "Ошибка соединения с сервером",
            };
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        username?: string
    ): Promise<{ success: boolean; error?: string }> => {
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

                const transformedUser: User = {
                    id: user.user_id,
                    name: user.display_name || user.username || name.trim(),
                    email: user.email,
                    username: user.username || email.split('@')[0],
                    displayName: user.display_name,
                };

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
        } catch {
            setIsLoading(false);
            return {
                success: false,
                error: "Ошибка соединения с сервером",
            };
        }
    };

    const logout = () => {
        clearStoredAuth();
    };

    const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
        if (!currentUser || !authToken) return false;
        console.log("Обновление профиля:", updates);
        return false;
    };

    const validateToken = async (): Promise<boolean> => {
        if (!authToken) return false;
        const storedToken = localStorage.getItem("echo_auth_token");
        const storedUser = localStorage.getItem("echo_current_user");

        return !!(storedToken && storedUser);
    };

    const clearError = () => {
        setError(null);
    };

    return {
        currentUser,
        authToken,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        validateToken,
        apiRequest,
        clearError,
    };
};

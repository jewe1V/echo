// hooks/usePosts.ts

import { useState, useEffect, useCallback } from "react";
import { type Post, type Author } from "../types";
import { useAuth } from "./useAuth";

type ApiPost = {
    post_id?: string;
    id?: string;
    author_info?: {
        user_id?: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    author_id?: string;
    title?: string;
    text?: string;
    imgUrl?: string;
    imageUrl?: string;
    created_at?: string;
    updated_at?: string;
    likes_count?: number;
    is_liked?: boolean;
    comments_count?: number;
    status?: string;
    slug?: string;
};

const normalizePost = (apiPost: ApiPost, currentUserId?: string): Post => {
    const author: Author = {
        id: apiPost.author_info?.user_id || apiPost.author_id || "unknown",
        username: apiPost.author_info?.username || "unknown",
        name: apiPost.author_info?.display_name || apiPost.author_info?.username || "Аноним",
        avatar: "",
    };

    return {
        id: String(apiPost.post_id || apiPost.id || ""),
        author,
        title: apiPost.title || "Без заголовка",
        content: apiPost.text || "",
        image: undefined,
        createdAt: new Date(apiPost.created_at || Date.now()),
        updatedAt: apiPost.updated_at ? new Date(apiPost.updated_at) : undefined,
        likes: apiPost.likes_count || 0,
        isLiked: apiPost.is_liked || false,
        commentsCount: apiPost.comments_count || 0,
        isOwner: currentUserId ? apiPost.author_id === currentUserId : false,
        recentComments: [],
        status: apiPost.status,
        slug: apiPost.slug,
    };
};

export const usePosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [nextKey, setNextKey] = useState<string | null>(null);

    const { currentUser, authToken, apiRequest } = useAuth();

    const fetchPosts = useCallback(
        async (
            params?: {
                limit?: number;
                author_id?: string;
                last_key?: string;
                include_comments?: boolean;
            },
            append: boolean = false
        ) => {
            if (isLoading && append) return;

            setIsLoading(true);
            setError(null);

            try {
                const queryParams = new URLSearchParams();
                if (params?.limit) queryParams.append("limit", params.limit.toString());
                if (params?.author_id) queryParams.append("author_id", params.author_id);
                if (params?.last_key) queryParams.append("last_key", params.last_key);
                if (params?.include_comments !== undefined) {
                    queryParams.append("include_comments", params.include_comments.toString());
                }

                const endpoint = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
                const result = await apiRequest<unknown>(endpoint, "GET");

                if (result.success) {
                    let rawPosts: ApiPost[] = [];
                    let meta: { has_more?: boolean; next_key?: string } = {};
                    if (
                        result.data &&
                        typeof result.data === "object" &&
                        "data" in result.data &&
                        Array.isArray((result.data as { data: unknown }).data)
                    ) {
                        rawPosts = ((result.data as { data: unknown }).data as ApiPost[]);
                        if ("meta" in result.data && typeof (result.data as { meta?: unknown }).meta === "object") {
                            meta = (result.data as { meta?: unknown }).meta as { has_more?: boolean; next_key?: string };
                        }
                    } else if (Array.isArray(result.data)) {
                        rawPosts = result.data as ApiPost[];
                    } else {
                        console.warn("Неизвестная структура постов в ответе:", result);
                        rawPosts = [];
                    }

                    const normalizedPosts = rawPosts.map((p) => normalizePost(p, currentUser?.id));

                    if (append) {
                        setPosts((prev) => [...prev, ...normalizedPosts]);
                    } else {
                        setPosts(normalizedPosts);
                    }

                    setHasMore(meta.has_more ?? false);
                    setNextKey(meta.next_key ?? null);
                } else {
                    setError(result.error || "Ошибка при загрузке постов");
                    setHasMore(false);
                }
            } catch (err) {
                console.error("Ошибка загрузки постов:", err);
                setError("Ошибка соединения с сервером");
                setHasMore(false);
            } finally {
                setIsLoading(false);
            }
        },
        [apiRequest, currentUser?.id, isLoading]
    );

    useEffect(() => {
        fetchPosts({ limit: 20, include_comments: true });
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (!hasMore || isLoading || !nextKey) return;
        await fetchPosts(
            {
                limit: 20,
                last_key: nextKey,
                include_comments: true,
            },
            true
        );
    }, [hasMore, isLoading, nextKey, fetchPosts]);

    const likePost = useCallback(
        async (postId: string): Promise<boolean> => {
            if (!authToken) {
                setError("Требуется авторизация");
                return false;
            }
            try {
                const res = await apiRequest<{ action?: "liked" | "unliked" }>(`/posts/${postId}/like`, "POST");
                if (res.success && res.data && typeof res.data.action !== "undefined") {
                    setPosts((prev) =>
                        prev.map((p) =>
                            p.id === postId
                                ? {
                                      ...p,
                                      isLiked: res.data!.action === "liked",
                                      likes:
                                          res.data!.action === "liked" ? p.likes + 1 : Math.max(0, p.likes - 1),
                                  }
                                : p
                        )
                    );
                    return true;
                }
            } catch {
                setError("Ошибка при лайке");
            }
            return false;
        },
        [authToken, apiRequest]
    );


    const createPost = useCallback(
        async (data: {
            title: string;
            content: string;
            image?: string;
            status?: "draft" | "published";
        }): Promise<{ success: boolean; post?: Post; error?: string }> => {
            if (!authToken) return { success: false, error: "Требуется авторизация" };
            if (!data.title.trim() || !data.content.trim())
                return { success: false, error: "Заполните заголовок и текст" };

            try {
                const res = await apiRequest<{ post?: ApiPost }>("/posts/create", "POST", {
                    title: data.title.trim(),
                    text: data.content.trim(),
                    imgUrl: data.image || "",
                    status: data.status || "published",
                });

                if (res.success && res.data?.post) {
                    const newPost = normalizePost(res.data.post, currentUser?.id);
                    setPosts((prev) => [newPost, ...prev]);
                    return { success: true, post: newPost };
                }
                return { success: false, error: res.error || "Ошибка создания поста" };
            } catch {
                return { success: false, error: "Ошибка соединения" };
            }
        },
        [authToken, apiRequest, currentUser?.id]
    );

    const updatePost = useCallback(
        async (
            postId: string,
            updates: { title?: string; content?: string; image?: string; status?: "draft" | "published" }
        ): Promise<{ success: boolean; updatedPost?: Post; error?: string }> => {
            if (!authToken) return { success: false, error: "Требуется авторизация" };

            try {
                const res = await apiRequest<{ post?: ApiPost }>(`/posts/${postId}/edit`, "PUT", {
                    ...updates,
                    post_id: postId,
                });

                if (res.success) {
                    if (res.data?.post) {
                        const updated = normalizePost(res.data.post, currentUser?.id);
                        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
                        return { success: true, updatedPost: updated };
                    } else {
                        setPosts((prev) =>
                            prev.map((p) =>
                                p.id === postId
                                    ? {
                                          ...p,
                                          title: updates.title ?? p.title,
                                          content: updates.content ?? p.content,
                                          image: updates.image ?? p.image,
                                          updatedAt: new Date(),
                                      }
                                    : p
                            )
                        );
                        return { success: true };
                    }
                }
                return { success: false, error: res.error || "Ошибка обновления" };
            } catch {
                return { success: false, error: "Ошибка соединения" };
            }
        },
        [authToken, apiRequest, currentUser?.id]
    );

    const deletePost = useCallback(
        async (postId: string): Promise<{ success: boolean; error?: string }> => {
            if (!authToken) return { success: false, error: "Требуется авторизация" };

            try {
                const res = await apiRequest(`/posts/${postId}/delete`, "DELETE");
                if (res.success) {
                    setPosts((prev) => prev.filter((p) => p.id !== postId));
                    return { success: true };
                }
                return { success: false, error: res.error || "Ошибка удаления" };
            } catch {
                return { success: false, error: "Ошибка соединения" };
            }
        },
        [authToken, apiRequest]
    );

    const addComment = useCallback(
        async (postId: string, text: string, parentCommentId?: string) => {
            if (!authToken || !text.trim()) return { success: false, error: "Текст обязателен" };

            try {
                const res = await apiRequest("/comments", "POST", {
                    post_id: postId,
                    text: text.trim(),
                    ...(parentCommentId && { parent_comment_id: parentCommentId }),
                });

                if (res.success) {
                    setPosts((prev) =>
                        prev.map((p) =>
                            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
                        )
                    );
                    return { success: true };
                }
                return { success: false, error: res.error || "Ошибка добавления комментария" };
            } catch {
                return { success: false, error: "Ошибка соединения" };
            }
        },
        [authToken, apiRequest]
    );

    const clearError = useCallback(() => setError(null), []);

    return {
        posts,
        isLoading,
        error,
        hasMore,
        nextKey,

        fetchPosts,
        loadMorePosts,
        likePost,
        createPost,
        updatePost,
        deletePost,
        addComment,
        clearError,
    };
};
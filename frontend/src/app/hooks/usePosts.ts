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
    user_has_liked?: boolean;
    current_user_liked?: boolean;
};

const normalizePost = (apiPost: ApiPost, currentUserId?: string): Post => {
    const author: Author = {
        id: apiPost.author_info?.user_id || "unknown",
        username: apiPost.author_info?.username || "unknown",
        name: apiPost.author_info?.display_name || apiPost.author_info?.username || "Аноним",
        avatar: apiPost.author_info?.avatar_url || "",
    };

    const isLiked = apiPost.is_liked;
    
    return {
        id: String(apiPost.post_id || apiPost.id || ""),
        author,
        title: apiPost.title || "Без заголовка",
        content: apiPost.text || "",
        image: apiPost.imageUrl || apiPost.imgUrl || undefined,
        createdAt: new Date(apiPost.created_at || Date.now()),
        updatedAt: apiPost.updated_at ? new Date(apiPost.updated_at) : undefined,
        likes: apiPost.likes_count || 0,
        isLiked: isLiked || false,
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
    const [isProcessingLike, setIsProcessingLike] = useState<Record<string, boolean>>({});

    const { currentUser, authToken, apiRequest } = useAuth();

    const fetchPosts = useCallback(
        async (
            params?: {
                limit?: number;
                author_id?: string;
                last_key?: string;
                include_comments?: boolean;
                include_likes?: boolean;
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
                if (params?.include_likes !== undefined) {
                    queryParams.append("include_likes", params.include_likes.toString());
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
        fetchPosts({ limit: 20, include_comments: true, include_likes: true });
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (!hasMore || isLoading || !nextKey) return;
        await fetchPosts(
            {
                limit: 20,
                last_key: nextKey,
                include_comments: true,
                include_likes: true,
            },
            true
        );
    }, [hasMore, isLoading, nextKey, fetchPosts]);

    const likePost = useCallback(
        async (postId: string): Promise<{ success: boolean; error?: string; isLiked?: boolean }> => {
            if (!authToken) {
                setError("Требуется авторизация");
                return { success: false, error: "Требуется авторизация" };
            }

            if (isProcessingLike[postId]) {
                return { success: false, error: "Действие уже выполняется" };
            }
            
            try {
                setIsProcessingLike(prev => ({ ...prev, [postId]: true }));

                const currentPost = posts.find(p => p.id === postId);
                if (!currentPost) {
                    return { success: false, error: "Пост не найден" };
                }

                const wasLiked = currentPost.isLiked;
                setPosts(prev =>
                    prev.map(p =>
                        p.id === postId
                            ? {
                                ...p,
                                isLiked: !wasLiked,
                                likes: wasLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
                            }
                            : p
                    )
                );
                
                const res = await apiRequest<{ 
                    action: "liked" | "unliked"; 
                    likes_count: number;
                    current_user_liked: boolean;
                }>(`/posts/${postId}/like`, "POST");
                
                if (res.success && res.data) {
                    setPosts(prev =>
                        prev.map(p =>
                            p.id === postId
                                ? {
                                    ...p,
                                    isLiked: res.data!.current_user_liked,
                                    likes: res.data!.likes_count,
                                }
                                : p
                        )
                    );
                    
                    return { 
                        success: true, 
                        isLiked: res.data.current_user_liked 
                    };
                } else {
                    setPosts(prev =>
                        prev.map(p =>
                            p.id === postId
                                ? {
                                    ...p,
                                    isLiked: wasLiked,
                                    likes: wasLiked ? currentPost.likes : Math.max(0, currentPost.likes - 1),
                                }
                                : p
                        )
                    );
                    
                    return { 
                        success: false, 
                        error: res.error || "Ошибка при отправке лайка" 
                    };
                }
            } catch (err) {
                console.error("Ошибка при лайке:", err);
                setError("Ошибка соединения с сервером");
                return { success: false, error: "Ошибка соединения" };
            } finally {
                setIsProcessingLike(prev => ({ ...prev, [postId]: false }));
            }
        },
        [authToken, apiRequest, posts, isProcessingLike]
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
            } catch (err) {
                console.error("Ошибка создания поста:", err);
                return { success: false, error: "Ошибка соединения с сервером" };
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

            const postToUpdate = posts.find(p => p.id === postId);
            if (!postToUpdate) {
                return { success: false, error: "Пост не найден" };
            }
            
            if (!postToUpdate.isOwner && currentUser?.id !== postToUpdate.author.id) {
                return { success: false, error: "Вы не являетесь автором этого поста" };
            }

            try {
                const previousPost = { ...postToUpdate };
                setPosts(prev =>
                    prev.map(p =>
                        p.id === postId
                            ? {
                                ...p,
                                title: updates.title ?? p.title,
                                content: updates.content ?? p.content,
                                image: updates.image ?? p.image,
                                status: updates.status ?? p.status,
                                updatedAt: new Date(),
                            }
                            : p
                    )
                );

                const res = await apiRequest<{ post?: ApiPost }>(`/posts/${postId}/edit`, "PUT", {
                    ...updates,
                    post_id: postId,
                });

                if (res.success) {
                    if (res.data?.post) {
                        const updated = normalizePost(res.data.post, currentUser?.id);
                        setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
                        return { success: true, updatedPost: updated };
                    }
                    return { success: true };
                } else {

                    setPosts(prev => prev.map(p => (p.id === postId ? previousPost : p)));
                    return { success: false, error: res.error || "Ошибка обновления поста" };
                }
            } catch (err) {
                console.error("Ошибка обновления поста:", err);
                return { success: false, error: "Ошибка соединения с сервером" };
            }
        },
        [authToken, apiRequest, currentUser?.id, posts]
    );

    const deletePost = useCallback(
        async (postId: string): Promise<{ success: boolean; error?: string }> => {
            if (!authToken) return { success: false, error: "Требуется авторизация" };

            const postToDelete = posts.find(p => p.id === postId);
            if (!postToDelete) {
                return { success: false, error: "Пост не найден" };
            }
            
            if (!postToDelete.isOwner && currentUser?.id !== postToDelete.author.id) {
                return { success: false, error: "Вы не являетесь автором этого поста" };
            }

            try {
                setPosts(prev => prev.filter(p => p.id !== postId));
                
                const res = await apiRequest(`/posts/${postId}/delete`, "DELETE");
                
                if (res.success) {
                    return { success: true };
                } else {
                    setPosts(prev => [...prev, postToDelete].sort((a, b) => 
                        b.createdAt.getTime() - a.createdAt.getTime()
                    ));
                    return { success: false, error: res.error || "Ошибка удаления поста" };
                }
            } catch (err) {
                console.error("Ошибка удаления поста:", err);
                setPosts(prev => [...prev, postToDelete].sort((a, b) => 
                    b.createdAt.getTime() - a.createdAt.getTime()
                ));
                return { success: false, error: "Ошибка соединения с сервером" };
            }
        },
        [authToken, apiRequest, currentUser?.id, posts]
    );

    const addComment = useCallback(
        async (postId: string, text: string, parentCommentId?: string): Promise<{ success: boolean; error?: string }> => {
            if (!authToken) return { success: false, error: "Требуется авторизация" };
            if (!text.trim()) return { success: false, error: "Текст комментария обязателен" };

            try {
                setPosts(prev =>
                    prev.map(p =>
                        p.id === postId 
                            ? { ...p, commentsCount: p.commentsCount + 1 } 
                            : p
                    )
                );

                const res = await apiRequest<{ comment_id?: string }>("/comments", "POST", {
                    post_id: postId,
                    text: text.trim(),
                    ...(parentCommentId && { parent_comment_id: parentCommentId }),
                });

                if (res.success) {
                    return { success: true };
                } else {
                    setPosts(prev =>
                        prev.map(p =>
                            p.id === postId 
                                ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } 
                                : p
                        )
                    );
                    return { success: false, error: res.error || "Ошибка добавления комментария" };
                }
            } catch (err) {
                console.error("Ошибка добавления комментария:", err);
                setPosts(prev =>
                    prev.map(p =>
                        p.id === postId 
                            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } 
                            : p
                    )
                );
                return { success: false, error: "Ошибка соединения с сервером" };
            }
        },
        [authToken, apiRequest]
    );

    const fetchUserLikes = useCallback(async (): Promise<string[]> => {
        if (!authToken || !currentUser?.id) return [];
        
        try {
            const res = await apiRequest<{ liked_posts?: string[] }>(`/users/${currentUser.id}/likes`, "GET");
            if (res.success && res.data?.liked_posts) {
                setPosts(prev =>
                    prev.map(post => ({
                        ...post,
                        isLiked: res.data!.liked_posts!.includes(post.id)
                    }))
                );
                return res.data.liked_posts;
            }
            return [];
        } catch {
            return [];
        }
    }, [authToken, currentUser?.id, apiRequest]);

    const fetchLikedPosts = useCallback(async (): Promise<Post[]> => {
        if (!authToken) return [];
        
        try {
            const res = await apiRequest<{ posts?: ApiPost[] }>("/posts/liked", "GET");
            if (res.success && res.data?.posts) {
                const likedPosts = res.data.posts.map(p => normalizePost(p, currentUser?.id));
                return likedPosts;
            }
            return [];
        } catch {
            return [];
        }
    }, [authToken, currentUser?.id, apiRequest]);

    const clearError = useCallback(() => setError(null), []);

    const refreshPosts = useCallback(() => {
        fetchPosts({ limit: 20, include_comments: true, include_likes: true }, false);
    }, [fetchPosts]);

    return {
        posts,
        isLoading,
        error,
        hasMore,
        nextKey,
        isProcessingLike,

        fetchPosts,
        loadMorePosts,
        likePost,
        createPost,
        updatePost,
        deletePost,
        addComment,
        clearError,
        fetchUserLikes,
        fetchLikedPosts,
        refreshPosts,
    };
};
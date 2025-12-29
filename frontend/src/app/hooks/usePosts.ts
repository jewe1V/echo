import { useState, useEffect, useCallback } from "react";
import { type Post } from "../types";

const mockPosts: Post[] = [
    {
        id: "1",
        author: {
            id: "user1",
            name: "Александр Петров",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        },
        title: "Волшебство горных пейзажей",
        content: "Каждое утро в горах начинается с невероятных видов. Это место дарит покой и вдохновение.",
        image: "https://images.unsplash.com/photo-1683669447068-3ce32ed90f21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 124,
        isLiked: true,
        isBookmarked: false,
        commentsCount: 8,
        isOwner: true,
    },
    // Добавьте больше моковых постов при необходимости
];

export const usePosts = (currentUserId?: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Симуляция загрузки данных
        setTimeout(() => {
            const postsWithOwnership = mockPosts.map(post => ({
                ...post,
                isOwner: post.author.id === currentUserId,
            }));
            setPosts(postsWithOwnership);
            setIsLoading(false);
        }, 1000);
    }, [currentUserId]);

    const likePost = useCallback((postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        isLiked: !post.isLiked,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    }
                    : post
            )
        );
    }, []);

    const bookmarkPost = useCallback((postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? { ...post, isBookmarked: !post.isBookmarked }
                    : post
            )
        );
    }, []);

    const createPost = useCallback((postData: { title: string; content: string; image?: string }, author: Post['author']) => {
        const newPost: Post = {
            id: Date.now().toString(),
            author,
            title: postData.title,
            content: postData.content,
            image: postData.image,
            createdAt: new Date(),
            likes: 0,
            isLiked: false,
            isBookmarked: false,
            commentsCount: 0,
            isOwner: true,
        };
        setPosts(prev => [newPost, ...prev]);
        return newPost;
    }, []);

    const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId ? { ...post, ...updates } : post
            )
        );
    }, []);

    const deletePost = useCallback((postId: string) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    }, []);

    const addComment = useCallback((postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? { ...post, commentsCount: post.commentsCount + 1 }
                    : post
            )
        );
    }, []);

    const getUserPosts = useCallback((userId: string) => {
        return posts.filter(post => post.author.id === userId);
    }, [posts]);

    return {
        posts,
        isLoading,
        likePost,
        bookmarkPost,
        createPost,
        updatePost,
        deletePost,
        addComment,
        getUserPosts,
    };
};

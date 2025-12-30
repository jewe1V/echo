export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
}

export interface ApiUser {
    user_id: string;
    email: string;
    username?: string;
    display_name?: string;
    role?: string;
    created_at?: string;
}

export interface Author {
    id: string;
    username: string;
    name: string;
    avatar: string;
}

export interface Comment {
    id: string;
    author: Author;
    content: string;
    createdAt: Date;
}

export interface Post {
    id: string;
    author: Author;
    title: string;
    content: string;
    image?: string;
    createdAt: Date;
    updatedAt?: Date;
    likes: number;
    isLiked: boolean;
    commentsCount: number;
    isOwner: boolean;
    recentComments: Comment[];
    status?: string;
    slug?: string;
}

export type View = "landing" | "feed" | "profile";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    avatar: string;
    bio?: string;
}

export interface Post {
    id: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    title: string;
    content: string;
    image?: string;
    createdAt: Date;
    likes: number;
    isLiked: boolean;
    isBookmarked: boolean;
    commentsCount: number;
    isOwner: boolean;
}

export interface Comment {
    id: string;
    postId: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    content: string;
    createdAt: Date;
    likes: number;
}

export type View = "landing" | "feed" | "profile";

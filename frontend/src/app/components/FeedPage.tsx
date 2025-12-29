import { Header } from "./Header";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { motion } from "framer-motion";
import { type Post } from "../types";
import {usePosts} from "../hooks/usePosts.ts";
import { useAuth } from "../hooks/useAuth.ts";
import {useState} from "react";

interface FeedPageProps {
    onLogout: () => void;
}

export function FeedPage({ onLogout }: FeedPageProps) {
    const { currentUser } = useAuth();
    const { posts, isLoading, likePost, bookmarkPost, createPost, updatePost, deletePost, addComment } = usePosts(currentUser?.id);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);

    const handleCreatePost = (postData: { title: string; content: string; image?: string }) => {
        if (!currentUser) return;

        createPost(postData, {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
        });
    };

    const handleEditPost = (postId: string) => {
        const post = posts.find((p) => p.id === postId);
        if (post) {
            setEditingPost(post);
            setIsCreateModalOpen(true);
        }
    };

    const handleUpdatePost = (postData: { title: string; content: string; image?: string }) => {
        if (editingPost) {
            updatePost(editingPost.id, {
                title: postData.title,
                content: postData.content,
                image: postData.image,
            });
            setEditingPost(undefined);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F]">
            <Header
                onCreatePost={() => {
                    setEditingPost(undefined);
                    setIsCreateModalOpen(true);
                }}
                onLogout={onLogout}
                userName={currentUser?.name || "User"}
                userAvatar={currentUser?.avatar || ""}
            />

            <main className="pt-24 pb-8">
                <div className="max-w-4xl mx-auto px-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-[#1A1A1A] rounded-xl h-96 border border-[#2A2A2A] animate-pulse"
                                />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-medium text-gray-400 mb-4">
                                Лента пуста
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Будьте первым, кто поделится чем-то интересным!
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="btn-primary"
                            >
                                Создать первый пост
                            </button>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onLike={likePost}
                                onBookmark={bookmarkPost}
                                onEdit={post.isOwner ? handleEditPost : undefined}
                                onDelete={post.isOwner ? deletePost : undefined}
                                onComment={addComment}
                            />
                        ))
                    )}
                </div>
            </main>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingPost(undefined);
                }}
                onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
                editPost={
                    editingPost
                        ? {
                            id: editingPost.id,
                            title: editingPost.title,
                            content: editingPost.content,
                            image: editingPost.image,
                        }
                        : undefined
                }
            />
        </div>
    );
}

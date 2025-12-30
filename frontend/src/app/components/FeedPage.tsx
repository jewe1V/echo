import { Header } from "./Header";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { motion } from "framer-motion";
import { type Post } from "../types";
import {usePosts} from "../hooks/usePosts.ts";
import { useAuth } from "../hooks/useAuth.ts";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "./AuthModal.tsx";


export function FeedPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [modalError, setModalError] = useState<string | null>(null);


    const { currentUser, logout, login, register } = useAuth();
    const { posts, isLoading, likePost, bookmarkPost, createPost, updatePost, deletePost, addComment } = usePosts();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
    const navigate = useNavigate();

    const handleCreatePost = (postData: { title: string; content: string; image?: string }) => {
        if (!currentUser) return;
        createPost(postData);
    };

    const handleEditPost = (postId: string) => {
        const post = posts.find((p) => p.post_id === postId || p.id === postId);
        if (post) {
            setEditingPost(post);
            setIsCreateModalOpen(true);
        }
    };


  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      navigate("/feed");
    } else {
      setModalError(result.error || "Ошибка входа");
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const result = await register(name, email, password);
    if (result.success) {
      navigate("/feed");
    } else {
      setModalError(result.error || "Ошибка регистрации");
    }
  };

  const handleOpenLogin = () => {
    setModalError(null);
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

    const handleUpdatePost = (postData: { title: string; content: string; image?: string }) => {
        if (editingPost) {
            updatePost(editingPost.post_id || editingPost.id, {
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
                onProfileClick={() => navigate("/profile")}
                onLogout={() => logout()}
                onLogin={() => handleOpenLogin()}
                userName={currentUser?.name || "User"}
                userEmail={currentUser?.email || ""}
                isAuthenticated={!!currentUser}
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
                            id: editingPost.post_id || editingPost.id,
                            title: editingPost.title,
                            content: editingPost.text || editingPost.content,
                            image: editingPost.imgUrl || editingPost.image,
                        }
                        : undefined
                }
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => {
                    setIsAuthModalOpen(false);
                    setModalError(null);
                }}
                onLogin={handleLogin}
                onRegister={handleRegister}
                initialMode={authMode}
            />
    
            {/* Modal Error Display (outside modal) */}
            {modalError && !isAuthModalOpen && (
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm"
                >
                    <p className="text-red-400 text-sm">{modalError}</p>
                </motion.div>
            )}
        </div>
    );
}

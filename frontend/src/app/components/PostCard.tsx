import { useState } from "react";
import { Heart, EllipsisVertical, Pen, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Post } from "../types";
import { getGradientAvatarData } from "../utils";

interface PostCardProps {
    post: Post;
    onLike: (postId: string) => void;
    onBookmark?: (postId: string) => void;
    onEdit?: (postId: string) => void;
    onDelete?: (postId: string) => void;
    onComment?: (postId: string, comment: string) => void;
}

export function PostCard({
    post,
    onLike,
    onEdit,
    onDelete,
}: PostCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [imageModal, setImageModal] = useState(false);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}д назад`;
        if (hours > 0) return `${hours}ч назад`;
        return "Только что";
    };

    const avatarData = getGradientAvatarData(post.author.name || post.author.username || post.author.id || "U");
    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] mb-4"
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white select-none"
                            style={{ background: avatarData.color }}
                        >
                            {avatarData.letter}
                        </div>
                        <div>
                            <p className="text-[#E0E0E0] font-semibold">{post.author.name}</p>
                            <p className="text-[#888888] text-sm">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>

                    {post.isOwner && (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-full hover:bg-[#2A2A2A] text-[#888888]"
                            >
                                <EllipsisVertical className="w-5 h-5" />
                            </motion.button>

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-40 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg z-10"
                                    >
                                        {onEdit && (
                                            <button
                                                onClick={() => { onEdit(post.id); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-[#E0E0E0] hover:bg-[#2A2A2A] flex items-center gap-2"
                                            >
                                                <Pen className="w-4 h-4" /> Редактировать
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => { onDelete(post.id); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-[#FF4757] hover:bg-[#2A2A2A] flex items-center gap-2"
                                            >
                                                <Trash className="w-4 h-4" /> Удалить
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {post.image && (
                    <div className="relative">
                        <img
                            src={post.image}
                            alt={post.title}
                            onClick={() => setImageModal(true)}
                            className="w-full h-96 object-cover cursor-pointer"
                        />
                    </div>
                )}

                <div className="p-4">
                    <h2 className="mb-2 text-[#E0E0E0] text-xl font-bold">{post.title}</h2>
                    <p className="text-[#E0E0E0] leading-relaxed mb-2">{post.content}</p>
                </div>

                <div className="px-4 pb-4 flex items-center gap-6">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onLike(post.id)} className="flex items-center gap-2 group">
                        <motion.div animate={post.isLiked ? { scale: [1, 1.3, 1] } : {}}>
                            <Heart className={`w-5 h-5 transition-colors ${post.isLiked ? "fill-[#00FF9D] text-[#00FF9D]" : "text-[#888888] group-hover:text-[#00FF9D]"}`} />
                        </motion.div>
                        <span className={`text-sm ${post.isLiked ? "text-[#00FF9D]" : "text-[#888888] group-hover:text-[#00FF9D]"}`}>
                            {post.likes}
                        </span>
                    </motion.button>
                </div>
            </motion.article>

            <AnimatePresence>
                {imageModal && post.image && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setImageModal(false)}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    >
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            src={post.image}
                            alt={post.title}
                            className="max-w-full max-h-full object-contain rounded-xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
import { useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, EllipsisVertical, Pen, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentSection } from "./CommentSection.tsx";

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

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
}

export function PostCard({
  post,
  onLike,
  onBookmark,
  onEdit,
  onDelete,
  onComment,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
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

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] mb-4"
      >
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-[#E0E0E0]">{post.author.name}</p>
              <p className="text-[#888888] text-sm">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          {/* Menu */}
          {post.isOwner && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-[#2A2A2A] text-[#888888] transition-colors"
              >
                <EllipsisVertical className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-12 w-40 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg overflow-hidden z-10"
                  >
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(post.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[#E0E0E0] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                      >
                        <Pen className="w-4 h-4" />
                        <span>Редактировать</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(post.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[#FF4757] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                        <span>Удалить</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Image */}
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

        {/* Content */}
        <div className="p-4">
          <h2 className="mb-2 text-[#E0E0E0]">{post.title}</h2>
          <p className="text-[#E0E0E0] leading-relaxed">{post.content}</p>
        </div>

        {/* Actions Panel */}
        <div className="px-4 pb-4 flex items-center gap-6">
          {/* Like */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2 group"
          >
            <motion.div
              animate={post.isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  post.isLiked
                    ? "fill-[#00FF9D] text-[#00FF9D]"
                    : "text-[#888888] group-hover:text-[#00FF9D]"
                }`}
              />
            </motion.div>
            <span
              className={`text-sm ${
                post.isLiked ? "text-[#00FF9D]" : "text-[#888888] group-hover:text-[#00FF9D]"
              }`}
            >
              {post.likes}
            </span>
          </motion.button>

          {/* Comment */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 group"
          >
            <MessageCircle className="w-5 h-5 text-[#888888] group-hover:text-[#00FF9D] transition-colors" />
            <span className="text-sm text-[#888888] group-hover:text-[#00FF9D]">
              {post.commentsCount}
            </span>
          </motion.button>

          {/* Share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="group"
          >
            <Share className="w-5 h-5 text-[#888888] group-hover:text-[#00FF9D] transition-colors" />
          </motion.button>

          {/* Bookmark */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onBookmark(post.id)}
            className="ml-auto"
          >
            <Bookmark
              className={`w-5 h-5 transition-colors ${
                post.isBookmarked
                  ? "fill-[#00FF9D] text-[#00FF9D]"
                  : "text-[#888888] hover:text-[#00FF9D]"
              }`}
            />
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CommentSection
                postId={post.id}
                onComment={(comment) => onComment(post.id, comment)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* Full Screen Image Modal */}
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
              exit={{ scale: 0.8 }}
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

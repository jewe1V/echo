import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

interface CommentSectionProps {
  postId: string;
  onComment: (comment: string) => void;
}

// Моковые комментарии
const mockComments: Comment[] = [
  {
    id: "1",
    author: {
      name: "Анна Смирнова",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    content: "Отличный пост! Очень вдохновляет 🔥",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    likes: 5,
    isLiked: false,
  },
  {
    id: "2",
    author: {
      name: "Дмитрий Козлов",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    content: "Согласен! Нужно больше такого контента",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    likes: 2,
    isLiked: false,
  },
];

export function CommentSection({ postId, onComment }: CommentSectionProps) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(comment);
      setComment("");
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}ч назад`;
    if (minutes > 0) return `${minutes}м назад`;
    return "Только что";
  };

  return (
    <div className="border-t border-[#2A2A2A] bg-[#121212]">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="p-4 flex gap-3">
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите комментарий..."
            className="flex-1 bg-[#1A1A1A] text-[#E0E0E0] px-4 py-2 rounded-full border border-[#2A2A2A] focus:border-[#00FF9D] focus:outline-none transition-colors placeholder:text-[#888888]"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!comment.trim()}
            className="px-4 py-2 bg-[#00FF9D] text-[#0F0F0F] rounded-full hover:shadow-[0_0_20px_rgba(0,255,157,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            Отправить
          </motion.button>
        </div>
      </form>

      {/* Comments List */}
      <div className="px-4 pb-4 space-y-4">
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="bg-[#1A1A1A] rounded-xl px-4 py-3">
                <p className="text-[#E0E0E0] mb-1">{comment.author.name}</p>
                <p className="text-[#E0E0E0]">{comment.content}</p>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-xs text-[#888888]">{formatTime(comment.createdAt)}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 group"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      comment.isLiked
                        ? "fill-[#00FF9D] text-[#00FF9D]"
                        : "text-[#888888] group-hover:text-[#00FF9D]"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      comment.isLiked
                        ? "text-[#00FF9D]"
                        : "text-[#888888] group-hover:text-[#00FF9D]"
                    }`}
                  >
                    {comment.likes}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

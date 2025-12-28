import { useState } from "react";
import { motion } from "framer-motion";
import { type Post, PostCard } from "./PostCard.tsx";

interface ProfilePageProps {
  onBack: () => void;
  posts: Post[];
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
}

type Tab = "posts" | "bookmarks" | "likes";

export function ProfilePage({
  onBack,
  posts,
  onLike,
  onBookmark,
  onEdit,
  onDelete,
  onComment,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  // Фильтруем посты для текущего пользователя
  const userPosts = posts.filter((post) => post.isOwner);
  const bookmarkedPosts = posts.filter((post) => post.isBookmarked);
  const likedPosts = posts.filter((post) => post.isLiked);

  const currentPosts =
    activeTab === "posts"
      ? userPosts
      : activeTab === "bookmarks"
      ? bookmarkedPosts
      : likedPosts;

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cover & Avatar */}
        <div className="relative mb-20">
          <div className="h-48 bg-gradient-to-br from-[#00FF9D]/20 to-[#00D081]/20 rounded-xl" />
          <div className="absolute -bottom-16 left-8">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-[#0F0F0F]"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="absolute top-4 right-4 px-4 py-2 bg-[#1A1A1A] text-[#E0E0E0] rounded-full hover:bg-[#2A2A2A] transition-colors"
          >
            Назад к ленте
          </motion.button>
        </div>

        {/* Profile Info */}
        <div className="mb-8">
          <h1 className="mb-2 text-[#E0E0E0]">Александр Петров</h1>
          <p className="text-[#888888] mb-4">
            Фотограф, путешественник. Делюсь вдохновением и моментами жизни.
          </p>

          <div className="flex gap-6">
            <div>
              <p className="text-[#E0E0E0]">{userPosts.length}</p>
              <p className="text-[#888888] text-sm">Постов</p>
            </div>
            <div>
              <p className="text-[#E0E0E0]">1.2K</p>
              <p className="text-[#888888] text-sm">Подписчиков</p>
            </div>
            <div>
              <p className="text-[#E0E0E0]">345</p>
              <p className="text-[#888888] text-sm">Подписок</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#2A2A2A]">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 relative transition-colors ${
              activeTab === "posts" ? "text-[#00FF9D]" : "text-[#888888] hover:text-[#E0E0E0]"
            }`}
          >
            Мои посты
            {activeTab === "posts" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF9D]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`px-6 py-3 relative transition-colors ${
              activeTab === "bookmarks" ? "text-[#00FF9D]" : "text-[#888888] hover:text-[#E0E0E0]"
            }`}
          >
            Закладки
            {activeTab === "bookmarks" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF9D]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`px-6 py-3 relative transition-colors ${
              activeTab === "likes" ? "text-[#00FF9D]" : "text-[#888888] hover:text-[#E0E0E0]"
            }`}
          >
            Лайки
            {activeTab === "likes" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF9D]"
              />
            )}
          </button>
        </div>

        {/* Posts Grid */}
        <div className="pb-8">
          {currentPosts.length > 0 ? (
            currentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={onLike}
                onBookmark={onBookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onComment={onComment}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-[#888888]">
                {activeTab === "posts"
                  ? "Вы ещё не создали ни одного поста"
                  : activeTab === "bookmarks"
                  ? "У вас нет сохранённых постов"
                  : "Вы ещё ничего не лайкнули"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

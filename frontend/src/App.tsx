import { useState } from "react";
import { Header } from "./app/components/Header.tsx";
import { PostCard, type Post } from "./app/components/PostCard.tsx";
import { CreatePostModal } from "./app/components/CreatePostModal.tsx";
import { ProfilePage } from "./app/components/ProfilePage.tsx";
import { LandingPage } from "./app/components/LandingPage.tsx";
import { motion } from "framer-motion";

type View = "landing" | "feed" | "profile";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
}

// Моковые данные постов
const initialPosts: Post[] = [
  {
    id: "1",
    author: {
      id: "user1",
      name: "Александр Петров",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    },
    title: "Волшебство горных пейзажей",
    content: "Каждое утро в горах начинается с невероятных видов. Это место дарит покой и вдохновение. Природа здесь живёт своей жизнью, и ты становишься её частью.",
    image: "https://images.unsplash.com/photo-1683669447068-3ce32ed90f21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGUlMjBtb3VudGFpbnN8ZW58MXx8fHwxNzY2Nzg3NzgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    likes: 124,
    isLiked: true,
    isBookmarked: false,
    commentsCount: 8,
    isOwner: true,
  },
  {
    id: "2",
    author: {
      id: "user2",
      name: "Мария Соколова",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    title: "Ночной город не спит",
    content: "Огни мегаполиса создают особую атмосферу. В этих улицах столько историй, столько жизни. Город живёт своим ритмом, и я просто наблюдаю за этим танцем света и тени.",
    image: "https://images.unsplash.com/photo-1642287040066-2bd340523289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXJjaGl0ZWN0dXJlJTIwbmlnaHR8ZW58MXx8fHwxNzY2NzYxOTEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    likes: 89,
    isLiked: false,
    isBookmarked: true,
    commentsCount: 12,
    isOwner: false,
  },
  {
    id: "3",
    author: {
      id: "user3",
      name: "Дмитрий Козлов",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    title: "Утренний кофе и вдохновение",
    content: "Иногда лучшие идеи приходят за чашкой кофе. Этот момент тишины перед началом дня — самый продуктивный. Минималистичное рабочее пространство помогает сосредоточиться на главном.",
    image: "https://images.unsplash.com/photo-1548123325-525b8e0cde7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjB3b3Jrc3BhY2UlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzY2ODU4Mzc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    likes: 156,
    isLiked: false,
    isBookmarked: false,
    commentsCount: 15,
    isOwner: false,
  },
  {
    id: "4",
    author: {
      id: "user4",
      name: "Анна Смирнова",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    title: "Закат у океана",
    content: "Нет ничего прекраснее заката на берегу океана. Волны, солнце, бе��конечность горизонта — всё это напоминает о том, как прекрасен наш мир. Моменты счастья в простых вещах.",
    image: "https://images.unsplash.com/photo-1598399929533-847def01aa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMGJlYWNoJTIwc3Vuc2V0fGVufDF8fHx8MTc2Njg2ODk3OHww&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    likes: 203,
    isLiked: true,
    isBookmarked: true,
    commentsCount: 24,
    isOwner: false,
  },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>("landing");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mock user storage
  const getStoredUsers = (): User[] => {
    const stored = localStorage.getItem("echo_users");
    return stored ? JSON.parse(stored) : [];
  };

  const saveUser = (user: User) => {
    const users = getStoredUsers();
    users.push(user);
    localStorage.setItem("echo_users", JSON.stringify(users));
  };

  const findUser = (email: string, password: string): User | undefined => {
    const users = getStoredUsers();
    return users.find((u) => u.email === email && u.password === password);
  };

  // Handlers
  const handleLogin = (email: string, password: string) => {
    const user = findUser(email, password);

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setCurrentView("feed");
    } else {
    }
  };

  const handleRegister = (name: string, email: string, password: string) => {
    const users = getStoredUsers();

    // Проверка на существующий email
    if (users.some((u) => u.email === email)) {
      return;
    }

    // Создание нового пользователя
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setCurrentView("feed");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView("landing");
  };

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
      )
    );
  };

  const handleCreatePost = (postData: { title: string; content: string; image?: string }) => {
    if (!currentUser) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
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
    setPosts([newPost, ...posts]);
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
      setPosts(
        posts.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                title: postData.title,
                content: postData.content,
                image: postData.image,
              }
            : post
        )
      );
      setEditingPost(undefined);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handleComment = (postId: string, comment: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, commentsCount: post.commentsCount + 1 }
          : post
      )
    );
  };

  // Render Landing Page
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    );
  }

  // Render Profile Page
  if (currentView === "profile") {
    return (
      <>
        <ProfilePage
          onBack={() => setCurrentView("feed")}
          posts={posts}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onComment={handleComment}
        />
      </>
    );
  }

  // Render Feed
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Header
        onCreatePost={() => {
          setEditingPost(undefined);
          setIsCreateModalOpen(true);
        }}
        onProfileClick={() => setCurrentView("profile")}
        onLogout={handleLogout}
        userName={currentUser?.name || "User"}
        userAvatar={currentUser?.avatar || ""}
      />

      {/* Feed */}
      <main className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Loading Skeleton - показываем при первой загрузке */}
          {posts.length === 0 ? (
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
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onEdit={post.isOwner ? handleEditPost : undefined}
                onDelete={post.isOwner ? handleDeletePost : undefined}
                onComment={handleComment}
              />
            ))
          )}
        </div>
      </main>

      {/* Create/Edit Post Modal */}
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

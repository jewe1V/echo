import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { title: string; content: string; image?: string }) => void;
  editPost?: {
    id: string;
    title: string;
    content: string;
    image?: string;
  };
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  editPost,
}: CreatePostModalProps) {
  const [title, setTitle] = useState(editPost?.title || "");
  const [content, setContent] = useState(editPost?.content || "");
  const [image, setImage] = useState(editPost?.image || "");
  const [imagePreview, setImagePreview] = useState(editPost?.image || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
        image: image || undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setImage("");
    setImagePreview("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
                <h2 className="text-[#E0E0E0]">
                  {editPost ? "Редактировать пост" : "Новый пост"}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-[#2A2A2A] text-[#888888] transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {/* Title Input */}
                  <div>
                    <label htmlFor="title" className="block mb-2 text-[#E0E0E0]">
                      Заголовок
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="О чём этот пост?"
                      className="w-full bg-[#121212] text-[#E0E0E0] px-4 py-3 rounded-xl border border-[#2A2A2A] focus:border-[#00FF9D] focus:outline-none transition-colors placeholder:text-[#888888]"
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block mb-2 text-[#E0E0E0]">Изображение</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-xl"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => {
                            setImage("");
                            setImagePreview("");
                          }}
                          className="absolute top-3 right-3 p-2 bg-[#1A1A1A]/90 rounded-full text-[#E0E0E0] hover:bg-[#2A2A2A] transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-[#2A2A2A] rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#00FF9D] hover:bg-[#121212] transition-colors"
                      >
                        <Upload className="w-8 h-8 text-[#888888]" />
                        <span className="text-[#888888]">Нажмите для загрузки изображения</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Content Textarea */}
                  <div>
                    <label htmlFor="content" className="block mb-2 text-[#E0E0E0]">
                      Содержание
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Расскажите свою историю..."
                      rows={8}
                      className="w-full bg-[#121212] text-[#E0E0E0] px-4 py-3 rounded-xl border border-[#2A2A2A] focus:border-[#00FF9D] focus:outline-none transition-colors placeholder:text-[#888888] resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#2A2A2A] flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 rounded-full text-[#E0E0E0] hover:bg-[#2A2A2A] transition-colors"
                  >
                    Отмена
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                    className="px-6 py-3 bg-[#00FF9D] text-[#0F0F0F] rounded-full hover:shadow-[0_0_20px_rgba(0,255,157,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {editPost ? "Сохранить" : "Опубликовать"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

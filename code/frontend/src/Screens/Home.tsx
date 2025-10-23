import Navigation from "../components/header";
import CreatePostCard from "../components/createPost";
import { Card } from "../components/card";
import { Heart, MessageCircle, SendIcon, Share2 } from "lucide-react";
import { useState } from "react";

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  time: string;
}

const examplePosts: Post[] = [
  {
    id: 1,
    author: "Maria Pereira",
    avatar: "MP",
    content: "Hoje aprendi a usar o Radix UI e estou a adorar a flexibilidade que oferece! 😍",
    image: "https://images.unsplash.com/photo-1753881907041-0aa92facfd3c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8M3x8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=900",
    time: "2h ago",
  },
  {
    id: 2,
    author: "João Costa",
    avatar: "JC",
    content: "Deploy do meu primeiro projeto Next.js concluído 🚀 Super simples com Vercel!",
    time: "5h ago",
  },
  {
    id: 3,
    author: "Ana Ribeiro",
    avatar: "AR",
    content: "Alguém mais está a testar o novo Tailwind v4 beta? As variáveis CSS estão incríveis 🔥",
    image: "https://images.unsplash.com/photo-1751528962027-ac9f0370ff5d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=774",
    time: "1d ago",
  },
];

export default function Home() {
  // Mantemos estado local de likes/comentários/shares
  const [postStats, setPostStats] = useState(
    examplePosts.map((p) => ({ id: p.id, likes: 0, comments: 0, shares: 0 }))
  );

  const handleAction = (id: number, type: "likes" | "comments" | "shares") => {
    setPostStats((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, [type]: post[type] + 1 } : post
      )
    );
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1128px] mx-auto px-6 py-6">
          <div className="max-w-[540px] mx-auto space-y-4">
            {/* Criador de Post */}
            <CreatePostCard />

            {/* Lista de Posts */}
            <div className="space-y-4">
              {examplePosts.map((post) => {
                const stats = postStats.find((p) => p.id === post.id)!;
                return (
                  <Card key={post.id} className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex gap-3 mb-1">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {post.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold leading-tight">{post.author}</h3>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Imagem */}
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post Image"
                        className="w-full rounded-md object-cover max-h-[400px]"
                      />
                    )}

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                      <span>{stats.likes} Likes</span>
                      <span>{stats.comments} Comments</span>
                      <span>{stats.shares} Shares</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-around pt-2 border-t border-border">
                      <button
                        onClick={() => handleAction(post.id, "likes")}
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                      >
                        <Heart className="w-4 h-4" /> Like
                      </button>
                      <button
                        onClick={() => handleAction(post.id, "comments")}
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Comment
                      </button>
                      <button
                        onClick={() => handleAction(post.id, "shares")}
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                      >
                        <SendIcon className="w-4 h-4" /> Send
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

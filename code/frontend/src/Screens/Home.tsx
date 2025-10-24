import Navigation from "../components/header";
import CreatePostCard from "../components/createPost";
import ProfileCard from "../components/profileCard";
import { Card } from "../components/card";
import { Heart, MessageCircle, SendIcon, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postsAPI, PostResponseDto } from "../services/postsService";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  time: string;
  userId: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [postStats, setPostStats] = useState<{ id: string; likes: number; comments: number; shares: number }[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');

        if (!userId) {
          console.error('User not logged in');
          navigate('/');
          return;
        }

        const response = await postsAPI.getPostsByUserAndConnections(userId);

        if (response.success && response.data) {
          const formattedPosts: Post[] = response.data.posts.map((post: PostResponseDto) => {
            const initials = post.authorName
              ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase()
              : 'U';

            const timeAgo = getTimeAgo(post.createdAt);

            return {
              id: post.id,
              author: post.authorName || 'Unknown User',
              avatar: initials,
              content: post.content,
              time: timeAgo,
              userId: post.userId,
            };
          });

          setPosts(formattedPosts);
          setPostStats(formattedPosts.map((p) => ({ id: p.id, likes: 0, comments: 0, shares: 0 })));
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [navigate]);

  const getTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  const handleAction = (id: string, type: "likes" | "comments" | "shares") => {
    setPostStats((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, [type]: post[type] + 1 } : post
      )
    );
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1128px] mx-auto px-6 py-6 flex gap-6">
          <div className="hidden md:block w-[225px] flex-shrink-0 space-y-4 sticky top-20">
            <ProfileCard />
          </div>

          <div className="max-w-[540px] w-full space-y-4">

            <CreatePostCard />

            {isLoading ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">Loading posts...</p>
              </Card>
            ) : posts.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">No posts to display. Start connecting with people or create your first post!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const stats = postStats.find((p) => p.id === post.id)!;
                  return (
                    <Card key={post.id} className="p-4 space-y-3">
                      <div className="flex gap-3 mb-1">
                        <div
                          onClick={handleProfileClick}
                          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {post.avatar}
                        </div>
                        <div>
                          <h3
                            onClick={handleProfileClick}
                            className="font-semibold leading-tight cursor-pointer hover:underline"
                          >
                            {post.author}
                          </h3>
                          <span className="text-xs text-muted-foreground">{post.time}</span>
                        </div>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-line">
                        {post.content}
                      </p>

                      {post.image && (
                        <img
                          src={post.image}
                          alt="Post Image"
                          className="w-full rounded-md object-cover max-h-[400px]"
                        />
                      )}

                      <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                        <span>{stats.likes} Likes</span>
                        <span>{stats.comments} Comments</span>
                        <span>{stats.shares} Shares</span>
                      </div>

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
            )}
          </div>        </div>
      </div>
    </>
  );
}
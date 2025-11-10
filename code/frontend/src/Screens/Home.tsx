import Navigation from "../components/header";
import CreatePostCard from "../components/createPost";
import ProfileCard from "../components/profileCard";
import { Card } from "../components/card";
import { ThumbsUp, MessageCircle, SendIcon, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postsAPI, PostResponseDto } from "../services/postsService";
import Loading from "../components/loading";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  time: string;
  userId: string;
  likes?: number;
  liked?: boolean;
  commentsCount?: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const style = document.createElement('style');
  style.innerHTML = `
  html, body {
    overflow: hidden !important;
    height: 100%;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
  if (typeof window !== 'undefined' && !document.head.querySelector('style[data-scrollbar-hide]')) {
    style.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(style);
  }

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

            // Usa o campo devolvido pelo backend para saber se o user já deu like
            // Ajusta o nome do campo conforme o backend (ex: likedByCurrentUser, isLiked, etc)
            return {
              id: post.id,
              author: post.authorName || 'Unknown User',
              avatar: initials,
              content: post.content,
              time: timeAgo,
              userId: post.userId,
              likes: (post as any).likes ?? 0,
              liked: (post as any).likedByCurrentUser ?? false,
              commentsCount: (post as any).commentsCount ?? 0,
            };
          });

          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [navigate]);

  // Comments and per-post UI state
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleLike = async (postId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return;

    const post = posts[idx];

    try {
      if (!post.liked) {
        const res = await postsAPI.likePost(postId, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? (post.likes || 0) + 1;
          const updated = [...posts];
          updated[idx] = { ...post, liked: true, likes: total };
          setPosts(updated);
        }
      } else {
        const res = await postsAPI.unlikePost(postId, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? Math.max((post.likes || 1) - 1, 0);
          const updated = [...posts];
          updated[idx] = { ...post, liked: false, likes: total };
          setPosts(updated);
        }
      }
    } catch (error) {
      console.error('Error toggling like', error);
    }
  };

  const toggleComments = async (postId: string) => {
    setCommentsOpen(prev => ({ ...prev, [postId]: !prev[postId] }));
    // If opening and not loaded, fetch
    if (!commentsMap[postId]) {
      const res = await postsAPI.getComments(postId);
      if (res.success && (res.data as any)) {
        setCommentsMap(prev => ({ ...prev, [postId]: (res.data as any).comments }));
        // Update commentsCount in post
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (res.data as any).total ?? p.commentsCount ?? 0 } : p));
      }
    }
  };

  const submitComment = async (postId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const res = await postsAPI.addComment(postId, content, userId);
      if (res.success && (res.data as any).comment) {
        // append comment locally
        setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), (res.data as any).comment] }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      }
    } catch (error) {
      console.error('Error adding comment', error);
    }
  };

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



  const handleProfileClick = (userId: string) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1128px] mx-auto px-6 py-6 flex gap-6">
          <div className="hidden md:block w-[225px] flex-shrink-0 space-y-4 sticky top-20">
            <ProfileCard />
          </div>

          <div
            className="max-w-[540px] w-full space-y-4 h-[calc(100vh-48px-48px)] overflow-y-auto scrollbar-hide"
            style={{ minHeight: 0 }}
          >

            <CreatePostCard />

            {posts.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">No posts to display. Start connecting with people or create your first post!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4 space-y-3">
                    <div className="flex gap-3 mb-1">
                      <div
                        onClick={() => handleProfileClick(post.userId)}
                        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {post.avatar}
                      </div>
                      <div>
                        <h3
                          onClick={() => handleProfileClick(post.userId)}
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

                    {/* Interactions: likes and comments (wired) */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-primary fill-primary" />
                        <span className="font-medium text-foreground">{post.likes ?? 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{post.commentsCount ?? 0} comentários</span>
                    </div>

                    <div className="flex justify-around pt-2 border-t border-border">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${post.liked ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                        type="button"
                        tabIndex={0}
                      >
                        <ThumbsUp className="w-4 h-4" /> {post.liked ? 'Liked' : 'Like'}
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                        type="button"
                        tabIndex={0}
                      >
                        <MessageCircle className="w-4 h-4" /> Comment
                      </button>
                      <button
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                        type="button"
                        tabIndex={0}
                      >
                        <SendIcon className="w-4 h-4" /> Send
                      </button>
                    </div>

                    {/* Comments section (toggle) */}
                    {commentsOpen[post.id] && (
                      <div className="mt-3">
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(commentsMap[post.id] || []).map((c: any) => (
                            <div key={c.id || Math.random()} className="p-2 bg-background border border-border rounded">
                              <div className="text-sm font-medium">{c.authorName || 'User'}</div>
                              <div className="text-sm text-foreground">{c.content}</div>
                              <div className="text-xs text-muted-foreground">{new Date(c.created_at || c.createdAt || Date.now()).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <input
                            value={commentInputs[post.id] ?? ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Write a comment..."
                            className="flex-1 rounded-md border border-border px-3 py-2"
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            className="bg-primary text-primary-foreground px-3 rounded-md"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
import Navigation from "../components/header";
import ProfileCard from "../components/profileCard";
import { Card } from "../components/card";
import { ThumbsUp, MessageCircle, SendIcon, Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { postsAPI, PostResponseDto } from "../services/postsService";
import { connectionAPI } from "../services/connectionService";
import { messagesAPI } from "../services/messagesService";
import Loading from "../components/loading";
import AIChatWidget from "../components/AIChatWidget";
import { useUser } from "../components/UserContext";

interface Post {
  id: string;
  author: string;
  avatar: string;
  avatarUrl?: string;
  content: string;
  image?: string;
  time: string;
  userId: string;
  likes?: number;
  liked?: boolean;
  commentsCount?: number;
}

// Modal for sending post (rendered by Home/SearchResults via state)
export function SendPostModal({ postId, open, onClose, connections, onToggleRecipient, selectedRecipients, onSend, sending }: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Send post</h3>
          <button onClick={onClose} className="text-muted-foreground">Close</button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">Select connections to send this post to:</p>

        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
          {connections.length === 0 ? (
            <div className="text-sm text-muted-foreground">No connections available</div>
          ) : (
            connections.map((c: any) => (
              <label key={c.user.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedRecipients[c.user.id]}
                  onChange={() => onToggleRecipient(c.user.id)}
                />
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">{(c.user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="text-sm font-medium">{c.user.name}</div>
                  <div className="text-xs text-muted-foreground">{c.user.email}</div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded bg-secondary">Cancel</button>
          <button
            onClick={() => onSend(postId)}
            disabled={sending || Object.values(selectedRecipients).every(v => !v)}
            className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- END Reused Modal from Home.tsx ---


export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading: isUserLoading } = useUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

  // Comments and per-post UI state (Copied from Home.tsx)
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Send post modal state (Copied from Home.tsx)
  const [sendModalOpenFor, setSendModalOpenFor] = useState<string | null>(null);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  // Extract search query from URL
  const searchQuery = new URLSearchParams(location.search).get('query') || '';
  const currentUserId = localStorage.getItem('userId') || '';
  
  // Reused utility function (Copied from Home.tsx)
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

  // --- START Reused Interaction Handlers from Home.tsx ---

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

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendToRecipients = async (postId: string) => {
    const senderId = localStorage.getItem('userId') || '';
    const recipientIds = Object.keys(selectedRecipients).filter(id => selectedRecipients[id]);
    if (!senderId || recipientIds.length === 0) return;
    setSending(true);
    try {
      await Promise.all(recipientIds.map(rid => messagesAPI.sendMessage(senderId, rid, '', postId)));
      setSendModalOpenFor(null);
    } catch (e) {
      console.error('Error sending post to recipients', e);
    } finally {
      setSending(false);
    }
  };
  
  // --- END Reused Interaction Handlers from Home.tsx ---


  useEffect(() => {
    const fetchSearchedPosts = async () => {
      if (!searchQuery) {
        setPosts([]);
        setIsPostsLoading(false);
        return;
      }

      try {
        setIsPostsLoading(true);

        // --- START TEMPORARY/SIMULATED SEARCH LOGIC ---
        // Fetch all posts and filter client-side since postsAPI.searchPosts is not defined.
        const response = await postsAPI.getPostsByUserAndConnections(currentUserId);

        if (response.success && response.data) {
            const rawPosts = response.data.posts as PostResponseDto[];

            // Client-side filtering based on search query
            const filteredRawPosts = rawPosts.filter(post =>
                post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const formattedPosts: Post[] = filteredRawPosts.map((post: PostResponseDto) => {
                const initials = post.authorName
                    ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : 'U';

                const timeAgo = getTimeAgo(post.createdAt);

                return {
                    id: post.id,
                    author: post.authorName || 'Unknown User',
                    avatar: initials,
                    avatarUrl: post.authorAvatarUrl,
                    content: post.content,
                    image: post.imageUrl,
                    time: timeAgo,
                    userId: post.userId,
                    likes: (post as any).likes ?? 0,
                    liked: (post as any).likedByCurrentUser ?? false,
                    commentsCount: (post as any).commentsCount ?? 0,
                };
            });

            setPosts(formattedPosts);
        }
        // --- END TEMPORARY/SIMULATED SEARCH LOGIC ---

      } catch (error) {
        console.error('Error fetching searched posts:', error);
        setPosts([]);
      } finally {
        setIsPostsLoading(false);
      }
    };

    fetchSearchedPosts();
  }, [searchQuery, currentUserId]);


  const handleProfileClick = (userId: string) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  if (isUserLoading || isPostsLoading) {
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
            {/* Search Results Header (Replaces CreatePostCard) */}
            <Card className="p-4 space-y-2">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <SearchIcon className="w-5 h-5" /> Search Results
              </h2>
              <p className="text-sm text-muted-foreground">
                Showing posts matching: <span className="font-medium text-primary">"{searchQuery}"</span>
              </p>
            </Card>

            {posts.length === 0 ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? `No posts found matching "${searchQuery}".` : 'Please enter a search query.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4 space-y-3">
                    {/* Post Content and Header */}
                    <div className="flex gap-3 mb-1">
                      {post.avatarUrl ? (
                        <img
                          src={post.avatarUrl}
                          alt={post.author}
                          onClick={() => handleProfileClick(post.userId)}
                          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div
                        onClick={() => handleProfileClick(post.userId)}
                        className={`w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity ${post.avatarUrl ? 'hidden' : ''}`}
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
                        <span className="text-[10px] text-muted-foreground">{post.time}</span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground whitespace-pre-line">
                      {post.content}
                    </p>

                    {post.image && (
                      <img
                        src={post.image}
                        alt=""
                        className="w-full rounded-md object-cover max-h-[400px]"
                      />
                    )}

                    {/* Interactions visual only, no logic */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{post.likes ?? 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{post.commentsCount ?? 0} comentários</span>
                    </div>

                    <div className="flex justify-around pt-2 border-t border-border">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-secondary"
                        type="button"
                        tabIndex={0}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.liked ? 'text-primary fill-primary' : ''}`} /> Like
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
                        onClick={async () => {
                          setSendModalOpenFor(post.id);
                          // fetch connections
                          const userId = localStorage.getItem('userId') || '';
                          try {
                            const res = await connectionAPI.getConnections(userId);
                            if (res.success) {
                              setConnectionsList(res.data.connections || []);
                            } else {
                              setConnectionsList([]);
                            }
                            setSelectedRecipients({});
                          } catch (e) {
                            console.error('Error fetching connections', e);
                            setConnectionsList([]);
                          }
                        }}
                      >
                        <SendIcon className="w-4 h-4" /> Send
                      </button>
                    </div>

                    {/* Comments Section */}
                    {commentsOpen[post.id] && (
                      <div className="mt-3">
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(commentsMap[post.id] || []).map((c: any) => (
                            <div key={c.id || Math.random()} className="p-2 rounded">
                              <div className="flex items-start gap-3">
                                {c.authorAvatarUrl ? (
                                  <img
                                    src={c.authorAvatarUrl}
                                    alt={c.authorName || 'Avatar'}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                                    {(c.authorName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex flex-col flex-1">
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-[14px] font-medium text-black">{c.authorName}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(c.created_at || c.createdAt || Date.now()).toLocaleString()}</span>
                                  </div>
                                  <span className="text-sm text-foreground whitespace-pre-line mt-1">{c.content}</span>
                                </div>
                              </div>
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
      <AIChatWidget />
      {/* Send post modal */}
      <SendPostModal
        postId={sendModalOpenFor}
        open={!!sendModalOpenFor}
        onClose={() => {
          setSendModalOpenFor(null);
          setSelectedRecipients({}); // Reset recipients when closing
        }}
        connections={connectionsList}
        onToggleRecipient={toggleRecipient}
        selectedRecipients={selectedRecipients}
        onSend={handleSendToRecipients}
        sending={sending}
      />
    </>
  );
}
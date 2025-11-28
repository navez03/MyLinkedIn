import Navigation from "../components/header";
import CreatePostCard from "../components/createPost";
import ProfileCard from "../components/profileCard";
import { Card } from "../components/card";
import { ThumbsUp, MessageCircle, SendIcon, Share2, Calendar, UserPlus, TrendingUp, Sparkles, Repeat2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postsAPI, PostResponseDto } from "../services/postsService";
import { connectionAPI } from "../services/connectionService";
import { messagesAPI } from "../services/messagesService";
import { eventsService } from "../services/eventsService";
import Loading from "../components/loading";
import AIChatWidget from "../components/AIChatWidget";
import { useUser } from "../components/UserContext";

interface Post {
  id: string;
  author: string;
  avatar: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  image?: string;
  time: string;
  userId: string;
  likes?: number;
  liked?: boolean;
  commentsCount?: number;
  eventId?: string;
  event?: {
    id: string;
    name: string;
    date: string;
    bannerUrl?: string;
  };
  isRepost?: boolean;
  repostedBy?: string;
  repostedByUserId?: string;
  repostedByAvatar?: string;
  repostedByAvatarUrl?: string;
  repostComment?: string;
  originalPost?: Post;
  // Original post data from repost
  originalPostContent?: string;
  originalPostAuthorName?: string;
  originalPostAuthorId?: string;
  originalPostAuthorAvatarUrl?: string;
  originalPostImageUrl?: string;
  originalPostCreatedAt?: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { isLoading: isUserLoading } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [repostingPostId, setRepostingPostId] = useState<string | null>(null);
  const [repostComment, setRepostComment] = useState("");

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

  const fetchPosts = async () => {
    try {
      setIsPostsLoading(true);
      const userId = localStorage.getItem('userId');

      if (!userId) {
        console.error('User not logged in');
        navigate('/');
        return;
      }

      const response = await postsAPI.getPostsByUserAndConnections(userId);

      if (response.success && response.data) {
        const formattedPosts: Post[] = response.data.posts.map((post: any) => {
          const initials = post.authorName
            ? post.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : 'U';

          const timeAgo = getTimeAgo(post.createdAt);

          // Handle repost data
          const isRepost = !!post.repostedBy;
          const repostData = isRepost ? {
            isRepost: true,
            repostedBy: post.repostedByName || post.repostedBy,
            repostedByUserId: post.repostedByUserId,
            repostedByAvatar: post.repostedByName
              ? post.repostedByName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              : 'U',
            repostedByAvatarUrl: post.repostedByAvatarUrl,
            repostComment: post.repostComment,
            originalPostContent: post.originalPostContent,
            originalPostAuthorName: post.originalPostAuthorName,
            originalPostAuthorId: post.originalPostAuthorId,
            originalPostAuthorAvatarUrl: post.originalPostAuthorAvatarUrl,
            originalPostImageUrl: post.originalPostImageUrl,
            originalPostCreatedAt: post.originalPostCreatedAt,
            event: post.event, // Keep event data for reposts
          } : {};

          return {
            id: post.id,
            author: post.authorName || 'Unknown User',
            avatar: initials,
            avatarUrl: post.authorAvatarUrl,
            content: post.content,
            image: post.imageUrl,
            time: timeAgo,
            userId: post.userId,
            createdAt: post.createdAt,
            likes: (post as any).likes ?? 0,
            liked: (post as any).likedByCurrentUser ?? false,
            commentsCount: (post as any).commentsCount ?? 0,
            eventId: post.eventId,
            event: post.event,
            ...repostData,
          };
        });

        setPosts(formattedPosts);

        // Set trending posts (top 3 by likes)
        const sorted = [...formattedPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
        setTrendingPosts(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuggestedConnections = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await connectionAPI.getConnections(userId);
        if (response.success && response.data?.connections) {
          // Mock suggested connections - in real app, this would be a separate API
          // For now, just get some from existing connections or leave empty
          setSuggestedConnections([]);
        }
      } catch (error) {
        console.error('Error fetching suggested connections:', error);
      }
    };

    const fetchUpcomingEvents = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await eventsService.getAllEvents(50, 0);
        if (response.success && response.data?.events) {
          // Get next 3 upcoming events
          const now = new Date();
          const upcoming = response.data.events
            .filter((e: any) => new Date(e.date) >= now)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3);
          setUpcomingEvents(upcoming);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchPosts();
    fetchSuggestedConnections();
    fetchUpcomingEvents();
  }, [navigate]);

  // Comments and per-post UI state
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Send post modal state
  const [sendModalOpenFor, setSendModalOpenFor] = useState<string | null>(null);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

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

  const handleRepost = async (postId: string, withComment: boolean = false) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      // Call your repost API endpoint
      const response = await postsAPI.repostPost(postId, userId, withComment ? repostComment : undefined);

      if (response.success) {
        console.log('Post reposted successfully');
        setRepostModalOpen(false);
        setRepostComment("");
        setRepostingPostId(null);

        // Refresh posts to show the repost
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };



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
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6 justify-center">
          {/* Left Sidebar (ProfileCard) */}
          <div className="hidden md:block w-[225px] flex-shrink-0 space-y-4 sticky top-20 self-start">
            <ProfileCard />
          </div>

          {/* Main Content Area (Posts) */}
          <div
            className="w-full md:max-w-[540px] space-y-4 h-[calc(100vh-48px-48px)] overflow-y-auto scrollbar-hide"
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
                    {/* Repost Indicator */}
                    {post.isRepost && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Repeat2 className="w-4 h-4" />
                        <span className="font-medium">
                          {post.repostedByUserId === localStorage.getItem('userId')
                            ? 'You reposted this'
                            : `${post.repostedBy} reposted this`}
                        </span>
                      </div>
                    )}

                    {/* Reposter's Comment (if exists) */}

                    {post.isRepost && post.repostComment && (
                      <div className="mb-3">
                        <div className="flex gap-3 mb-2">
                          {post.repostedByAvatarUrl ? (
                            <img
                              src={post.repostedByAvatarUrl}
                              alt={post.repostedBy}
                              onClick={() => handleProfileClick(post.repostedByUserId!)}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div
                              onClick={() => handleProfileClick(post.repostedByUserId!)}
                              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {post.repostedByAvatar}
                            </div>
                          )}
                          <div>
                            <h3
                              onClick={() => handleProfileClick(post.repostedByUserId!)}
                              className="font-semibold text-sm leading-tight cursor-pointer hover:underline"
                            >
                              {post.repostedBy}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {post.createdAt && new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-line pl-13">
                          {post.repostComment}
                        </p>
                      </div>
                    )}

                    {/* Original post in a card when this is a repost */}
                    {post.isRepost && (
                      <div className="border-2 border-border rounded-lg p-3 bg-secondary/20">
                        <div className="flex gap-3 mb-2">
                          {post.originalPostAuthorAvatarUrl ? (
                            <img
                              src={post.originalPostAuthorAvatarUrl}
                              alt={post.originalPostAuthorName}
                              onClick={() => handleProfileClick(post.originalPostAuthorId!)}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div
                              onClick={() => handleProfileClick(post.originalPostAuthorId!)}
                              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {post.originalPostAuthorName
                                ? post.originalPostAuthorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                : 'U'}
                            </div>
                          )}
                          <div>
                            <h3
                              onClick={() => handleProfileClick(post.originalPostAuthorId!)}
                              className="font-semibold text-sm leading-tight cursor-pointer hover:underline"
                            >
                              {post.originalPostAuthorName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {post.originalPostCreatedAt && new Date(post.originalPostCreatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Original post content */}
                        <p className="text-sm text-foreground whitespace-pre-line mb-2">
                          {post.originalPostContent}
                        </p>

                        {/* Original post image */}
                        {post.originalPostImageUrl && (
                          <img
                            src={post.originalPostImageUrl}
                            alt="Post Image"
                            className="w-full rounded-md object-cover max-h-[400px] mb-2"
                          />
                        )}

                        {/* Original post event */}
                        {post.event && (
                          <div
                            className="cursor-pointer transition-all hover:opacity-90"
                            onClick={() => navigate(`/events/${post.event!.id}`)}
                          >
                            {post.event.bannerUrl ? (
                              <div className="relative w-full h-48 rounded-t-lg border border-border border-b-0 overflow-hidden">
                                <img
                                  src={post.event.bannerUrl}
                                  alt={post.event.name}
                                  className="w-full h-full object-contain bg-gradient-to-br"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="relative w-full h-48 bg-gradient-to-br rounded-t-lg border border-border border-b-0 overflow-hidden flex items-center justify-center">
                                <div className="text-8xl opacity-20">📅</div>
                              </div>
                            )}
                            <div className="p-3 bg-white rounded-b-lg border border-border border-t-0">
                              <h4 className="text-sm font-semibold text-foreground mb-2">{post.event.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{new Date(post.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                                <span>View event details</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Original Post Author - only show if NOT a repost (repost header shown above) */}
                    {!post.isRepost && (
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
                    )}

                    {/* Post Content - only for non-reposts */}
                    {!post.isRepost && (
                      <p className="text-sm text-foreground whitespace-pre-line">
                        {post.content}
                      </p>
                    )}

                    {/* Post Image - only for non-reposts */}
                    {!post.isRepost && post.image && (
                      <img
                        src={post.image}
                        alt="Post Image"
                        className="w-full rounded-md object-cover max-h-[400px]"
                      />
                    )}

                    {/* Event Card - only for non-reposts */}
                    {!post.isRepost && post.event && (
                      <div
                        className="cursor-pointer transition-all hover:opacity-90"
                        onClick={() => navigate(`/events/${post.event!.id}`)}
                      >
                        {post.event.bannerUrl ? (
                          <div className="relative w-full h-48 rounded-t-lg border border-border border-b-0 overflow-hidden">
                            <img
                              src={post.event.bannerUrl}
                              alt={post.event.name}
                              className="w-full h-full object-contain bg-gradient-to-br"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="relative w-full h-48 bg-gradient-to-br rounded-t-lg border border-border border-b-0 overflow-hidden flex items-center justify-center">
                            <div className="text-8xl opacity-20">📅</div>
                          </div>
                        )}
                        <div className="p-3 bg-white rounded-b-lg border border-border border-t-0">
                          <h4 className="text-sm font-semibold text-foreground mb-2">{post.event.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{new Date(post.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                            <span>View event details</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Likes and Comments Count */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{post.likes ?? 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{post.commentsCount ?? 0} comentários</span>
                    </div>

                    {/* Interaction Buttons */}
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
                        onClick={() => {
                          setRepostingPostId(post.id);
                          setRepostModalOpen(true);
                        }}
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                        type="button"
                        tabIndex={0}
                      >
                        <Repeat2 className="w-4 h-4" />
                        Repost
                      </button>
                      <button
                        className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                        type="button"
                        tabIndex={0}
                        onClick={async () => {
                          setSendModalOpenFor(post.id);
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

          {/* Right Sidebar - scrollable together */}
          <div className="hidden lg:block w-[300px] flex-shrink-0 h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide space-y-4 sticky top-20 self-start">
            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Trending Posts</h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {post.avatarUrl ? (
                          <img
                            src={post.avatarUrl}
                            alt={post.author}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {post.avatar}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{post.author}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {post.likes}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.commentsCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Upcoming Events</h3>
                </div>
                <div className="space-y-3">
                  {upcomingEvents.map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="cursor-pointer transition-all hover:opacity-90"
                    >
                      {/* Banner Image */}
                      {event.banner_url || event.bannerUrl ? (
                        <div className="relative w-full h-20 rounded-t-lg border border-border border-b-0 overflow-hidden">
                          <img
                            src={event.banner_url || event.bannerUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class=\"w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center\"><div class=\"text-6xl opacity-20\">📅</div></div>';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg border border-border border-b-0 overflow-hidden flex items-center justify-center">
                          <div className="text-6xl opacity-20">📅</div>
                        </div>
                      )}
                      {/* Event info box */}
                      <div className="p-3 bg-white rounded-b-lg border border-border border-t-0">
                        <p className="text-sm font-semibold text-foreground mb-1">{event.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="w-full mt-3 text-sm text-primary hover:underline font-medium"
                >
                  View all events →
                </button>
              </Card>
            )}
            {/* Espaço vazio abaixo do Upcoming Events, dentro do scroll */}
            <span className="block w-full h-8" />
          </div>
        </div> {/* <-- ADDED: Closing div for 'max-w-[1400px]...' flex container */}
      </div> {/* <-- ADDED: Closing div for 'min-h-screen bg-background' */}

      <RepostModal
        open={repostModalOpen}
        onClose={() => {
          setRepostModalOpen(false);
          setRepostComment("");
          setRepostingPostId(null);
        }}
        onRepost={(withComment) => {
          if (repostingPostId) {
            handleRepost(repostingPostId, withComment);
          }
        }}
        comment={repostComment}
        setComment={setRepostComment}
      />
      <AIChatWidget />
      {/* Send post modal */}
      <SendPostModal
        postId={sendModalOpenFor}
        open={!!sendModalOpenFor}
        onClose={() => setSendModalOpenFor(null)}
        connections={connectionsList}
        onToggleRecipient={toggleRecipient}
        selectedRecipients={selectedRecipients}
        onSend={handleSendToRecipients}
        sending={sending}
      />
    </>
  );
}

export function RepostModal({
  open,
  onClose,
  onRepost,
  comment,
  setComment
}: {
  open: boolean;
  onClose: () => void;
  onRepost: (withComment: boolean) => void;
  comment: string;
  setComment: (comment: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Repost</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose how you want to share this post with your network
          </p>

          {/* Quick Repost Button */}
          <button
            onClick={() => onRepost(false)}
            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Repeat2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Repost</p>
                <p className="text-xs text-muted-foreground">Instantly share with your network</p>
              </div>
            </div>
          </button>

          {/* Repost with Comment */}
          <div className="p-4 rounded-lg border-2 border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Repost with your thoughts</p>
                <p className="text-xs text-muted-foreground">Add a comment to the post</p>
              </div>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What do you think about this?"
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <button
              onClick={() => onRepost(true)}
              disabled={!comment.trim()}
              className="w-full mt-3 px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Repost with comment
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary/30 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg font-medium border-2 border-border text-foreground hover:bg-secondary transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
// Note: SendPostModal will be rendered by the Home component when needed

// Modal for sending post (rendered by Home above via state)
export function SendPostModal({ postId, open, onClose, connections, onToggleRecipient, selectedRecipients, onSend, sending }: any) {
  if (!open) return null;

  const selectedCount = Object.values(selectedRecipients).filter(v => v).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Share Post</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedCount > 0 ? `${selectedCount} connection${selectedCount > 1 ? 's' : ''} selected` : 'Select connections to share with'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">No connections available</p>
                <p className="text-xs text-muted-foreground mt-1">Connect with people to share posts</p>
              </div>
            ) : (
              connections.map((c: any) => (
                <label
                  key={c.user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedRecipients[c.user.id]
                    ? 'bg-primary/10 border-primary hover:bg-primary/15'
                    : 'bg-transparent border-transparent hover:bg-secondary'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedRecipients[c.user.id]}
                    onChange={() => onToggleRecipient(c.user.id)}
                    className="w-5 h-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  {c.user.avatar_url ? (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm ${c.user.avatar_url ? 'hidden' : ''}`}>
                    {(c.user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{c.user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.user.email}</div>
                  </div>
                  {selectedRecipients[c.user.id] && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium border-2 border-border text-foreground hover:bg-secondary transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onSend(postId)}
              disabled={sending || selectedCount === 0}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 disabled:shadow-none"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                `Share with ${selectedCount || ''} ${selectedCount === 1 ? 'connection' : 'connections'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

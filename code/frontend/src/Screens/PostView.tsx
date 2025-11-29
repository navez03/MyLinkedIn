import React, { useEffect, useState } from 'react';
import Navigation from '../components/header';
import { Card } from '../components/card';
import ProfileCard from '../components/profileCard';
import Loading from '../components/loading';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI, PostResponseDto } from '../services/postsService';
import { connectionAPI } from '../services/connectionService';
import { messagesAPI } from '../services/messagesService';
import { eventsService } from '../services/eventsService';
import { ThumbsUp, MessageCircle, SendIcon, TrendingUp, Calendar, Repeat2 } from 'lucide-react';

type PostViewState = PostResponseDto & {
  likes: number;
  liked: boolean;
  commentsCount: number;
};


const PostView: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [repostComment, setRepostComment] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');

        // Load post
        const res = await postsAPI.getPostById(postId);
        if (res.success && res.data.post) {
          const p = res.data.post;
          setPost({
            ...p,
            likes: (p as any).likes ?? 0,
            liked: (p as any).likedByCurrentUser ?? false,
            commentsCount: (p as any).commentsCount ?? 0,
            // outros campos podem ser mapeados aqui se necessário
          });

          // Load comments immediately
          const commentsRes = await postsAPI.getComments(postId);
          if (commentsRes.success && (commentsRes.data as any)) {
            const fetchedComments = (commentsRes.data as any).comments || [];
            setComments(fetchedComments);
            setPost(prev => ({ ...prev!, commentsCount: fetchedComments.length } as any));
          }
        }

        // Load trending and events in parallel
        if (userId) {
          const [postsRes, eventsRes] = await Promise.all([
            postsAPI.getPostsByUserAndConnections(userId),
            eventsService.getAllEvents(50, 0)
          ]);

          // Get trending posts
          if (postsRes.success && postsRes.data) {
            const allPosts = postsRes.data.posts || [];
            const sorted = [...allPosts].sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));
            setTrendingPosts(sorted.slice(0, 3));
          }

          // Get upcoming events
          if (eventsRes.success && eventsRes.data?.events) {
            const now = new Date();
            const upcoming = eventsRes.data.events
              .filter((e: any) => new Date(e.date) >= now)
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3);
            setUpcomingEvents(upcoming);
          }
        }
      } catch (e) {
        console.error('Error loading data', e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;

    try {
      const currentLikes = (post as any).likes || 0;
      const isLiked = (post as any).liked || false;

      if (!isLiked) {
        const res = await postsAPI.likePost(post.id, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? (currentLikes + 1);
          setPost({ ...post, likes: total, liked: true } as any);
        }
      } else {
        const res = await postsAPI.unlikePost(post.id, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? Math.max(currentLikes - 1, 0);
          setPost({ ...post, likes: total, liked: false } as any);
        }
      }
    } catch (error) {
      console.error('Error toggling like', error);
    }
  };

  const toggleComments = async () => {
    setCommentsOpen(!commentsOpen);
    if (!commentsOpen && comments.length === 0) {
      const res = await postsAPI.getComments(post!.id);
      if (res.success && (res.data as any)) {
        const fetchedComments = (res.data as any).comments || [];
        setComments(fetchedComments);
      }
    }
  };

  const submitComment = async () => {
    if (!post || !commentInput.trim()) return;
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;

    try {
      const res = await postsAPI.addComment(post.id, commentInput, userId);
      if (res.success && (res.data as any).comment) {
        const updatedComments = [...comments, (res.data as any).comment];
        setComments(updatedComments);
        setCommentInput('');
        setPost({ ...post, commentsCount: updatedComments.length } as any);
      }
    } catch (error) {
      console.error('Error adding comment', error);
    }
  };

  const handleOpenSendModal = async () => {
    setSendModalOpen(true);
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
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendToRecipients = async () => {
    if (!post) return;
    const senderId = localStorage.getItem('userId') || '';
    const recipientIds = Object.keys(selectedRecipients).filter(id => selectedRecipients[id]);
    if (!senderId || recipientIds.length === 0) return;

    setSending(true);
    try {
      await Promise.all(recipientIds.map(rid => messagesAPI.sendMessage(senderId, rid, '', post.id)));
      alert('Post sent to selected recipients');
      setSendModalOpen(false);
    } catch (e) {
      console.error('Error sending post to recipients', e);
      alert('There was an error sending the post to one or more recipients');
    } finally {
      setSending(false);
    }
  };

  const handleRepost = async (withComment: boolean = false) => {
    if (!post) return;
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;

    try {
      const response = await postsAPI.repostPost(post.id, userId, withComment ? repostComment : undefined);
      if (response.success) {
        setRepostModalOpen(false);
        setRepostComment('');
        alert('Post reposted successfully!');
      }
    } catch (error) {
      console.error('Error reposting:', error);
      alert('Error reposting post');
    }
  };

  if (loading) return <Loading />;

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-[1128px] mx-auto px-6 py-6">
          <Card className="p-6">Post not found</Card>
        </div>
      </div>
    );
  }

  const initials = post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const postLikes = (post as any).likes ?? 0;
  const postLiked = (post as any).liked ?? false;
  const postCommentsCount = (post as any).commentsCount ?? 0;
  const isRepost = !!(post as any).repostId;

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
            <Card className="p-4 space-y-3">
              {/* Repost Indicator */}
              {isRepost && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Repeat2 className="w-4 h-4" />
                  <span>
                    <span
                      onClick={() => navigate(`/profile/${(post as any).repostedByUserId}`)}
                      className="font-medium text-foreground hover:underline cursor-pointer"
                    >
                      {(post as any).repostedBy || (post as any).repostedByName}
                    </span>
                    {' '}reposted this
                  </span>
                </div>
              )}

              {/* Reposter's Comment (if exists) */}
              {isRepost && (post as any).repostComment && (
                <div className="mb-3">
                  <div className="flex gap-3 mb-2">
                    {(post as any).repostedByAvatarUrl ? (
                      <img
                        src={(post as any).repostedByAvatarUrl}
                        alt={(post as any).repostedBy || (post as any).repostedByName}
                        onClick={() => navigate(`/profile/${(post as any).repostedByUserId}`)}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div
                        onClick={() => navigate(`/profile/${(post as any).repostedByUserId}`)}
                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {((post as any).repostedBy || (post as any).repostedByName || 'U')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3
                        onClick={() => navigate(`/profile/${(post as any).repostedByUserId}`)}
                        className="font-semibold text-sm leading-tight cursor-pointer hover:underline"
                      >
                        {(post as any).repostedBy || (post as any).repostedByName}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {(post as any).repostComment}
                  </p>
                </div>
              )}

              {/* Original post in a card when this is a repost */}
              {isRepost && (
                <div className="border-2 border-border rounded-lg p-3 bg-secondary/20">
                  <div className="flex gap-3 mb-2">
                    {(post as any).originalPostAuthorAvatarUrl ? (
                      <img
                        src={(post as any).originalPostAuthorAvatarUrl}
                        alt={(post as any).originalPostAuthorName}
                        onClick={() => navigate(`/profile/${(post as any).originalPostAuthorId}`)}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div
                        onClick={() => navigate(`/profile/${(post as any).originalPostAuthorId}`)}
                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {((post as any).originalPostAuthorName || 'U')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3
                        onClick={() => navigate(`/profile/${(post as any).originalPostAuthorId}`)}
                        className="font-semibold text-sm leading-tight cursor-pointer hover:underline"
                      >
                        {(post as any).originalPostAuthorName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {(post as any).originalPostCreatedAt &&
                          new Date((post as any).originalPostCreatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Original post content */}
                  <p className="text-sm text-foreground whitespace-pre-line mb-2">
                    {(post as any).originalPostContent}
                  </p>

                  {/* Original post image */}
                  {(post as any).originalPostImageUrl && (
                    <img
                      src={(post as any).originalPostImageUrl}
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
                          <span>
                            {new Date(post.event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                          <span>View event details</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Original Post Author - only show if NOT a repost */}
              {!isRepost && (
                <div className="flex gap-3 mb-1">
                  {post.authorAvatarUrl ? (
                    <img
                      src={post.authorAvatarUrl}
                      alt={post.authorName}
                      onClick={() => navigate(`/profile/${post.userId}`)}
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
                    onClick={() => navigate(`/profile/${post.userId}`)}
                    className={`w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity ${post.authorAvatarUrl ? 'hidden' : ''}`}
                  >
                    {initials}
                  </div>
                  <div>
                    <h3
                      onClick={() => navigate(`/profile/${post.userId}`)}
                      className="font-semibold leading-tight cursor-pointer hover:underline"
                    >
                      {post.authorName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Post Content - only for non-reposts */}
              {!isRepost && (
                <p className="text-sm text-foreground whitespace-pre-line">
                  {post.content}
                </p>
              )}

              {/* Post Image - only for non-reposts */}
              {!isRepost && post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post Image"
                  className="w-full rounded-md object-cover max-h-[400px]"
                />
              )}

              {/* Event Card - only for non-reposts */}
              {!isRepost && post.event && (
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
                      <span>
                        {new Date(post.event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                      <span>View event details</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactions: likes and comments */}
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{postLikes}</span>
                </div>
                <span className="text-xs text-muted-foreground">{postCommentsCount} comentários</span>
              </div>

              <div className="flex justify-around pt-2 border-t border-border">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${postLiked ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                  type="button"
                  tabIndex={0}
                >
                  <ThumbsUp className={`w-4 h-4 ${postLiked ? 'text-primary fill-primary' : ''}`} /> Like
                </button>
                <button
                  onClick={toggleComments}
                  className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                  type="button"
                  tabIndex={0}
                >
                  <MessageCircle className="w-4 h-4" /> Comment
                </button>
                <button
                  onClick={() => setRepostModalOpen(true)}
                  className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                  type="button"
                  tabIndex={0}
                >
                  <Repeat2 className="w-4 h-4" /> Repost
                </button>
                <button
                  onClick={handleOpenSendModal}
                  className="flex items-center gap-1 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
                  type="button"
                  tabIndex={0}
                >
                  <SendIcon className="w-4 h-4" /> Send
                </button>
              </div>

              {/* Comments section */}
              {commentsOpen && (
                <div className="mt-3">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No comments yet</div>
                    ) : (
                      comments.map((c: any) => (
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
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-md border border-border px-3 py-2"
                    />
                    <button
                      onClick={submitComment}
                      className="bg-primary text-primary-foreground px-3 rounded-md"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Trending Posts</h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.map((trendingPost: any) => {
                    const trendingInitials = trendingPost.authorName
                      ? trendingPost.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      : 'U';
                    return (
                      <div
                        key={trendingPost.id}
                        onClick={() => navigate(`/post/${trendingPost.id}`)}
                        className="cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {trendingPost.authorAvatarUrl ? (
                            <img
                              src={trendingPost.authorAvatarUrl}
                              alt={trendingPost.authorName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {trendingInitials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{trendingPost.authorName}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {trendingPost.content}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {trendingPost.likes || 0}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {trendingPost.commentsCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                                parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"><div class="text-6xl opacity-20">📅</div></div>';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg border border-border border-b-0 overflow-hidden flex items-center justify-center">
                          <div className="text-4xl opacity-20">📅</div>
                        </div>
                      )}
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
          </div>
        </div>
      </div>

      {/* Repost modal */}
      {repostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRepostModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">Repost</h3>
                <button onClick={() => setRepostModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Choose how you want to share this post with your network</p>
              <button onClick={() => handleRepost(false)} className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
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
                <textarea value={repostComment} onChange={(e) => setRepostComment(e.target.value)} placeholder="What do you think about this?" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                <button onClick={() => handleRepost(true)} disabled={!repostComment.trim()} className="w-full mt-3 px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Repost with comment
                </button>
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary/30 border-t border-border">
              <button onClick={() => setRepostModalOpen(false)} className="w-full px-4 py-2 rounded-lg font-medium border-2 border-border text-foreground hover:bg-secondary transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send post modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSendModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Send post</h3>
              <button onClick={() => setSendModalOpen(false)} className="text-muted-foreground">Close</button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">Select connections to send this post to:</p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {connectionsList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No connections available</div>
              ) : (
                connectionsList.map((c: any) => (
                  <label key={c.user.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedRecipients[c.user.id]}
                      onChange={() => toggleRecipient(c.user.id)}
                    />
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {(c.user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{c.user.name}</div>
                      <div className="text-xs text-muted-foreground">{c.user.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setSendModalOpen(false)} className="px-3 py-2 rounded bg-secondary">Cancel</button>
              <button
                onClick={handleSendToRecipients}
                disabled={sending || Object.values(selectedRecipients).every(v => !v)}
                className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostView;

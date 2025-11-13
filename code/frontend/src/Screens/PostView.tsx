import React, { useEffect, useState } from 'react';
import Navigation from '../components/header';
import { Card } from '../components/card';
import ProfileCard from '../components/profileCard';
import Loading from '../components/loading';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI, PostResponseDto } from '../services/postsService';
import { connectionAPI } from '../services/connectionService';
import { messagesAPI } from '../services/messagesService';
import { ThumbsUp, MessageCircle, SendIcon } from 'lucide-react';


// Página provisória, mudar depois

const PostView: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const res = await postsAPI.getPostById(postId);
        if (res.success && res.data.post) {
          setPost(res.data.post);
        }
      } catch (e) {
        console.error('Error loading post', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    const userId = localStorage.getItem('userId') || '';
    if (!userId) return;

    try {
      if (!(post as any).liked) {
        const res = await postsAPI.likePost(post.id, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? ((post as any).likes || 0 + 1);
          setPost({ ...post, ...(res.data || {}), likes: total, liked: true } as any);
        }
      } else {
        const res = await postsAPI.unlikePost(post.id, userId);
        if (res.success) {
          const total = (res.data as any)?.totalLikes ?? Math.max(((post as any).likes || 1) - 1, 0);
          setPost({ ...post, ...(res.data || {}), likes: total, liked: false } as any);
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
        setComments((res.data as any).comments);
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
        setComments([...comments, (res.data as any).comment]);
        setCommentInput('');
        setPost({ ...post, ...(post as any), commentsCount: ((post as any).commentsCount || 0) + 1 } as any);
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
              <div className="flex gap-3 mb-1">
                <div
                  onClick={() => navigate(`/profile/${post.userId}`)}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity"
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

              <p className="text-sm text-foreground whitespace-pre-line">
                {post.content}
              </p>

              {/* Interactions: likes and comments */}
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-primary fill-primary" />
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
                  <ThumbsUp className="w-4 h-4" /> {postLiked ? 'Liked' : 'Like'}
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
                        <div key={c.id || Math.random()} className="p-2 bg-background border border-border rounded">
                          <div className="text-sm font-medium">{c.authorName || 'User'}</div>
                          <div className="text-sm text-foreground">{c.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(c.createdAt || c.created_at || Date.now()).toLocaleString()}
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
        </div>
      </div>

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

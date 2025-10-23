import React, { useState, useEffect } from 'react';
import Navigation from '../components/header';
import { Search, MoreHorizontal, Send } from 'lucide-react';
import { Input } from '../components/input';
import { messagesAPI } from '../services/messagesService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getUserConversations(currentUserId);
      if (response.success) {
        setConversations(response.data.users);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const response = await messagesAPI.getMessagesBetweenUsers(currentUserId, otherUserId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedChat) {
      try {
        await messagesAPI.sendMessage(currentUserId, selectedChat, messageText);
        setMessageText('');
        loadMessages(selectedChat);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1128px] mx-auto px-4 py-6">
        <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-[320px] border-r border-border flex flex-col">
              {/* Search Header */}
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages"
                    className="pl-9 bg-secondary border-0"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedChat(conversation.id)}
                      className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border ${selectedChat === conversation.id ? 'bg-secondary/50' : ''
                        }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-sm text-primary-foreground font-semibold">
                            {getInitials(conversation.name)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {conversation.name}
                          </h3>
                        </div>
                        <p className="text-sm truncate text-muted-foreground">
                          {conversation.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-sm text-primary-foreground font-semibold">
                            {getInitials(selectedConversation.name)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {selectedConversation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">{selectedConversation.email}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${message.sender_id === currentUserId ? 'order-2' : ''}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${message.sender_id === currentUserId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground'
                                }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-2">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-end gap-2">
                      <Input
                        placeholder="Write a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-secondary border-0 resize-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                        disabled={!messageText.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/header';
import { Search, MoreHorizontal, Send } from 'lucide-react';
import { Input } from '../components/input';
import { messagesAPI } from '../services/messagesService';
import { socketService } from '../services/socketService';
import { useLocation } from 'react-router-dom';
import Loading from '../components/loading';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = localStorage.getItem('userId') || '';
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdFromQuery = params.get('userId');
    if (userIdFromQuery) {
      setSelectedChat(userIdFromQuery);
    }
  }, [location.search]);

  // Conectar ao WebSocket quando o componente é montado
  useEffect(() => {
    if (currentUserId) {
      socketService.connect(currentUserId);

      // Escutar novas mensagens recebidas
      socketService.onNewMessage((data) => {
        console.log('New message received:', data);
        setMessages((prev) => [...prev, data.message]);
      });

      // Escutar confirmação de mensagem enviada
      socketService.onMessageSent((data) => {
        console.log('Message sent confirmed:', data);
        if (data.success) {
          setMessages((prev) => [...prev, data.message]);
        }
      });
    }

    // Cleanup ao desmontar
    return () => {
      socketService.removeListener('new-message');
      socketService.removeListener('message-sent');
      socketService.removeListener('user-typing');
      socketService.removeListener('user-stop-typing');
      socketService.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    const initializeMessages = async () => {
      setLoading(true);
      try {
        // 1. Carregar conversas
        const conversationsResponse = await messagesAPI.getUserConversations(currentUserId);
        if (conversationsResponse.success && conversationsResponse.data.users.length > 0) {
          setConversations(conversationsResponse.data.users);

          // 2. Carregar todas as mensagens de todas as conversas
          await Promise.all(
            conversationsResponse.data.users.map(async (conv) => {
              const messagesResponse = await messagesAPI.getMessagesBetweenUsers(currentUserId, conv.id);
              if (messagesResponse.success) {
                setMessages((prev) => {
                  // Evita duplicatas
                  const newMsgs = messagesResponse.data.messages.filter(m => !prev.some(pm => pm.id === m.id));
                  return [...prev, ...newMsgs];
                });
              }
            })
          );
        } else if (conversationsResponse.success) {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error initializing messages:', error);
      } finally {
        // Só desliga o loading após tudo estar carregado
        setLoading(false);
      }
    };

    initializeMessages();
  }, []);

  useEffect(() => {
    if (selectedChat && !loading) {
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
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const response = await messagesAPI.getMessagesBetweenUsers(currentUserId, otherUserId);
      if (response.success) {
        setMessages((prev) => {
          // Remove mensagens antigas desta conversa
          const filtered = prev.filter(
            (m) =>
              !(m.sender_id === otherUserId && m.receiver_id === currentUserId) &&
              !(m.sender_id === currentUserId && m.receiver_id === otherUserId)
          );
          // Adiciona as mensagens atualizadas
          return [...filtered, ...response.data.messages];
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const getLastMessage = (userId: string) => {
    const relevantMessages = messages.filter(
      (msg) =>
        (msg.sender_id === userId && msg.receiver_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.receiver_id === userId)
    );
    if (relevantMessages.length === 0) return '';
    const sorted = [...relevantMessages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted[0].content;
  };

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  // Filtrar conversas com base na pesquisa
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const currentMessages = selectedChat
    ? messages.filter(
      (msg) =>
        (msg.sender_id === selectedChat && msg.receiver_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.receiver_id === selectedChat)
    )
    : [];

  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Rolar para o final quando as mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedChat) {
      try {
        // Envia a mensagem via WebSocket em vez de HTTP
        socketService.sendMessage(currentUserId, selectedChat, messageText);
        setMessageText('');
        
        // Parar de digitar
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Fallback para HTTP se o WebSocket falhar
        try {
          await messagesAPI.sendMessage(currentUserId, selectedChat, messageText);
          setMessageText('');
          loadMessages(selectedChat);
        } catch (httpError) {
          console.error('Error sending message via HTTP:', httpError);
        }
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

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return <Loading />;
  }

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
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
                          {getLastMessage(conversation.id) || 'No messages yet'}
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
                    {currentMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {currentMessages.map((message) => (
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
                        ))}
                        {/* Elemento invisível para scroll automático */}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    {isTyping && (
                      <div className="mb-2 text-sm text-muted-foreground italic">
                        {selectedConversation?.name} está digitando...
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <Input
                        placeholder="Write a message..."
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
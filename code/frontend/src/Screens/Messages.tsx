import React, { useState } from 'react';
import Navigation from '../components/header';
import { Search, MoreHorizontal, Send } from 'lucide-react';
import { Input } from '../components/input';

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageText, setMessageText] = useState('');

  // Sample conversations data
  const conversations = [
    {
      id: 1,
      user: 'Sarah Johnson',
      avatar: 'SJ',
      lastMessage: 'Thanks for connecting! Would love to discuss...',
      time: '2h ago',
      unread: true,
      online: true,
    },
    {
      id: 2,
      user: 'Michael Chen',
      avatar: 'MC',
      lastMessage: 'That sounds like a great opportunity',
      time: '5h ago',
      unread: true,
      online: false,
    },
    {
      id: 3,
      user: 'Emily Rodriguez',
      avatar: 'ER',
      lastMessage: 'I saw your post about React. Very insightful!',
      time: '1d ago',
      unread: false,
      online: true,
    },
    {
      id: 4,
      user: 'David Kim',
      avatar: 'DK',
      lastMessage: 'Let me know when you\'re available',
      time: '2d ago',
      unread: false,
      online: false,
    },
    {
      id: 5,
      user: 'Jessica Williams',
      avatar: 'JW',
      lastMessage: 'Perfect! See you then',
      time: '3d ago',
      unread: false,
      online: false,
    },
  ];

  // Sample messages for selected chat
  const messages = [
    { id: 1, sender: 'them', text: 'Hi! Thanks for accepting my connection request', time: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Of course! Great to connect with you', time: '10:32 AM' },
    { id: 3, sender: 'them', text: 'Thanks for connecting! Would love to discuss potential collaboration opportunities', time: '10:35 AM' },
    { id: 4, sender: 'me', text: 'That sounds interesting! What did you have in mind?', time: '10:38 AM' },
    { id: 5, sender: 'them', text: 'I noticed your experience in React development', time: '10:40 AM' },
  ];

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle sending message
      console.log('Sending:', messageText);
      setMessageText('');
    }
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
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedChat(conversation.id)}
                    className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border ${
                      selectedChat === conversation.id ? 'bg-secondary/50' : ''
                    }`}
                  >
                    {/* Avatar with online status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm text-primary-foreground font-semibold">
                          {conversation.avatar}
                        </span>
                      </div>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-semibold text-foreground truncate ${
                          conversation.unread ? 'font-bold' : ''
                        }`}>
                          {conversation.user}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {conversation.time}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        conversation.unread ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {conversation.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
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
                            {selectedConversation.avatar}
                          </span>
                        </div>
                        {selectedConversation.online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {selectedConversation.user}
                        </h3>
                        {selectedConversation.online && (
                          <p className="text-xs text-muted-foreground">Active now</p>
                        )}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.sender === 'me' ? 'order-2' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender === 'me'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
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
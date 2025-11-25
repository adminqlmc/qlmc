"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, Space, Avatar, Typography, Spin, Empty, Badge, App } from 'antd';
import { SendOutlined, CloseOutlined, LikeOutlined, DislikeOutlined, LikeFilled, DislikeFilled } from '@ant-design/icons';
import Image from 'next/image';
import styles from './ChatWidget.module.css';

const { Text } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  feedbackGiven?: 'like' | 'dislike';
}

export default function ChatWidget() {
  const { message: messageApi } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show welcome message when first opened
  useEffect(() => {
    if (isOpen && !hasWelcomed && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: '👋 Xin chào! Tôi là AI trợ lý của hệ thống quản lý máy chiếu.\n\nTôi có thể giúp bạn:\n• Hướng dẫn sử dụng hệ thống\n• Trả lời câu hỏi về máy chiếu\n• Giải đáp thắc mắc về booking\n• Hỗ trợ kỹ thuật\n\nHãy hỏi tôi bất kỳ điều gì! 💬',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setHasWelcomed(true);
    }
  }, [isOpen, hasWelcomed, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          sources: data.sources || [],
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Increment unread count if modal is closed
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'like' | 'dislike') => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const msg = messages[messageIndex];
    if (!msg || msg.role !== 'assistant') return;

    // Prevent duplicate feedback
    if (msg.feedbackGiven) {
      messageApi.info('Bạn đã đánh giá câu trả lời này rồi!');
      return;
    }

    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    // Optimistic update
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = { ...msg, feedbackGiven: feedback };
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chatbot-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          answer: msg.content,
          feedback,
          sources: msg.sources || [],
        }),
      });

      if (response.ok) {
        messageApi.success(feedback === 'like' ? '👍 Cảm ơn phản hồi của bạn!' : '👎 Cảm ơn, chúng tôi sẽ cải thiện!');
      } else {
        // Revert on error
        setMessages(messages);
        messageApi.error('Không thể gửi đánh giá. Vui lòng thử lại!');
      }
    } catch (error) {
      // Revert on error
      setMessages(messages);
      messageApi.error('Không thể gửi đánh giá. Vui lòng thử lại!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Badge count={unreadCount} offset={[-5, 5]}>
        <div 
          className={styles.floatingButton} 
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
        >
          <Image
            src="/ai1.png"
            alt="AI Assistant"
            width={60}
            height={60}
            className={styles.aiIcon}
          />
        </div>
      </Badge>

      {/* Chat Modal */}
      <Modal
        title={
          <Space>
            <Avatar src="/ai1.png" size={32} />
            <Text strong>AI Trợ Lý</Text>
          </Space>
        }
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        width={400}
        className={styles.chatModal}
        closeIcon={<CloseOutlined />}
      >
        <div className={styles.chatContainer}>
          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <Empty
                image="/ai1.png"
                styles={{ image: { height: 80 } }}
                description={
                  <Space direction="vertical">
                    <Text>Xin chào! Tôi là AI trợ lý 👋</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Hãy hỏi tôi bất kỳ điều gì về hệ thống
                    </Text>
                  </Space>
                }
              />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? styles.userMessage
                      : styles.assistantMessage
                  }
                >
                  {message.role === 'assistant' && (
                    <Avatar src="/ai1.png" size={28} style={{ marginRight: 8 }} />
                  )}
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{message.content}</div>
                    {message.role === 'assistant' && (
                      <Space size="small" className={styles.feedbackButtons}>
                        <Button
                          type={message.feedbackGiven === 'like' ? 'primary' : 'text'}
                          size="small"
                          icon={message.feedbackGiven === 'like' ? <LikeFilled /> : <LikeOutlined />}
                          onClick={() => handleFeedback(message.id, 'like')}
                          disabled={!!message.feedbackGiven}
                        />
                        <Button
                          type={message.feedbackGiven === 'dislike' ? 'primary' : 'text'}
                          size="small"
                          danger={message.feedbackGiven === 'dislike'}
                          icon={message.feedbackGiven === 'dislike' ? <DislikeFilled /> : <DislikeOutlined />}
                          onClick={() => handleFeedback(message.id, 'dislike')}
                          disabled={!!message.feedbackGiven}
                        />
                      </Space>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className={styles.assistantMessage}>
                <Avatar src="/ai1.png" size={28} style={{ marginRight: 8 }} />
                <div className={styles.messageContent}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    Đang suy nghĩ...
                  </Text>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputContainer}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={loading}
              disabled={!inputValue.trim()}
            >
              Gửi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

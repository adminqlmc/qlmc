"use client";

import React, { useState } from 'react';
import { Input, Button, List, Typography, Card, Space, Tag, App } from 'antd';
import { LikeOutlined, DislikeOutlined, LikeFilled, DislikeFilled } from '@ant-design/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  feedbackStatus?: 'like' | 'dislike' | null;
}

export default function AiAssistantPage() {
  const { message: antMessage } = App.useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input, feedbackStatus: null };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      const answer = data.answer || 'Xin lỗi, tạm thời chưa có câu trả lời.';
      setMessages((m) => [...m, { 
        role: 'assistant', 
        content: answer, 
        sources: data.sources,
        feedbackStatus: null 
      }]);
    } catch (e) {
      setMessages((m) => [...m, { 
        role: 'assistant', 
        content: 'Có lỗi xảy ra phía máy chủ.',
        feedbackStatus: null 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'like' | 'dislike') => {
    const msg = messages[messageIndex];
    if (msg.role !== 'assistant') return;

    // Tìm câu hỏi tương ứng (message trước đó)
    const question = messageIndex > 0 ? messages[messageIndex - 1].content : '';

    try {
      const res = await fetch('/api/chatbot-feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: msg.content,
          feedback: feedbackType,
          sources: msg.sources || [],
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        // Cập nhật trạng thái feedback trong message
        setMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex] = { ...updated[messageIndex], feedbackStatus: feedbackType };
          return updated;
        });

        antMessage.success(data.message);
      } else {
        antMessage.error('Không thể lưu phản hồi');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      antMessage.error('Có lỗi xảy ra khi gửi phản hồi');
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Trợ lý AI">
        <List
          dataSource={messages}
          renderItem={(msg, idx) => (
            <List.Item key={idx}>
              <div style={{ width: '100%' }}>
                <Typography.Text strong>
                  {msg.role === 'user' ? 'Bạn' : 'Trợ lý AI'}
                </Typography.Text>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{msg.content}</div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <Space wrap style={{ marginTop: 8 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Nguồn tham khảo:
                    </Typography.Text>
                    {msg.sources.map((s: any, i: number) => (
                      <Tag key={i} color="blue">{s.title || s.docId}</Tag>
                    ))}
                  </Space>
                )}

                {/* Hiển thị nút Like/Dislike chỉ cho câu trả lời của AI */}
                {msg.role === 'assistant' && (
                  <Space style={{ marginTop: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Câu trả lời có hữu ích không?
                    </Typography.Text>
                    <Button
                      size="small"
                      type={msg.feedbackStatus === 'like' ? 'primary' : 'default'}
                      icon={msg.feedbackStatus === 'like' ? <LikeFilled /> : <LikeOutlined />}
                      onClick={() => handleFeedback(idx, 'like')}
                      disabled={msg.feedbackStatus !== null}
                    >
                      Hữu ích
                    </Button>
                    <Button
                      size="small"
                      danger={msg.feedbackStatus === 'dislike'}
                      type={msg.feedbackStatus === 'dislike' ? 'primary' : 'default'}
                      icon={msg.feedbackStatus === 'dislike' ? <DislikeFilled /> : <DislikeOutlined />}
                      onClick={() => handleFeedback(idx, 'dislike')}
                      disabled={msg.feedbackStatus !== null}
                    >
                      Chưa chính xác
                    </Button>
                  </Space>
                )}
              </div>
            </List.Item>
          )}
        />
        <Space style={{ width: '100%', marginTop: 16 }}>
          <Input
            placeholder="Nhập câu hỏi của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={send}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={send} loading={loading}>
            Gửi
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

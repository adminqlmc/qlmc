"use client";

import { useEffect, useState } from 'react';
import { Card, Table, Statistic, Row, Col, Tag, Space, Typography, Tabs, App } from 'antd';
import { LikeOutlined, DislikeOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

interface FeedbackStats {
  feedback: string;
  _count: {
    id: number;
  };
}

interface FeedbackItem {
  id: string;
  question: string;
  answer: string;
  feedback: string;
  sources: string | null;
  createdAt: string;
  user: {
    userID: string;
    fullName: string;
    role: string;
  };
}

export default function AdminAIFeedbackPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FeedbackStats[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [topDisliked, setTopDisliked] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot-feedback');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || []);
        setRecentFeedback(data.recentFeedback || []);
        setTopDisliked(data.topDisliked || []);
      } else {
        message.error('Không thể tải dữ liệu feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const likeCount = stats.find(s => s.feedback === 'like')?._count.id || 0;
  const dislikeCount = stats.find(s => s.feedback === 'dislike')?._count.id || 0;
  const total = likeCount + dislikeCount;
  const satisfactionRate = total > 0 ? ((likeCount / total) * 100).toFixed(1) : '0';

  const columns: ColumnsType<FeedbackItem> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user.fullName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.user.userID}</Text>
          <Tag color={
            record.user.role === 'admin' ? 'red' : 
            record.user.role === 'technician' ? 'blue' : 'green'
          } style={{ fontSize: 11 }}>
            {record.user.role.toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ marginBottom: 0 }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: 'Câu trả lời',
      dataIndex: 'answer',
      key: 'answer',
      ellipsis: true,
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ marginBottom: 0 }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'feedback',
      key: 'feedback',
      width: 120,
      filters: [
        { text: 'Like', value: 'like' },
        { text: 'Dislike', value: 'dislike' },
      ],
      onFilter: (value, record) => record.feedback === value,
      render: (feedback: string) => (
        <Tag 
          icon={feedback === 'like' ? <LikeOutlined /> : <DislikeOutlined />}
          color={feedback === 'like' ? 'success' : 'error'}
        >
          {feedback === 'like' ? 'Hữu ích' : 'Chưa chính xác'}
        </Tag>
      ),
    },
  ];

  const dislikedColumns: ColumnsType<FeedbackItem> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'question',
      key: 'question',
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ marginBottom: 0 }}>
          <Text strong>{text}</Text>
        </Paragraph>
      ),
    },
    {
      title: 'Câu trả lời (cần cải thiện)',
      dataIndex: 'answer',
      key: 'answer',
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ marginBottom: 0 }}>
          <Text type="danger">{text}</Text>
        </Paragraph>
      ),
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.user.fullName}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.user.userID}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>
        <MessageOutlined /> Thống kê Feedback AI
      </Title>
      <Text type="secondary">
        Phân tích phản hồi của người dùng về chất lượng câu trả lời của Trợ lý AI
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng phản hồi"
              value={total}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đánh giá tích cực"
              value={likeCount}
              prefix={<LikeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đánh giá tiêu cực"
              value={dislikeCount}
              prefix={<DislikeOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hài lòng"
              value={satisfactionRate}
              suffix="%"
              valueStyle={{ color: parseFloat(satisfactionRate) >= 70 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Card>
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <MessageOutlined /> Tất cả phản hồi ({total})
                </span>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={recentFeedback}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} phản hồi`,
                  }}
                  scroll={{ x: 1200 }}
                />
              ),
            },
            {
              key: 'disliked',
              label: (
                <span>
                  <DislikeOutlined /> Cần cải thiện ({dislikeCount})
                </span>
              ),
              children: (
                <>
                  <Paragraph type="warning" style={{ marginBottom: 16 }}>
                    <strong>Lưu ý:</strong> Đây là danh sách các câu trả lời bị đánh giá "Chưa chính xác". 
                    Hãy cập nhật tài liệu trong <Text code>knowledge.vi.json</Text> hoặc huấn luyện lại AI để cải thiện.
                  </Paragraph>
                  <Table
                    columns={dislikedColumns}
                    dataSource={topDisliked}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showTotal: (total) => `${total} câu trả lời cần cải thiện`,
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

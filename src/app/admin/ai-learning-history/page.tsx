"use client";

import React, { useState, useEffect } from 'react';
import { Card, Space, Table, Tag, Statistic, Row, Col, Spin, Typography, Timeline, Button } from 'antd';
import { HistoryOutlined, ReloadOutlined, LineChartOutlined, CheckCircleOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface LearningLog {
  id: string;
  totalFeedback: number;
  likeCount: number;
  dislikeCount: number;
  documentsUpdated: number;
  topQuestions: Array<{
    question: string;
    count: number;
    avgScore: number;
  }>;
  improvements: string[];
  learningDate: string;
  createdAt: string;
}

interface LearningHistoryStats {
  totalLogs: number;
  totalFeedbackProcessed: number;
  totalLikes: number;
  totalDislikes: number;
  avgFeedbackPerDay: number;
  avgDocumentsUpdatedPerDay: number;
}

export default function AILearningHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [stats, setStats] = useState<LearningHistoryStats | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ai-learning-history?limit=30');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error('Failed to fetch learning history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>
            <HistoryOutlined /> Lịch Sử Học Tập AI
          </Title>
          <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>
            Làm mới
          </Button>
        </Space>
        
        <Text type="secondary">
          Theo dõi quá trình học tập tự động của AI hàng ngày (00:00). 
          Mỗi ngày AI sẽ phân tích feedback tích lũy và cập nhật điểm số documents.
        </Text>
      </Card>

      {loading ? (
        <Card>
          <Spin size="large" />
        </Card>
      ) : (
        <>
          {stats && (
            <Card title={<><LineChartOutlined /> Thống Kê Tổng Quan</>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Tổng số lần học"
                    value={stats.totalLogs}
                    suffix="lần"
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Tổng feedback đã xử lý"
                    value={stats.totalFeedbackProcessed}
                    suffix="feedback"
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Trung bình feedback/ngày"
                    value={stats.avgFeedbackPerDay}
                    precision={1}
                    suffix="feedback"
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Tổng Like"
                    value={stats.totalLikes}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<LikeOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Tổng Dislike"
                    value={stats.totalDislikes}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<DislikeOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="Trung bình docs cập nhật/ngày"
                    value={stats.avgDocumentsUpdatedPerDay}
                    precision={1}
                    suffix="docs"
                  />
                </Col>
              </Row>
            </Card>
          )}

          <Card title="📅 Nhật Ký Học Tập">
            <Timeline
              items={logs.map((log) => ({
                key: log.id,
                color: log.totalFeedback > 0 ? 'green' : 'gray',
                dot: log.totalFeedback > 0 ? <CheckCircleOutlined /> : undefined,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Text strong>{formatDate(log.learningDate)}</Text>
                        <Tag color="blue">{log.totalFeedback} feedback</Tag>
                        <Tag color="green">{log.likeCount} like</Tag>
                        <Tag color="red">{log.dislikeCount} dislike</Tag>
                        <Tag color="purple">{log.documentsUpdated} docs updated</Tag>
                      </Space>

                      {log.topQuestions.length > 0 && (
                        <>
                          <Text type="secondary">🔥 Câu hỏi phổ biến:</Text>
                          <Table
                            dataSource={log.topQuestions.slice(0, 5)}
                            pagination={false}
                            size="small"
                            rowKey="question"
                            columns={[
                              { 
                                title: 'Câu hỏi', 
                                dataIndex: 'question', 
                                key: 'question',
                                width: '60%',
                              },
                              { 
                                title: 'Số lần', 
                                dataIndex: 'count', 
                                key: 'count',
                                width: '20%',
                              },
                              { 
                                title: 'Điểm TB', 
                                dataIndex: 'avgScore', 
                                key: 'avgScore',
                                width: '20%',
                                render: (score: string | number) => {
                                  const numScore = typeof score === 'string' ? parseFloat(score) : score;
                                  return (
                                    <Tag color={numScore > 0 ? 'green' : 'red'}>
                                      {numScore > 0 ? '+' : ''}{numScore.toFixed(2)}
                                    </Tag>
                                  );
                                },
                              },
                            ]}
                          />
                        </>
                      )}

                      {log.improvements.length > 0 && (
                        <>
                          <Text type="secondary">✅ Cải thiện:</Text>
                          <ul style={{ marginBottom: 0 }}>
                            {log.improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </Space>
                  </Card>
                ),
              }))}
            />
          </Card>
        </>
      )}
    </Space>
  );
}

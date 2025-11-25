"use client";

import React, { useState, useEffect } from 'react';
import { Card, Space, Button, Upload, UploadProps, Typography, Alert, Statistic, Row, Col, Divider, App } from 'antd';
import { UploadOutlined, DatabaseOutlined, SaveOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function TechnicianTrainPage() {
  const { message } = App.useApp();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/python/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // Ignore if AI service not running
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    try {
      const text = await file.text();
      setFileContent(text);
      setFileName(file.name);
      message.success(`Đã tải: ${file.name}`);
    } catch (e: any) {
      message.error(`Không đọc được file: ${e?.message || e}`);
    }
    return false;
  };

  const trainFromUpload = async () => {
    if (!fileContent) return message.warning('Hãy chọn file JSON trước.');
    try {
      setLoading(true);
      const res = await fetch('/api/chatbot-train-from-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonText: fileContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Huấn luyện thất bại');
      message.success(`Huấn luyện xong: ${data.docs} tài liệu, ${data.totalChunks} đoạn.`);
      fetchStats();
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const trainFromDefault = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chatbot-train', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: 'knowledge.vi.json' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Huấn luyện thất bại');
      message.success(`Huấn luyện xong từ knowledge.vi.json: ${data.docs} tài liệu, ${data.totalChunks} đoạn.`);
      fetchStats();
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const saveIndex = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/python/save', { method: 'POST' });
      if (!res.ok) throw new Error('Lưu thất bại');
      message.success('Đã lưu index thành công!');
      fetchStats();
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadIndex = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/python/load', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error('Tải thất bại');
      message.success(`Đã tải index: ${data.index_size} đoạn.`);
      fetchStats();
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Quản lý Huấn luyện Chatbot AI" extra={<DatabaseOutlined />}>
        <Alert 
          type="info" 
          showIcon 
          message="Quản trị viên có quyền huấn luyện chatbot từ dữ liệu tri thức để hỗ trợ giáo viên tốt hơn." 
          style={{ marginBottom: 16 }} 
        />

        {/* Stats */}
        {stats && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Số đoạn đã học" 
                  value={stats.index_size} 
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Chiều vector" 
                  value={stats.emb_dim} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Trạng thái" 
                  value={stats.files?.index_exists ? 'Đã lưu' : 'Chưa lưu'} 
                  valueStyle={{ color: stats.files?.index_exists ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>
            <Divider />
          </>
        )}

        {/* Train from default file */}
        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          <Text strong>1. Huấn luyện từ file tri thức mặc định</Text>
          <Text type="secondary">Sử dụng file <code>data/knowledge.vi.json</code></Text>
          <Button 
            type="primary" 
            icon={<RocketOutlined />}
            onClick={trainFromDefault} 
            loading={loading}
            size="large"
          >
            Huấn luyện từ knowledge.vi.json
          </Button>
        </Space>

        <Divider>HOẶC</Divider>

        {/* Train from upload */}
        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          <Text strong>2. Huấn luyện từ file tải lên</Text>
          <Text type="secondary">Tải lên file JSON tùy chỉnh</Text>
          <Upload beforeUpload={beforeUpload} accept="application/json" maxCount={1}>
            <Button icon={<UploadOutlined />}>Chọn file JSON</Button>
          </Upload>
          {fileName && <Text type="success">Đã chọn: {fileName}</Text>}
          <Button 
            type="primary" 
            onClick={trainFromUpload} 
            loading={loading} 
            disabled={!fileContent}
          >
            Bắt đầu huấn luyện từ file đã tải
          </Button>
        </Space>

        <Divider>Quản lý Index</Divider>

        {/* Index management */}
        <Space>
          <Button 
            icon={<SaveOutlined />}
            onClick={saveIndex} 
            loading={loading}
          >
            Lưu Index
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadIndex} 
            loading={loading}
          >
            Tải lại Index
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

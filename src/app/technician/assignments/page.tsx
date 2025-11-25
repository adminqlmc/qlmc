'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Spin, App, Tabs, Space } from 'antd';
import { 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import styles from './assignments.module.css';

const { TextArea } = Input;
const { Option } = Select;

interface SupportRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  createdAt: string;
  respondedAt: string | null;
  response: string | null;
  user: {
    userID: string;
    fullName: string;
    email: string;
  };
  projector: {
    id: string;
    name: string;
    room: string;
    building: string;
    status: string;
  } | null;
}

export default function AssignmentsPage() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technician/assignments');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      } else {
        message.error('Không thể tải danh sách yêu cầu');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    if (!selectedRequest) return;

    try {
      const res = await fetch(`/api/technician/assignments/${selectedRequest.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: values.status,
          response: values.response,
          projectorStatus: values.projectorStatus,
        }),
      });

      if (res.ok) {
        message.success('Cập nhật trạng thái thành công');
        setUpdateModalVisible(false);
        form.resetFields();
        fetchRequests();
      } else {
        const data = await res.json();
        message.error(data.error || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'processing';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã hoàn thành';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  };

  const columns: ColumnsType<SupportRequest> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div>
          <div>{user.fullName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{user.userID}</div>
        </div>
      ),
    },
    {
      title: 'Thiết bị',
      dataIndex: 'projector',
      key: 'projector',
      render: (projector: any) => projector ? (
        <div>
          <div>{projector.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {projector.room} - {projector.building}
          </div>
        </div>
      ) : <span style={{ color: '#999' }}>Không có</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={category === 'repair' ? 'red' : 'blue'}>
          {category === 'repair' ? 'Sửa chữa' : 'Bảo trì'}
        </Tag>
      ),
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Lịch bảo trì',
      key: 'schedule',
      render: (_: any, record: SupportRequest) => (
        <div>
          {record.scheduledStartTime && record.scheduledEndTime ? (
            <>
              <div>{dayjs(record.scheduledStartTime).format('DD/MM/YYYY')}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {dayjs(record.scheduledStartTime).format('HH:mm')} - {dayjs(record.scheduledEndTime).format('HH:mm')}
              </div>
            </>
          ) : (
            <span style={{ color: '#999' }}>Chưa lên lịch</span>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: SupportRequest) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              setSelectedRequest(record);
              setDetailModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          {record.status !== 'resolved' && record.status !== 'closed' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => {
                setSelectedRequest(record);
                form.setFieldsValue({
                  status: record.status,
                  response: record.response || '',
                  projectorStatus: record.projector?.status || 'available',
                });
                setUpdateModalVisible(true);
              }}
            >
              Cập nhật
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  const tabItems = [
    {
      key: 'all',
      label: `Tất cả (${requests.length})`,
    },
    {
      key: 'pending',
      label: `Chờ xử lý (${requests.filter(r => r.status === 'pending').length})`,
    },
    {
      key: 'in_progress',
      label: `Đang xử lý (${requests.filter(r => r.status === 'in_progress').length})`,
    },
    {
      key: 'resolved',
      label: `Đã hoàn thành (${requests.filter(r => r.status === 'resolved').length})`,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Yêu cầu được phân công</h1>
        <p>Quản lý các yêu cầu hỗ trợ kỹ thuật được giao cho bạn</p>
      </div>

      <Card className={styles.card}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredRequests}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedRequest && (
          <div className={styles.detailContent}>
            <div className={styles.detailRow}>
              <strong>Tiêu đề:</strong>
              <span>{selectedRequest.title}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Mô tả:</strong>
              <p>{selectedRequest.description}</p>
            </div>
            <div className={styles.detailRow}>
              <strong>Người yêu cầu:</strong>
              <span>{selectedRequest.user.fullName} ({selectedRequest.user.userID})</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Email:</strong>
              <span>{selectedRequest.user.email}</span>
            </div>
            {selectedRequest.projector && (
              <>
                <div className={styles.detailRow}>
                  <strong>Thiết bị:</strong>
                  <span>{selectedRequest.projector.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Vị trí:</strong>
                  <span>{selectedRequest.projector.room} - {selectedRequest.projector.building}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Trạng thái thiết bị:</strong>
                  <Tag color={
                    selectedRequest.projector.status === 'available' ? 'success' :
                    selectedRequest.projector.status === 'maintenance' ? 'warning' : 'error'
                  }>
                    {selectedRequest.projector.status === 'available' ? 'Sẵn sàng' :
                     selectedRequest.projector.status === 'maintenance' ? 'Bảo trì' : 'Hỏng'}
                  </Tag>
                </div>
              </>
            )}
            <div className={styles.detailRow}>
              <strong>Loại yêu cầu:</strong>
              <Tag color={selectedRequest.category === 'repair' ? 'red' : 'blue'}>
                {selectedRequest.category === 'repair' ? 'Sửa chữa' : 'Bảo trì'}
              </Tag>
            </div>
            <div className={styles.detailRow}>
              <strong>Ưu tiên:</strong>
              <Tag color={getPriorityColor(selectedRequest.priority)}>
                {getPriorityText(selectedRequest.priority)}
              </Tag>
            </div>
            <div className={styles.detailRow}>
              <strong>Trạng thái:</strong>
              <Tag color={getStatusColor(selectedRequest.status)}>
                {getStatusText(selectedRequest.status)}
              </Tag>
            </div>
            {selectedRequest.scheduledStartTime && selectedRequest.scheduledEndTime && (
              <div className={styles.detailRow}>
                <strong>Lịch bảo trì:</strong>
                <span>
                  {dayjs(selectedRequest.scheduledStartTime).format('DD/MM/YYYY HH:mm')} - 
                  {dayjs(selectedRequest.scheduledEndTime).format('HH:mm')}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <strong>Thời gian tạo:</strong>
              <span>{dayjs(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}</span>
            </div>
            {selectedRequest.response && (
              <div className={styles.detailRow}>
                <strong>Ghi chú xử lý:</strong>
                <p>{selectedRequest.response}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Modal */}
      <Modal
        title="Cập nhật trạng thái yêu cầu"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="in_progress">Đang xử lý</Option>
              <Option value="resolved">Đã hoàn thành</Option>
            </Select>
          </Form.Item>

          {selectedRequest?.projector && (
            <Form.Item
              name="projectorStatus"
              label="Trạng thái thiết bị"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái thiết bị' }]}
            >
              <Select>
                <Option value="available">Sẵn sàng</Option>
                <Option value="maintenance">Bảo trì</Option>
                <Option value="broken">Hỏng</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="response"
            label="Ghi chú"
          >
            <TextArea rows={4} placeholder="Nhập ghi chú về quá trình xử lý..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

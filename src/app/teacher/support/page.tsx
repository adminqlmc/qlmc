'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, Select, Tabs, App, Tag, Popconfirm } from 'antd';
import { 
  CustomerServiceOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import styles from './support.module.css';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Projector {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  room: string;
  building: string;
}

interface User {
  id: string;
  userID: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

interface SupportRequest {
  id: string;
  userId: string;
  projectorId: string | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  category: string | null;
  response: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projector: Projector | null;
  user: User;
}

export default function TeacherSupportPage() {
  const { message } = App.useApp();
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('repair');
  const [projectorId, setProjectorId] = useState<string>('');

  useEffect(() => {
    fetchSupportRequests();
    fetchProjectors();
  }, []);

  const fetchSupportRequests = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'all' 
        ? `/api/teacher/support?status=${status}`
        : '/api/teacher/support';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch support requests');
      const data = await response.json();
      setSupportRequests(data.supportRequests);
    } catch (error) {
      console.error('Error fetching support requests:', error);
      message.error('Không thể tải danh sách yêu cầu hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectors = async () => {
    try {
      const response = await fetch('/api/teacher/projectors');
      if (!response.ok) throw new Error('Failed to fetch projectors');
      const data = await response.json();
      setProjectors(data.projectors);
    } catch (error) {
      console.error('Error fetching projectors:', error);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchSupportRequests(key);
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('repair');
    setProjectorId('');
    setCreateModalVisible(true);
  };

  const handleOpenDetailModal = (request: SupportRequest) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const handleCreateRequest = async () => {
    if (!title.trim() || !description.trim() || !projectorId) {
      message.warning('Vui lòng điền đầy đủ tất cả các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/teacher/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          category,
          projectorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create support request');
      }

      message.success('Yêu cầu hỗ trợ đã được gửi thành công!');
      setCreateModalVisible(false);
      fetchSupportRequests(activeTab);
    } catch (error: unknown) {
      console.error('Error creating support request:', error);
      message.error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu hỗ trợ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/support/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete support request');
      }

      message.success('Đã xóa yêu cầu hỗ trợ');
      fetchSupportRequests(activeTab);
    } catch (error: unknown) {
      console.error('Error deleting support request:', error);
      message.error(error instanceof Error ? error.message : 'Không thể xóa yêu cầu hỗ trợ');
    }
  };

  const getPriorityTag = (priority: string) => {
    const config: Record<string, { text: string; className: string }> = {
      low: { text: 'Thấp', className: styles.lowPriority },
      medium: { text: 'Trung bình', className: styles.mediumPriority },
      high: { text: 'Cao', className: styles.highPriority },
      urgent: { text: 'Khẩn cấp', className: styles.urgentPriority },
    };
    const { text, className } = config[priority] || config.medium;
    return <Tag className={`${styles.priorityTag} ${className}`}>{text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      pending: { 
        text: 'Chờ xử lý', 
        className: styles.pendingTag,
        icon: <ClockCircleOutlined />
      },
      in_progress: { 
        text: 'Đang xử lý', 
        className: styles.inProgressTag,
        icon: <ExclamationCircleOutlined />
      },
      resolved: { 
        text: 'Đã giải quyết', 
        className: styles.resolvedTag,
        icon: <CheckCircleOutlined />
      },
      closed: { 
        text: 'Đã đóng', 
        className: styles.closedTag,
        icon: <CheckCircleOutlined />
      },
    };
    const { text, className, icon } = config[status] || config.pending;
    return <Tag className={`${styles.statusTag} ${className}`}>{icon} {text}</Tag>;
  };

  const columns = [
    {
      title: 'Tiêu đề',
      key: 'title',
      render: (_: unknown, record: SupportRequest) => (
        <div>
          <div className={styles.requestTitle}>{record.title}</div>
          <div className={styles.requestCategory}>
            {record.category === 'repair' && '🔧 Sửa chữa'}
            {record.category === 'maintenance' && '🛠️ Bảo trì/Bảo dưỡng'}
          </div>
        </div>
      ),
    },
    {
      title: 'Thiết bị',
      dataIndex: ['projector', 'name'],
      key: 'projector',
      render: (_: unknown, record: SupportRequest) => (
        record.projector ? (
          <div>
            <div>{record.projector.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.projector.building} - {record.projector.room}
            </div>
          </div>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>Không có</span>
        )
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => getPriorityTag(record.priority),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => getStatusTag(record.status),
    },
    {
      title: 'Người xử lý',
      dataIndex: 'respondedBy',
      key: 'respondedBy',
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => {
        if (record.status === 'pending') {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>Chờ xử lý</span>;
        }
        if (record.respondedBy) {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{record.respondedBy}</div>
              {record.respondedAt && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {dayjs(record.respondedAt).format('DD/MM/YYYY HH:mm')}
                </div>
              )}
            </div>
          );
        }
        return <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa có</span>;
      },
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => dayjs(createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => (
        <div className={styles.actionButtons}>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetailModal(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
            <Popconfirm
              title="Xóa yêu cầu hỗ trợ"
              description="Bạn có chắc chắn muốn xóa yêu cầu này?"
              onConfirm={() => handleDeleteRequest(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `Tất cả (${supportRequests.length})` },
    { 
      key: 'pending', 
      label: `Chờ xử lý (${supportRequests.filter(r => r.status === 'pending').length})` 
    },
    { 
      key: 'in_progress', 
      label: `Đang xử lý (${supportRequests.filter(r => r.status === 'in_progress').length})` 
    },
    { 
      key: 'resolved', 
      label: `Đã giải quyết (${supportRequests.filter(r => r.status === 'resolved').length})` 
    },
  ];

  return (
    <div className={styles.supportPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <CustomerServiceOutlined /> Yêu cầu hỗ trợ kỹ thuật
          </h1>
          <p className={styles.pageDescription}>
            Gửi yêu cầu hỗ trợ khi gặp vấn đề với thiết bị hoặc cần trợ giúp kỹ thuật
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
          className={styles.createButton}
        >
          Tạo yêu cầu mới
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={handleTabChange}
        className={styles.filterTabs}
      />

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={supportRequests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          locale={{
            emptyText: (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <div className={styles.emptyTitle}>Chưa có yêu cầu hỗ trợ nào</div>
                <div className={styles.emptyDescription}>
                  Nhấn nút "Tạo yêu cầu mới" để gửi yêu cầu hỗ trợ kỹ thuật
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal tạo yêu cầu */}
      <Modal
        title="Tạo yêu cầu hỗ trợ kỹ thuật"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateRequest}
        confirmLoading={submitting}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        width={700}
      >
        <div className={styles.modalContent}>
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              Tiêu đề <span className={styles.required}>*</span>
            </div>
            <Input
              placeholder="Nhập tiêu đề yêu cầu hỗ trợ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              showCount
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              Mô tả chi tiết <span className={styles.required}>*</span>
            </div>
            <TextArea
              rows={5}
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              showCount
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              Loại yêu cầu <span className={styles.required}>*</span>
            </div>
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: '100%' }}
              options={[
                { label: '🔧 Sửa chữa', value: 'repair' },
                { label: '🛠️ Bảo trì/Bảo dưỡng', value: 'maintenance' },
              ]}
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              Mức độ ưu tiên <span className={styles.required}>*</span>
            </div>
            <Select
              value={priority}
              onChange={setPriority}
              style={{ width: '100%' }}
              options={[
                { label: 'Thấp', value: 'low' },
                { label: 'Trung bình', value: 'medium' },
                { label: 'Cao', value: 'high' },
                { label: 'Khẩn cấp', value: 'urgent' },
              ]}
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>
              Thiết bị <span className={styles.required}>*</span>
            </div>
            <Select
              placeholder="Chọn thiết bị liên quan..."
              value={projectorId || undefined}
              onChange={setProjectorId}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={projectors.map(p => ({
                label: `${p.name} - ${p.building} ${p.room}`,
                value: p.id,
              }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal chi tiết yêu cầu */}
      <Modal
        title="Chi tiết yêu cầu hỗ trợ"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        className={styles.detailModal}
      >
        {selectedRequest && (
          <div className={styles.modalContent}>
            <div className={styles.detailSection}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tiêu đề:</span>
                <span className={styles.detailValue}>{selectedRequest.title}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mô tả:</span>
                <span className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedRequest.description}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Loại yêu cầu:</span>
                <span className={styles.detailValue}>
                  {selectedRequest.category === 'repair' && '🔧 Sửa chữa'}
                  {selectedRequest.category === 'maintenance' && '🛠️ Bảo trì/Bảo dưỡng'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mức độ:</span>
                <span className={styles.detailValue}>
                  {getPriorityTag(selectedRequest.priority)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Trạng thái:</span>
                <span className={styles.detailValue}>
                  {getStatusTag(selectedRequest.status)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Thiết bị:</span>
                <span className={styles.detailValue}>
                  {selectedRequest.projector ? (
                    <>
                      {selectedRequest.projector.name} - {selectedRequest.projector.building} {selectedRequest.projector.room}
                    </>
                  ) : (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>Không có</span>
                  )}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Thời gian tạo:</span>
                <span className={styles.detailValue}>
                  {dayjs(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              {(selectedRequest.status !== 'pending' && selectedRequest.respondedBy) && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Người xử lý:</span>
                  <span className={styles.detailValue}>
                    {selectedRequest.respondedBy}
                    {selectedRequest.respondedAt && (
                      <span style={{ color: '#666', fontSize: '13px', marginLeft: '8px' }}>
                        ({dayjs(selectedRequest.respondedAt).format('DD/MM/YYYY HH:mm')})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {selectedRequest.response ? (
              <div className={styles.responseSection}>
                <div className={styles.responseTitle}>
                  <CheckCircleOutlined /> Phản hồi từ kỹ thuật viên
                </div>
                <div className={styles.responseText}>{selectedRequest.response}</div>
                {selectedRequest.respondedAt && (
                  <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '8px' }}>
                    Phản hồi lúc: {dayjs(selectedRequest.respondedAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noResponse}>
                Chưa có phản hồi từ kỹ thuật viên
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

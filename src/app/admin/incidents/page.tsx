'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Modal, Select, Tabs, App, Tag, Avatar, Card, Row, Col, DatePicker } from 'antd';
import {
  BugOutlined,
  EyeOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import styles from './incidents.module.css';
import dayjs, { Dayjs } from 'dayjs';

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

interface Technician {
  id: string;
  userID: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

export default function AdminIncidentsPage() {
  const { message } = App.useApp();
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [scheduledStartTime, setScheduledStartTime] = useState<Dayjs | null>(null);
  const [scheduledEndTime, setScheduledEndTime] = useState<Dayjs | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchSupportRequests();
    fetchTechnicians();
  }, []);

  const fetchSupportRequests = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'all'
        ? `/api/admin/support?status=${status}`
        : '/api/admin/support';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch support requests');
      const data = await response.json();
      setSupportRequests(data.supportRequests);
    } catch (error) {
      console.error('Error fetching support requests:', error);
      message.error('Không thể tải danh sách báo cáo sự cố');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/admin/technicians');
      if (!response.ok) throw new Error('Failed to fetch technicians');
      const data = await response.json();
      setTechnicians(data.technicians);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchSupportRequests(key);
  };

  const handleOpenDetailModal = (request: SupportRequest) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const handleOpenAssignModal = (request: SupportRequest) => {
    setSelectedRequest(request);
    setSelectedTechnician('');
    setScheduledStartTime(null);
    setScheduledEndTime(null);
    setAssignModalVisible(true);
  };

  const handleAssignTechnician = async () => {
    if (!selectedRequest || !selectedTechnician) {
      message.warning('Vui lòng chọn kỹ thuật viên');
      return;
    }

    if (!scheduledStartTime || !scheduledEndTime) {
      message.warning('Vui lòng chọn thời gian bảo trì');
      return;
    }

    if (scheduledEndTime.isBefore(scheduledStartTime)) {
      message.warning('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch(`/api/admin/support/${selectedRequest.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianUserID: selectedTechnician,
          scheduledStartTime: scheduledStartTime.toISOString(),
          scheduledEndTime: scheduledEndTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign technician');
      }

      message.success('Đã phân công kỹ thuật viên thành công!');
      setAssignModalVisible(false);
      fetchSupportRequests(activeTab);
    } catch (error: unknown) {
      console.error('Error assigning technician:', error);
      message.error(error instanceof Error ? error.message : 'Không thể phân công kỹ thuật viên');
    } finally {
      setAssigning(false);
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

  const stats = {
    pending: supportRequests.filter(r => r.status === 'pending').length,
    inProgress: supportRequests.filter(r => r.status === 'in_progress').length,
    resolved: supportRequests.filter(r => r.status === 'resolved').length,
    urgent: supportRequests.filter(r => r.priority === 'urgent' && r.status !== 'resolved' && r.status !== 'closed').length,
  };

  const columns = [
    {
      title: 'Tiêu đề',
      key: 'title',
      width: 250,
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
      title: 'Người yêu cầu',
      key: 'user',
      width: 200,
      render: (_: unknown, record: SupportRequest) => (
        <div className={styles.userInfo}>
          <Avatar
            size={32}
            src={record.user.avatar}
            icon={<UserOutlined />}
            className={styles.userAvatar}
          />
          <div>
            <div className={styles.userName}>{record.user.fullName}</div>
            <div className={styles.userEmail}>{record.user.userID}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Thiết bị',
      dataIndex: ['projector', 'name'],
      key: 'projector',
      width: 200,
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
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => getPriorityTag(record.priority),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => getStatusTag(record.status),
    },
    {
      title: 'Người xử lý',
      dataIndex: 'respondedBy',
      key: 'respondedBy',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: SupportRequest) => {
        if (record.respondedBy) {
          return <Tag color="blue">{record.respondedBy}</Tag>;
        }
        return <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa phân công</span>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => dayjs(createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: SupportRequest) => (
        <div className={styles.actionButtons}>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetailModal(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => handleOpenAssignModal(record)}
              className={styles.assignButton}
            >
              Phân công
            </Button>
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
    <div className={styles.incidentsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <BugOutlined /> Báo cáo sự cố
        </h1>
        <p className={styles.pageDescription}>
          Quản lý và phân công xử lý các yêu cầu hỗ trợ kỹ thuật từ giáo viên
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.pendingIcon}`}>
              <ClockCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Chờ xử lý</div>
              <div className={styles.statValue}>{stats.pending}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.inProgressIcon}`}>
              <ExclamationCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Đang xử lý</div>
              <div className={styles.statValue}>{stats.inProgress}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.resolvedIcon}`}>
              <CheckCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Đã giải quyết</div>
              <div className={styles.statValue}>{stats.resolved}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.urgentIcon}`}>
              <ExclamationCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Khẩn cấp</div>
              <div className={styles.statValue}>{stats.urgent}</div>
            </div>
          </Card>
        </Col>
      </Row>

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
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          locale={{
            emptyText: (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <div className={styles.emptyTitle}>Chưa có báo cáo sự cố nào</div>
                <div className={styles.emptyDescription}>
                  Chưa có yêu cầu hỗ trợ nào từ giáo viên
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal chi tiết */}
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
      >
        {selectedRequest && (
          <div className={styles.modalContent}>
            <div className={styles.detailSection}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Người yêu cầu:</span>
                <span className={styles.detailValue}>
                  {selectedRequest.user.fullName} ({selectedRequest.user.userID})
                </span>
              </div>
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
              {selectedRequest.respondedBy && (
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
          </div>
        )}
      </Modal>

      {/* Modal phân công */}
      <Modal
        title="Phân công kỹ thuật viên"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={handleAssignTechnician}
        confirmLoading={assigning}
        okText="Phân công"
        cancelText="Hủy"
        width={600}
      >
        {selectedRequest && (
          <div className={styles.modalContent}>
            <div className={styles.detailSection}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Yêu cầu:</span>
                <span className={styles.detailValue}>{selectedRequest.title}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mức độ:</span>
                <span className={styles.detailValue}>
                  {getPriorityTag(selectedRequest.priority)}
                </span>
              </div>
            </div>

            <div className={styles.assignSection}>
              <div className={styles.assignTitle}>
                <UserAddOutlined /> Chọn kỹ thuật viên
              </div>
              <Select
                placeholder="Chọn kỹ thuật viên xử lý..."
                value={selectedTechnician || undefined}
                onChange={setSelectedTechnician}
                className={styles.technicianSelect}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={technicians.map(t => ({
                  label: `${t.fullName} (${t.userID})`,
                  value: t.userID,
                }))}
              />

              <div style={{ marginTop: '16px' }}>
                <div className={styles.assignTitle} style={{ marginBottom: '12px' }}>
                  <CalendarOutlined /> Lịch bảo trì
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#666', display: 'block', marginBottom: '8px' }}>
                    Thời gian bắt đầu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn thời gian bắt đầu"
                    value={scheduledStartTime}
                    onChange={setScheduledStartTime}
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#666', display: 'block', marginBottom: '8px' }}>
                    Thời gian kết thúc <span style={{ color: 'red' }}>*</span>
                  </label>
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn thời gian kết thúc"
                    value={scheduledEndTime}
                    onChange={setScheduledEndTime}
                    style={{ width: '100%' }}
                    disabledDate={(current) => {
                      if (!scheduledStartTime) return current && current < dayjs().startOf('day');
                      return current && current < dayjs(scheduledStartTime).startOf('day');
                    }}
                  />
                </div>
              </div>

              <div className={styles.assignInfo}>
                <InfoCircleOutlined className={styles.assignInfoIcon} />
                <span className={styles.assignInfoText}>
                  Thiết bị sẽ tự động chuyển sang trạng thái "Bảo trì" vào thời gian đã lên lịch
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

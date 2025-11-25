'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Modal, Radio, Input, App, Tag } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from './review.module.css';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Projector {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
}

interface Review {
  id: string;
  rating: number; // stored numerically for compatibility
  comment: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  projectorId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  projector: Projector;
  review: Review | null;
}

export default function TeacherReviewPage() {
  const { message } = App.useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [viewReviewModalVisible, setViewReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [level, setLevel] = useState<'good' | 'usable' | 'broken' | ''>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/reviews');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Không thể tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setLevel('');
    setComment('');
    setReviewModalVisible(true);
  };

  const handleOpenViewReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;
    
    if (!level) {
      message.warning('Vui lòng chọn mức đánh giá');
      return;
    }

    if (level === 'broken' && comment.trim().length === 0) {
      message.warning('Vui lòng mô tả sự cố khi chọn Hỏng/Sự cố');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/teacher/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          level,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create review');
      }

  message.success('Đánh giá đã được gửi thành công!');
      setReviewModalVisible(false);
      fetchBookings(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error creating review:', error);
      message.error(error instanceof Error ? error.message : 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Thiết bị',
      dataIndex: ['projector', 'name'],
      key: 'projector',
      render: (_: unknown, record: Booking) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.projector.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.projector.model}
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian sử dụng',
      key: 'time',
      render: (_: unknown, record: Booking) => (
        <div>
          <div>{dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            đến {dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
    {
      title: 'Trạng thái đánh giá',
      key: 'reviewStatus',
      align: 'center' as const,
      render: (_: unknown, record: Booking) => (
        record.review ? (
          <Tag className={`${styles.statusTag} ${styles.reviewedTag}`}>Đã đánh giá</Tag>
        ) : (
          <Tag className={`${styles.statusTag} ${styles.notReviewedTag}`}>
            Chưa đánh giá
          </Tag>
        )
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: Booking) => (
        <div className={styles.actionButtons}>
          {record.review ? (
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => handleOpenViewReviewModal(record)}
              className={styles.reviewButton}
            >
              Xem đánh giá
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => handleOpenReviewModal(record)}
              className={styles.reviewButton}
            >
              Đánh giá
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.reviewPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <FileTextOutlined /> Đánh giá thiết bị
        </h1>
        <p className={styles.pageDescription}>
          Đánh giá chất lượng thiết bị sau khi sử dụng để giúp cải thiện dịch vụ
        </p>
      </div>

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={bookings}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} booking`,
          }}
          locale={{
            emptyText: (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <div className={styles.emptyTitle}>Chưa có booking nào hoàn thành</div>
                <div className={styles.emptyDescription}>
                  Bạn chưa có booking nào để đánh giá
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal tạo đánh giá */}
      <Modal
        title="Đánh giá thiết bị"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleSubmitReview}
        confirmLoading={submitting}
        okText="Gửi đánh giá"
        cancelText="Hủy"
        width={600}
      >
        {selectedBooking && (
          <div className={styles.modalContent}>
            <div className={styles.bookingInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thiết bị:</span>
                <span className={styles.infoValue}>
                  {selectedBooking.projector.name} ({selectedBooking.projector.model})
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thời gian:</span>
                <span className={styles.infoValue}>
                  {dayjs(selectedBooking.startTime).format('DD/MM/YYYY HH:mm')} -{' '}
                  {dayjs(selectedBooking.endTime).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mục đích:</span>
                <span className={styles.infoValue}>{selectedBooking.purpose}</span>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>
                Đánh giá chất lượng <span style={{ color: 'red' }}>*</span>
              </div>
              <Radio.Group
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <Radio.Button value="good">Tốt</Radio.Button>
                <Radio.Button value="usable">Dùng được</Radio.Button>
                <Radio.Button value="broken">Hỏng/Sự cố</Radio.Button>
              </Radio.Group>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>Mô tả/nhận xét {level === 'broken' && <span style={{ color: 'red' }}>*</span>}</div>
              <TextArea
                rows={4}
                placeholder={level === 'broken' ? 'Vui lòng mô tả sự cố gặp phải...' : 'Chia sẻ trải nghiệm của bạn về thiết bị này...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xem đánh giá */}
      <Modal
        title="Chi tiết đánh giá"
        open={viewReviewModalVisible}
        onCancel={() => setViewReviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewReviewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
        className={styles.viewReviewModal}
      >
        {selectedBooking?.review && (
          <div className={styles.modalContent}>
            <div className={styles.bookingInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thiết bị:</span>
                <span className={styles.infoValue}>
                  {selectedBooking.projector.name} ({selectedBooking.projector.model})
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thời gian sử dụng:</span>
                <span className={styles.infoValue}>
                  {dayjs(selectedBooking.startTime).format('DD/MM/YYYY HH:mm')} -{' '}
                  {dayjs(selectedBooking.endTime).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
            </div>

            <div className={styles.reviewDetails}>
              <div className={styles.reviewRow}>
                <div className={styles.reviewLabel}>Đánh giá</div>
                <div>
                  {selectedBooking.review.rating >= 5 && 'Tốt'}
                  {selectedBooking.review.rating === 3 && 'Dùng được'}
                  {selectedBooking.review.rating <= 2 && 'Hỏng/Sự cố'}
                </div>
              </div>

              <div className={styles.reviewRow}>
                <div className={styles.reviewLabel}>Nhận xét</div>
                <div className={styles.reviewValue}>
                  {selectedBooking.review.comment || (
                    <span className={styles.noComment}>Không có nhận xét</span>
                  )}
                </div>
              </div>

              <div className={styles.reviewRow}>
                <div className={styles.reviewLabel}>Thời gian đánh giá</div>
                <div className={styles.reviewValue}>
                  {dayjs(selectedBooking.review.createdAt).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

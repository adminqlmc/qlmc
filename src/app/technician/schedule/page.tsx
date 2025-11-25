'use client';

import React, { useEffect, useState } from 'react';
import { Card, Calendar, Badge, Modal, Tag, Spin, App, Empty } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import styles from './schedule.module.css';

dayjs.extend(isoWeek);

interface MaintenanceSchedule {
  id: string;
  title: string;
  description: string;
  priority: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  projector: {
    name: string;
    room: string;
    building: string;
  } | null;
  user: {
    fullName: string;
    userID: string;
  };
}

export default function TechnicianSchedulePage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<MaintenanceSchedule[]>([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technician/schedule');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules);
      } else {
        message.error('Không thể tải lịch bảo trì');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    return schedules.filter((schedule) => {
      const scheduleDate = dayjs(schedule.scheduledStartTime).format('YYYY-MM-DD');
      return scheduleDate === dateStr;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className={styles.events}>
        {listData.map((item) => (
          <li key={item.id}>
            <Badge 
              status={item.priority === 'urgent' ? 'error' : 'warning'}
              text={
                <span className={styles.eventText}>
                  {dayjs(item.scheduledStartTime).format('HH:mm')} - {item.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const onSelect = (value: Dayjs) => {
    const listData = getListData(value);
    if (listData.length > 0) {
      setSelectedDate(value);
      setSelectedSchedules(listData);
      setDetailModalVisible(true);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Lịch bảo trì</h1>
        <p>Xem lịch bảo trì thiết bị được phân công</p>
      </div>

      <Card className={styles.card}>
        <Spin spinning={loading}>
          {schedules.length === 0 && !loading ? (
            <Empty 
              description="Chưa có lịch bảo trì nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Calendar 
              dateCellRender={dateCellRender}
              onSelect={onSelect}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Lịch bảo trì ngày {selectedDate.format('DD/MM/YYYY')}
          </span>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className={styles.scheduleList}>
          {selectedSchedules.map((schedule) => (
            <div key={schedule.id} className={styles.scheduleItem}>
              <div className={styles.scheduleHeader}>
                <h3>{schedule.title}</h3>
                <Tag color={getPriorityColor(schedule.priority)}>
                  {getPriorityText(schedule.priority)}
                </Tag>
              </div>
              
              <div className={styles.scheduleDetail}>
                <div className={styles.detailRow}>
                  <ClockCircleOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                  <strong>Thời gian:</strong>
                  <span>
                    {dayjs(schedule.scheduledStartTime).format('HH:mm')} - 
                    {dayjs(schedule.scheduledEndTime).format('HH:mm')}
                  </span>
                </div>

                {schedule.projector && (
                  <div className={styles.detailRow}>
                    <strong>Thiết bị:</strong>
                    <span>{schedule.projector.name}</span>
                  </div>
                )}

                {schedule.projector && (
                  <div className={styles.detailRow}>
                    <strong>Vị trí:</strong>
                    <span>{schedule.projector.room} - {schedule.projector.building}</span>
                  </div>
                )}

                <div className={styles.detailRow}>
                  <strong>Người yêu cầu:</strong>
                  <span>{schedule.user.fullName} ({schedule.user.userID})</span>
                </div>

                <div className={styles.detailRow}>
                  <strong>Mô tả:</strong>
                  <p>{schedule.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

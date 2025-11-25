"use client";

import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Spin, App, Select } from 'antd';
import { CalendarOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import styles from './schedule.module.css';

dayjs.extend(isoWeek);

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'approved' | 'completed';
  projector: {
    id: string;
    name: string;
    model: string;
    room: string;
    building: string;
  };
  user?: {
    userID: string;
    fullName: string;
  };
}

interface Projector {
  id: string;
  name: string;
  model: string;
  room: string;
  building: string;
}

interface MaintenanceSchedule {
  id: string;
  projectorId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  title: string;
  respondedBy: string | null;
}

interface TimeSlot {
  hour: number;
  bookings: { [key: number]: Booking | null }; // key is day of week (0-6)
  maintenances: { [key: number]: MaintenanceSchedule | null }; // maintenance schedules
}

export default function SchedulePage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [projectors, setProjectors] = useState<Projector[]>([]);
  const [selectedProjector, setSelectedProjector] = useState<string>('');
  const [activeTab, setActiveTab] = useState('my');

  // Color schemes for projectors and users
  const colorSchemes = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#5a67d8' }, // Purple
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: '#f5576c' }, // Pink-Red
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#00a8cc' }, // Blue
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#2dd4bf' }, // Green
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#fb923c' }, // Orange-Pink
    { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', border: '#0891b2' }, // Teal-Purple
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#06b6d4' }, // Pastel
    { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', border: '#f472b6' }, // Light Pink
    { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#fb923c' }, // Peach
    { bg: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', border: '#ec4899' }, // Coral-Blue
  ];

  // Get color by ID (projector or user)
  const getColorByHash = (id: string): { bg: string; border: string } => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorSchemes.length;
    return colorSchemes[index];
  };

  // Fetch my bookings
  const fetchMySchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/schedule/my');
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings);
      } else {
        message.error('Không thể tải lịch của bạn');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all schedules
  const fetchAllSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/schedule/all');
      if (res.ok) {
        const data = await res.json();
        setAllBookings(data.bookings);
        setProjectors(data.projectors);
        setMaintenanceSchedules(data.maintenanceSchedules || []);
        if (data.projectors.length > 0 && !selectedProjector) {
          setSelectedProjector(data.projectors[0].id);
        }
      } else {
        message.error('Không thể tải lịch chung');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMySchedule();
    } else {
      fetchAllSchedules();
    }
  }, [activeTab]);

  // Generate time slots (6:00 - 22:00)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({
        hour,
        bookings: {},
        maintenances: {},
      });
    }
    return slots;
  };

  // Map bookings and maintenances to weekly calendar
  const mapBookingsToCalendar = (bookings: Booking[], maintenances: MaintenanceSchedule[]) => {
    const slots = generateTimeSlots();
    const startOfWeek = dayjs().startOf('isoWeek');

    // Map bookings
    bookings.forEach((booking) => {
      const startTime = dayjs(booking.startTime);
      const endTime = dayjs(booking.endTime);
      const dayOfWeek = startTime.isoWeekday() - 1; // 0 = Monday

      // Check if booking is in current week
      if (startTime.isSame(startOfWeek, 'week')) {
        const startHour = startTime.hour();
        const endHour = endTime.hour();

        // Fill time slots
        for (let hour = startHour; hour < endHour && hour <= 22; hour++) {
          const slotIndex = hour - 6;
          if (slotIndex >= 0 && slotIndex < slots.length) {
            slots[slotIndex].bookings[dayOfWeek] = booking;
          }
        }
      }
    });

    // Map maintenance schedules
    maintenances.forEach((maintenance) => {
      const startTime = dayjs(maintenance.scheduledStartTime);
      const endTime = dayjs(maintenance.scheduledEndTime);
      const dayOfWeek = startTime.isoWeekday() - 1; // 0 = Monday

      // Check if maintenance is in current week
      if (startTime.isSame(startOfWeek, 'week')) {
        const startHour = startTime.hour();
        const endHour = endTime.hour();

        // Fill time slots
        for (let hour = startHour; hour < endHour && hour <= 22; hour++) {
          const slotIndex = hour - 6;
          if (slotIndex >= 0 && slotIndex < slots.length) {
            slots[slotIndex].maintenances[dayOfWeek] = maintenance;
          }
        }
      }
    });

    return slots;
  };

  // Get current week dates
  const getWeekDates = () => {
    const startOfWeek = dayjs().startOf('isoWeek');
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.add(i, 'day'));
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Columns for my schedule
  const myScheduleColumns: ColumnsType<TimeSlot> = [
    {
      title: 'Giờ',
      dataIndex: 'hour',
      key: 'hour',
      width: 80,
      fixed: 'left',
      render: (hour: number) => (
        <div className={styles.timeCell}>
          <strong>{`${hour}:00`}</strong>
        </div>
      ),
    },
    ...weekDates.map((date, index) => ({
      title: (
        <div className={styles.dayHeader}>
          <div>{dayNames[index]}</div>
          <div className={styles.dateText}>{date.format('DD/MM')}</div>
        </div>
      ),
      dataIndex: ['bookings', index],
      key: `day-${index}`,
      width: 150,
      render: (_: any, record: TimeSlot) => {
        const booking = record.bookings[index];
        const maintenance = record.maintenances[index];
        
        // Show maintenance if exists
        if (maintenance) {
          const isToday = date.isSame(dayjs(), 'day');
          return (
            <div 
              className={`${styles.maintenanceCell} ${isToday ? styles.today : ''}`}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderLeftColor: '#f59e0b',
              }}
            >
              <div className={styles.bookingInfo}>
                <div className={styles.maintenanceTitle}>🔧 {maintenance.title}</div>
                <div className={styles.userName}>
                  Kỹ thuật viên: {maintenance.respondedBy || 'Chưa phân công'}
                </div>
                <div className={styles.time}>
                  {dayjs(maintenance.scheduledStartTime).format('HH:mm')} - {dayjs(maintenance.scheduledEndTime).format('HH:mm')}
                </div>
                <Tag color="warning">Bảo trì</Tag>
              </div>
            </div>
          );
        }
        
        if (!booking) return <div className={styles.emptyCell}></div>;

        const isToday = date.isSame(dayjs(), 'day');
        const isPast = dayjs(booking.endTime).isBefore(dayjs());
        const colors = getColorByHash(booking.projector.id);

        return (
          <div 
            className={`${styles.bookingCell} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''}`}
            style={{
              background: isPast ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : colors.bg,
              borderLeftColor: isPast ? '#6b7280' : colors.border,
            }}
          >
            <div className={styles.bookingInfo}>
              <div className={styles.projectorName}>{booking.projector.name}</div>
              <div className={styles.location}>
                {booking.projector.room} - {booking.projector.building}
              </div>
              <div className={styles.time}>
                {dayjs(booking.startTime).format('HH:mm')} - {dayjs(booking.endTime).format('HH:mm')}
              </div>
              <Tag color={booking.status === 'completed' ? 'default' : 'success'}>
                {booking.status === 'completed' ? 'Hoàn thành' : 'Đã duyệt'}
              </Tag>
            </div>
          </div>
        );
      },
    })),
  ];

  // Columns for all schedules (by projector)
  const allScheduleColumns: ColumnsType<TimeSlot> = [
    {
      title: 'Giờ',
      dataIndex: 'hour',
      key: 'hour',
      width: 80,
      fixed: 'left',
      render: (hour: number) => (
        <div className={styles.timeCell}>
          <strong>{`${hour}:00`}</strong>
        </div>
      ),
    },
    ...weekDates.map((date, index) => ({
      title: (
        <div className={styles.dayHeader}>
          <div>{dayNames[index]}</div>
          <div className={styles.dateText}>{date.format('DD/MM')}</div>
        </div>
      ),
      dataIndex: ['bookings', index],
      key: `day-${index}`,
      width: 150,
      render: (_: any, record: TimeSlot) => {
        const booking = record.bookings[index];
        const maintenance = record.maintenances[index];
        
        // Show maintenance if exists
        if (maintenance) {
          const isToday = date.isSame(dayjs(), 'day');
          return (
            <div 
              className={`${styles.maintenanceCell} ${isToday ? styles.today : ''}`}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderLeftColor: '#f59e0b',
              }}
            >
              <div className={styles.bookingInfo}>
                <div className={styles.maintenanceTitle}>🔧 {maintenance.title}</div>
                <div className={styles.userName}>
                  Kỹ thuật viên: {maintenance.respondedBy || 'Chưa phân công'}
                </div>
                <div className={styles.time}>
                  {dayjs(maintenance.scheduledStartTime).format('HH:mm')} - {dayjs(maintenance.scheduledEndTime).format('HH:mm')}
                </div>
                <Tag color="warning">Bảo trì</Tag>
              </div>
            </div>
          );
        }
        
        if (!booking) return <div className={styles.emptyCell}></div>;

        const isToday = date.isSame(dayjs(), 'day');
        const isPast = dayjs(booking.endTime).isBefore(dayjs());
        const colors = booking.user ? getColorByHash(booking.user.userID) : colorSchemes[0];

        return (
          <div 
            className={`${styles.bookingCell} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''}`}
            style={{
              background: isPast ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : colors.bg,
              borderLeftColor: isPast ? '#6b7280' : colors.border,
            }}
          >
            <div className={styles.bookingInfo}>
              <div className={styles.userName}>{booking.user?.fullName}</div>
              <div className={styles.userID}>{booking.user?.userID}</div>
              <div className={styles.time}>
                {dayjs(booking.startTime).format('HH:mm')} - {dayjs(booking.endTime).format('HH:mm')}
              </div>
              <Tag color={booking.status === 'completed' ? 'default' : 'success'}>
                {booking.status === 'completed' ? 'Hoàn thành' : 'Đã duyệt'}
              </Tag>
            </div>
          </div>
        );
      },
    })),
  ];

  // Filter bookings by selected projector
  const filteredBookings = selectedProjector
    ? allBookings.filter((b) => b.projector.id === selectedProjector)
    : [];

  // Filter maintenance schedules by selected projector
  const filteredMaintenances = selectedProjector
    ? maintenanceSchedules.filter((m) => m.projectorId === selectedProjector)
    : [];

  const myScheduleData = mapBookingsToCalendar(myBookings, []);
  const allScheduleData = mapBookingsToCalendar(filteredBookings, filteredMaintenances);

  // Get unique projectors from my bookings
  const uniqueProjectors = Array.from(
    new Map(myBookings.map(b => [b.projector.id, b.projector])).values()
  );

  // Get unique users from filtered bookings
  const uniqueUsers = Array.from(
    new Map(
      filteredBookings
        .filter(b => b.user)
        .map(b => [b.user!.userID, b.user!])
    ).values()
  );

  const tabItems = [
    {
      key: 'my',
      label: (
        <span>
          <CalendarOutlined />
          Lịch của tôi
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <div className={styles.scheduleContainer}>
            <div className={styles.weekInfo}>
              <ClockCircleOutlined />
              <span>
                Tuần này: {weekDates[0].format('DD/MM/YYYY')} - {weekDates[6].format('DD/MM/YYYY')}
              </span>
            </div>
            
            {/* Legend for projectors */}
            {uniqueProjectors.length > 0 && (
              <div className={styles.legend}>
                <div className={styles.legendTitle}>Chú thích màu theo thiết bị:</div>
                <div className={styles.legendItems}>
                  {uniqueProjectors.map((projector) => {
                    const colors = getColorByHash(projector.id);
                    return (
                      <div key={projector.id} className={styles.legendItem}>
                        <div 
                          className={styles.legendColor}
                          style={{ 
                            background: colors.bg,
                            borderColor: colors.border,
                          }}
                        />
                        <span>{projector.name} - {projector.room}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Legend for maintenance */}
            <div className={styles.legend}>
              <div className={styles.legendTitle}>Chú thích trạng thái:</div>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div 
                    className={styles.legendColor}
                    style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      borderColor: '#f59e0b',
                    }}
                  />
                  <span>🔧 Lịch bảo trì</span>
                </div>
                <div className={styles.legendItem}>
                  <div 
                    className={styles.legendColor}
                    style={{ 
                      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      borderColor: '#6b7280',
                    }}
                  />
                  <span>Đã hoàn thành</span>
                </div>
              </div>
            </div>

            <Table
              columns={myScheduleColumns}
              dataSource={myScheduleData}
              rowKey="hour"
              pagination={false}
              scroll={{ x: 1200 }}
              className={styles.scheduleTable}
            />
          </div>
        </Spin>
      ),
    },
    {
      key: 'all',
      label: (
        <span>
          <GlobalOutlined />
          Tất cả thiết bị
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <div className={styles.scheduleContainer}>
            <div className={styles.toolbar}>
              <div className={styles.weekInfo}>
                <ClockCircleOutlined />
                <span>
                  Tuần này: {weekDates[0].format('DD/MM/YYYY')} - {weekDates[6].format('DD/MM/YYYY')}
                </span>
              </div>
              <Select
                style={{ width: 300 }}
                placeholder="Chọn thiết bị"
                value={selectedProjector}
                onChange={setSelectedProjector}
                options={projectors.map((p) => ({
                  value: p.id,
                  label: `${p.name} - ${p.room} (${p.building})`,
                }))}
              />
            </div>

            {/* Legend for users */}
            {uniqueUsers.length > 0 && (
              <div className={styles.legend}>
                <div className={styles.legendTitle}>Chú thích màu theo người dùng:</div>
                <div className={styles.legendItems}>
                  {uniqueUsers.map((user) => {
                    const colors = getColorByHash(user.userID);
                    return (
                      <div key={user.userID} className={styles.legendItem}>
                        <div 
                          className={styles.legendColor}
                          style={{ 
                            background: colors.bg,
                            borderColor: colors.border,
                          }}
                        />
                        <span>{user.fullName} ({user.userID})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Legend for maintenance */}
            <div className={styles.legend}>
              <div className={styles.legendTitle}>Chú thích trạng thái:</div>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div 
                    className={styles.legendColor}
                    style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      borderColor: '#f59e0b',
                    }}
                  />
                  <span>🔧 Lịch bảo trì</span>
                </div>
                <div className={styles.legendItem}>
                  <div 
                    className={styles.legendColor}
                    style={{ 
                      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      borderColor: '#6b7280',
                    }}
                  />
                  <span>Đã hoàn thành</span>
                </div>
              </div>
            </div>

            <Table
              columns={allScheduleColumns}
              dataSource={allScheduleData}
              rowKey="hour"
              pagination={false}
              scroll={{ x: 1200 }}
              className={styles.scheduleTable}
            />
          </div>
        </Spin>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Thời gian biểu</h1>
          <p className={styles.description}>Xem lịch sử dụng thiết bị theo tuần</p>
        </div>
      </div>

      <Card className={styles.card}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, App, DatePicker, Select, Space } from 'antd';
import { 
  BarChartOutlined, 
  PieChartOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './statistics.module.css';

dayjs.extend(isoWeek);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DeviceUsageData {
  name: string;
  hours: number;
  bookingCount: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface RatingData {
  name: string;
  value: number;
  color: string;
}

export default function StatisticsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('isoWeek'),
    dayjs().endOf('isoWeek'),
  ]);
  const [deviceUsageData, setDeviceUsageData] = useState<DeviceUsageData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [ratingData, setRatingData] = useState<RatingData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const res = await fetch(`/api/admin/statistics?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setDeviceUsageData(data.deviceUsage);
        setStatusData(data.statusDistribution);
        setRatingData(data.ratingDistribution);
        setTotalHours(data.totalHours);
        setTotalBookings(data.totalBookings);
        setTotalDevices(data.totalDevices);
      } else {
        message.error('Không thể tải dữ liệu thống kê');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (type: string) => {
    const now = dayjs();
    switch (type) {
      case 'thisWeek':
        setDateRange([now.startOf('isoWeek'), now.endOf('isoWeek')]);
        break;
      case 'lastWeek':
        setDateRange([
          now.subtract(1, 'week').startOf('isoWeek'),
          now.subtract(1, 'week').endOf('isoWeek'),
        ]);
        break;
      case 'thisMonth':
        setDateRange([now.startOf('month'), now.endOf('month')]);
        break;
      case 'lastMonth':
        setDateRange([
          now.subtract(1, 'month').startOf('month'),
          now.subtract(1, 'month').endOf('month'),
        ]);
        break;
    }
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{payload[0].payload.name}</p>
          <p className={styles.tooltipValue}>
            {payload[0].name}: {payload[0].value}
            {payload[0].dataKey === 'hours' ? ' giờ' : ''}
          </p>
          {payload[0].payload.bookingCount && (
            <p className={styles.tooltipValue}>
              Số lượt đặt: {payload[0].payload.bookingCount}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Thống kê sử dụng thiết bị</h1>
          <p>Phân tích tần suất và trạng thái sử dụng máy chiếu</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className={styles.filterCard}>
        <Space size="middle" wrap>
          <CalendarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>Chọn khoảng thời gian:</span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
            style={{ width: 280 }}
          />
          <Select
            placeholder="Chọn nhanh"
            style={{ width: 150 }}
            onChange={handleQuickSelect}
            value={undefined}
          >
            <Option value="thisWeek">Tuần này</Option>
            <Option value="lastWeek">Tuần trước</Option>
            <Option value="thisMonth">Tháng này</Option>
            <Option value="lastMonth">Tháng trước</Option>
          </Select>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* Summary Cards */}
        <Row gutter={[16, 16]} className={styles.summaryRow}>
          <Col xs={24} sm={8}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryContent}>
                <div className={styles.summaryIcon} style={{ background: '#e6f4ff' }}>
                  <BarChartOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                </div>
                <div className={styles.summaryText}>
                  <div className={styles.summaryLabel}>Tổng giờ sử dụng</div>
                  <div className={styles.summaryValue}>{totalHours.toFixed(1)} giờ</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryContent}>
                <div className={styles.summaryIcon} style={{ background: '#f6ffed' }}>
                  <CalendarOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                </div>
                <div className={styles.summaryText}>
                  <div className={styles.summaryLabel}>Tổng lượt đặt</div>
                  <div className={styles.summaryValue}>{totalBookings}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryContent}>
                <div className={styles.summaryIcon} style={{ background: '#fff7e6' }}>
                  <PieChartOutlined style={{ fontSize: 32, color: '#faad14' }} />
                </div>
                <div className={styles.summaryText}>
                  <div className={styles.summaryLabel}>Số thiết bị</div>
                  <div className={styles.summaryValue}>{totalDevices}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Chart 1: Device Usage (Bar Chart) */}
        <Card 
          title={
            <span>
              <BarChartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
              Thời gian sử dụng theo thiết bị
            </span>
          }
          className={styles.chartCard}
        >
          <div className={styles.chartDescription}>
            Biểu đồ thể hiện tổng số giờ sử dụng của từng thiết bị trong khoảng thời gian đã chọn
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={deviceUsageData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Giờ sử dụng', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: any) => value === 'hours' ? 'Giờ sử dụng' : value}
              />
              <Bar 
                dataKey="hours" 
                fill="#1677ff" 
                radius={[8, 8, 0, 0]}
                name="Giờ sử dụng"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Charts 2 & 3: Pie Charts */}
        <Row gutter={[16, 16]}>
          {/* Chart 2: Device Status Distribution */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span>
                  <PieChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                  Phân bố trạng thái thiết bị
                </span>
              }
              className={styles.chartCard}
            >
              <div className={styles.chartDescription}>
                Tỷ lệ phân bố trạng thái của các thiết bị trong hệ thống
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Chart 3: Rating Distribution */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span>
                  <PieChartOutlined style={{ marginRight: 8, color: '#faad14' }} />
                  Phân bố đánh giá thiết bị
                </span>
              }
              className={styles.chartCard}
            >
              <div className={styles.chartDescription}>
                Tỷ lệ đánh giá của người dùng qua các lần booking (1-5 sao)
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

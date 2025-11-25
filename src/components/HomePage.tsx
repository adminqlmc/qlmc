"use client";

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel, Spin } from 'antd';
import { LaptopOutlined, CheckCircleOutlined, ToolOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import styles from './HomePage.module.css';

interface ProjectorStats {
  total: number;
  available: number;
  maintenance: number;
  broken: number;
  inUse: number;
}

export default function HomePage() {
  const carouselRef = React.useRef<any>(null);
  const chatbotRef = React.useRef<any>(null);
  const [stats, setStats] = useState<ProjectorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/projectors/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>Chào mừng đến với hệ thống quản lý máy chiếu QLMC</h1>
          <p className={styles.welcomeText}>Giám sát trạng thái, lịch sử sử dụng, thống kê phòng học và tối ưu vận hành thiết bị theo thời gian.</p>
        </div>
        <Button type="primary" size="large" className={styles.monitorButton}>⚡ Realtime Monitor</Button>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} md={8}>
          <Card className={styles.statsCard}>
            {loading ? (
              <Spin />
            ) : (
              <div className={styles.statsContent}>
                <div className={styles.statIconBlue}>
                  <LaptopOutlined className={styles.statIcon} />
                </div>
                <div>
                  <div className={styles.statValue}>{stats?.total || 0}</div>
                  <div className={styles.statLabel}>Tổng số máy chiếu</div>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.statsCard}>
            {loading ? (
              <Spin />
            ) : (
              <div className={styles.statsContent}>
                <div className={styles.statIconGreen}>
                  <CheckCircleOutlined className={styles.statIcon} />
                </div>
                <div>
                  <div className={styles.statValue}>{stats?.available || 0}</div>
                  <div className={styles.statLabel}>Sẵn sàng</div>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.statsCard}>
            {loading ? (
              <Spin />
            ) : (
              <div className={styles.statsContent}>
                <div className={styles.statIconYellow}>
                  <ToolOutlined className={styles.statIcon} />
                </div>
                <div>
                  <div className={styles.statValue}>{stats?.maintenance || 0}</div>
                  <div className={styles.statLabel}>Bảo trì</div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Main Content Row */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card className={styles.carouselContainer} styles={{ body: { padding: 0 } }}>
            <Carousel ref={carouselRef} autoplay>
              <div><img src="/pm1.jpg" alt="Projector 1" className={styles.carouselImage} /></div>
              <div><img src="/pm2.jpg" alt="Projector 2" className={styles.carouselImage} /></div>
              <div><img src="/pm3.jpg" alt="Projector 3" className={styles.carouselImage} /></div>
            </Carousel>
            <Button 
              shape="circle" 
              icon={<LeftOutlined />} 
              onClick={() => carouselRef.current?.prev()} 
              className={styles.carouselButtonLeft}
            />
            <Button 
              shape="circle" 
              icon={<RightOutlined />} 
              onClick={() => carouselRef.current?.next()} 
              className={styles.carouselButtonRight}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Quản lý Máy chiếu Thông minh" className={styles.infoCard}>
            <p className={styles.infoText}>
              Hệ thống giúp theo dõi trạng thái hoạt động, lịch sử sử dụng và bảo trì của từng thiết bị. Tự động cảnh báo sự cố và lập lịch bảo dưỡng định kỳ.
            </p>
          </Card>
        </Col>
      </Row>

      <div className={styles.spacer} />

      {/* Bottom Row - Chatbot Section */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title="Trợ lý AI Thông minh" className={styles.chatbotCard}>
            <p className={styles.chatbotText}>
              Chatbot tích hợp trí tuệ nhân tạo, hỗ trợ tra cứu và xử lý sự cố 24/7. Phân tích lỗi thông minh và đề xuất giải pháp khắc phục nhanh chóng.
            </p>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className={styles.chatbotCarouselContainer} styles={{ body: { padding: 0 } }}>
            <Carousel ref={chatbotRef} autoplay autoplaySpeed={3000}>
              <div><img src="/cb1.webp" alt="Chatbot 1" className={styles.carouselImage} /></div>
              <div><img src="/cb2.png" alt="Chatbot 2" className={styles.carouselImage} /></div>
              <div><img src="/cb3.jpg" alt="Chatbot 3" className={styles.carouselImage} /></div>
            </Carousel>
            <Button 
              shape="circle" 
              icon={<LeftOutlined />} 
              onClick={() => chatbotRef.current?.prev()} 
              className={styles.carouselButtonLeft}
            />
            <Button 
              shape="circle" 
              icon={<RightOutlined />} 
              onClick={() => chatbotRef.current?.next()} 
              className={styles.carouselButtonRight}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

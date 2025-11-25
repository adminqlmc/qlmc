"use client";

import React from 'react';
import { Row, Col, Card, Button, Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styles from './HomePage.module.css';

export default function HomePageContent() {
  const carouselRef = React.useRef<any>(null);
  const chatbotRef = React.useRef<any>(null);

  return (
    <>
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
    </>
  );
}

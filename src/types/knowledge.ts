/**
 * Knowledge Base Document Type Definition
 * Defines the structure of documents in the knowledge base with metadata
 */

export type KnowledgeDocument = {
  /** Unique document identifier */
  docId: string;
  
  /** Document title for reference */
  title: string;
  
  /** Roles allowed to access this document */
  role: ("teacher" | "technician" | "admin")[];
  
  /** Intent category for classification */
  intent: KnowledgeIntent;
  
  /** Keywords for search optimization */
  keywords: string[];
  
  /** Document content (200-400 characters recommended) */
  content: string;
};

/**
 * All available intent categories in the system
 */
export type KnowledgeIntent =
  | "greeting"                    // Lời chào
  | "system_overview"             // Tổng quan hệ thống
  | "booking_device"              // Đặt mượn thiết bị
  | "booking_steps"               // Các bước đặt mượn
  | "booking_rules"               // Quy định đặt mượn
  | "booking_status"              // Trạng thái đặt mượn
  | "booking_history"             // Lịch sử đặt mượn
  | "cancel_booking"              // Hủy đặt mượn
  | "view_schedule"               // Xem thời gian biểu
  | "maintenance_schedule"        // Lịch bảo trì
  | "device_review"               // Đánh giá thiết bị
  | "rating_guide"                // Hướng dẫn đánh giá
  | "review_comments"             // Nhận xét đánh giá
  | "support_request"             // Yêu cầu hỗ trợ
  | "create_support"              // Tạo yêu cầu hỗ trợ
  | "track_support"               // Theo dõi hỗ trợ
  | "support_timing"              // Thời gian hỗ trợ
  | "ai_assistant"                // Trợ lý AI
  | "ai_faq"                      // Câu hỏi AI thường gặp
  | "ai_feedback"                 // Đánh giá AI
  | "ai_training"                 // Huấn luyện AI
  | "error_handling"              // Xử lý lỗi
  | "best_practices";             // Mẹo sử dụng

/**
 * Type for training API (includes optional fields for backward compatibility)
 */
export type KnowledgeItem = {
  docId: string;
  title?: string;
  role?: string[];
  intent?: string;
  keywords?: string[];
  content: string;
};

// Knowledge Base Document Type with Metadata
export type KnowledgeDocument = {
  docId: string;
  title: string;
  role: ("teacher" | "technician" | "admin")[];
  intent: string;
  keywords: string[];
  content: string;
};

// Example intents:
// - greeting
// - system_overview
// - booking_device
// - booking_steps
// - booking_rules
// - booking_status
// - cancel_booking
// - booking_history
// - view_schedule
// - maintenance_schedule
// - device_review
// - rating_guide
// - review_comments
// - support_request
// - create_support
// - track_support
// - support_timing
// - ai_assistant
// - ai_faq
// - ai_feedback
// - ai_training
// - error_handling
// - best_practices

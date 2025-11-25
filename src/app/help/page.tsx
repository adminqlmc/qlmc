'use client';

import React, { useEffect, useState } from 'react';
import { Card, Collapse, Typography, Steps, Tag, Spin, App, Tabs, Alert } from 'antd';
import { 
  QuestionCircleOutlined,
  UserOutlined,
  SafetyOutlined,
  ToolOutlined,
  BookOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import styles from './help.module.css';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface UserInfo {
  role: 'admin' | 'teacher' | 'technician';
  fullName: string;
}

export default function HelpPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
      } else {
        message.error('Không thể tải thông tin người dùng');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const getAdminContent = () => ({
    overview: {
      title: 'Tổng quan hệ thống Quản trị viên',
      description: 'Là Admin, bạn có quyền quản lý toàn bộ hệ thống quản lý máy chiếu, bao gồm thiết bị, người dùng, lịch đặt và thống kê.',
      features: [
        'Quản lý thiết bị máy chiếu (thêm, sửa, xóa, cập nhật trạng thái)',
        'Quản lý người dùng (giáo viên, kỹ thuật viên)',
        'Phê duyệt và từ chối lịch đặt',
        'Xem thống kê sử dụng thiết bị',
        'Quản lý yêu cầu hỗ trợ và phân công kỹ thuật viên',
      ],
    },
    guides: [
      {
        key: 'devices',
        icon: <ToolOutlined />,
        title: 'Quản lý Thiết bị',
        steps: [
          {
            title: 'Thêm thiết bị mới',
            description: 'Vào "Quản lý thiết bị" → Nhấn "Thêm thiết bị" → Điền đầy đủ thông tin (tên, model, số serial, phòng, tòa nhà, ngày mua, bảo hành) → Nhấn "Lưu"',
          },
          {
            title: 'Sửa thông tin thiết bị',
            description: 'Tìm thiết bị cần sửa → Nhấn "Sửa" → Cập nhật thông tin → Nhấn "Lưu"',
          },
          {
            title: 'Xóa thiết bị',
            description: 'Tìm thiết bị cần xóa → Nhấn "Xóa" → Xác nhận xóa (Lưu ý: chỉ xóa được thiết bị không có lịch đặt)',
          },
          {
            title: 'Cập nhật trạng thái',
            description: 'Thiết bị có 3 trạng thái: Sẵn sàng (có thể đặt), Bảo trì (đang bảo trì), Hỏng (không sử dụng được)',
          },
        ],
      },
      {
        key: 'users',
        icon: <UserOutlined />,
        title: 'Quản lý Người dùng',
        steps: [
          {
            title: 'Thêm người dùng',
            description: 'Vào "Quản lý người dùng" → Nhấn "Thêm người dùng" → Điền thông tin (họ tên, email, mã số, vai trò) → Mật khẩu mặc định sẽ được tạo tự động',
          },
          {
            title: 'Phân quyền',
            description: 'Có 3 vai trò: Admin (quản trị), Teacher (giáo viên - đặt mượn), Technician (kỹ thuật viên - bảo trì)',
          },
          {
            title: 'Khóa/Mở khóa tài khoản',
            description: 'Sử dụng toggle "Kích hoạt" để khóa/mở khóa tài khoản người dùng',
          },
          {
            title: 'Reset mật khẩu',
            description: 'Nhấn "Reset mật khẩu" để tạo mật khẩu mới cho người dùng',
          },
        ],
      },
      {
        key: 'bookings',
        icon: <BookOutlined />,
        title: 'Quản lý Lịch đặt',
        steps: [
          {
            title: 'Xem danh sách lịch đặt',
            description: 'Vào "Quản lý lịch đặt" → Xem các tab: Chờ duyệt, Đã duyệt, Từ chối, Hoàn thành',
          },
          {
            title: 'Phê duyệt lịch đặt',
            description: 'Tại tab "Chờ duyệt" → Xem thông tin chi tiết → Kiểm tra thiết bị có sẵn → Nhấn "Duyệt" hoặc "Từ chối"',
          },
          {
            title: 'Lọc và tìm kiếm',
            description: 'Sử dụng bộ lọc theo thiết bị, người dùng, thời gian để tìm kiếm nhanh',
          },
        ],
      },
      {
        key: 'incidents',
        icon: <WarningOutlined />,
        title: 'Quản lý Yêu cầu hỗ trợ',
        steps: [
          {
            title: 'Xem yêu cầu',
            description: 'Vào "Báo cáo sự cố" → Xem các yêu cầu từ giáo viên với mức độ ưu tiên (Khẩn cấp, Cao, Trung bình, Thấp)',
          },
          {
            title: 'Phân công kỹ thuật viên',
            description: 'Nhấn "Phân công" → Chọn kỹ thuật viên → Chọn thời gian bắt đầu và kết thúc → Xác nhận. Thiết bị sẽ tự động chuyển sang trạng thái "Bảo trì" vào thời gian đã lên lịch',
          },
          {
            title: 'Theo dõi tiến độ',
            description: 'Theo dõi trạng thái: Chờ xử lý → Đang xử lý → Đã hoàn thành',
          },
        ],
      },
      {
        key: 'statistics',
        icon: <RocketOutlined />,
        title: 'Xem Thống kê',
        steps: [
          {
            title: 'Thống kê sử dụng thiết bị',
            description: 'Vào "Tần suất sử dụng thiết bị" → Chọn khoảng thời gian → Xem 3 biểu đồ: Thời gian sử dụng (cột), Trạng thái thiết bị (tròn), Đánh giá thiết bị (tròn)',
          },
          {
            title: 'Chọn khoảng thời gian',
            description: 'Sử dụng DatePicker hoặc chọn nhanh: Tuần này, Tuần trước, Tháng này, Tháng trước',
          },
          {
            title: 'Phân tích dữ liệu',
            description: 'Xem tổng giờ sử dụng, tổng lượt đặt, phân bố trạng thái thiết bị, và đánh giá người dùng',
          },
        ],
      },
      {
        key: 'ai-learning',
        icon: <RocketOutlined />,
        title: 'AI Tự Học',
        steps: [
          {
            title: 'Xem lịch sử học tập',
            description: 'Vào "AI Tự Học" → Xem timeline các lần AI học từ feedback của người dùng. Mỗi ngày 00:00, hệ thống tự động phân tích feedback 24h qua',
          },
          {
            title: 'Thống kê tổng quan',
            description: 'Xem 6 metrics: Tổng số lần học, Tổng feedback đã xử lý, Trung bình feedback/ngày, Tổng Like, Tổng Dislike, Trung bình docs cập nhật/ngày',
          },
          {
            title: 'Chi tiết mỗi lần học',
            description: 'Mỗi log hiển thị: Số feedback, Like/Dislike count, Documents updated, Top câu hỏi phổ biến với điểm trung bình, Các cải thiện đã thực hiện',
          },
          {
            title: 'Hiểu điểm số',
            description: 'Mỗi Like = +1.0 điểm, Dislike = -0.5 điểm. Documents có điểm cao sẽ được ưu tiên hiển thị khi AI trả lời',
          },
        ],
      },
      {
        key: 'ai-feedback',
        icon: <MessageOutlined />,
        title: 'Thống kê Feedback AI',
        steps: [
          {
            title: 'Xem tổng quan feedback',
            description: 'Vào "Thống kê Feedback" → Xem tổng số feedback, tỷ lệ hài lòng, và biểu đồ phân bố Like/Dislike theo thời gian',
          },
          {
            title: 'Phân tích câu hỏi',
            description: 'Xem tab "Tất cả phản hồi" để thấy câu hỏi nào được đánh giá tốt (Like) và câu nào cần cải thiện (Dislike)',
          },
          {
            title: 'Cải thiện chatbot',
            description: 'Các câu hỏi có nhiều Dislike nên được review và cập nhật knowledge base để AI trả lời tốt hơn',
          },
        ],
      },
    ],
    tips: [
      'Thường xuyên kiểm tra tab "Chờ duyệt" để phê duyệt lịch đặt kịp thời',
      'Ưu tiên xử lý các yêu cầu hỗ trợ có mức độ "Khẩn cấp"',
      'Đảm bảo thông tin thiết bị luôn được cập nhật chính xác',
      'Kiểm tra thống kê định kỳ để nắm bắt tình hình sử dụng',
      'Theo dõi AI Tự Học hàng ngày để đánh giá chất lượng chatbot',
      'Review feedback Dislike để cải thiện knowledge base',
      'Sử dụng ChatWidget (góc dưới phải) để test chatbot mọi lúc',
    ],
  });

  const getTeacherContent = () => ({
    overview: {
      title: 'Hướng dẫn sử dụng cho Giáo viên',
      description: 'Là Giáo viên, bạn có thể đặt mượn máy chiếu, xem lịch sử, đánh giá thiết bị và gửi yêu cầu hỗ trợ kỹ thuật.',
      features: [
        'Đặt mượn máy chiếu theo thời gian',
        'Xem thời gian biểu các lịch đặt của mình và lịch chung',
        'Đánh giá thiết bị sau khi sử dụng',
        'Gửi yêu cầu hỗ trợ kỹ thuật khi gặp sự cố',
        'Sử dụng Trợ lý AI (ChatWidget) để được hỗ trợ 24/7',
        'Đóng góp cải thiện AI bằng Like/Dislike trên câu trả lời',
      ],
    },
    guides: [
      {
        key: 'booking',
        icon: <BookOutlined />,
        title: 'Đặt mượn Thiết bị',
        steps: [
          {
            title: 'Tạo lịch đặt mới',
            description: 'Vào "Đặt mượn" → Nhấn "Đặt mượn mới" → Chọn thiết bị (chỉ hiển thị thiết bị "Sẵn sàng") → Chọn thời gian bắt đầu và kết thúc → Nhập mục đích sử dụng → Nhấn "Gửi yêu cầu"',
          },
          {
            title: 'Kiểm tra tính khả dụng',
            description: 'Hệ thống sẽ tự động kiểm tra xem thiết bị có trống trong khung giờ bạn chọn không. Nếu bị trùng, bạn cần chọn thiết bị khác hoặc thời gian khác',
          },
          {
            title: 'Theo dõi trạng thái',
            description: 'Sau khi gửi, lịch đặt sẽ ở trạng thái "Chờ duyệt". Admin sẽ phê duyệt và bạn nhận được thông báo qua hệ thống',
          },
          {
            title: 'Hủy lịch đặt',
            description: 'Chỉ có thể hủy lịch đặt đang ở trạng thái "Chờ duyệt". Nếu đã được duyệt, cần liên hệ Admin',
          },
        ],
      },
      {
        key: 'schedule',
        icon: <RocketOutlined />,
        title: 'Xem Thời gian biểu',
        steps: [
          {
            title: 'Xem lịch của tôi',
            description: 'Vào "Thời gian biểu" → Tab "Lịch của tôi" → Xem tất cả lịch đặt của bạn trong tuần hiện tại, màu sắc phân biệt theo thiết bị',
          },
          {
            title: 'Xem lịch chung',
            description: 'Tab "Lịch chung" → Chọn thiết bị → Xem ai đang đặt thiết bị đó, màu sắc phân biệt theo người dùng',
          },
          {
            title: 'Lịch bảo trì',
            description: 'Các ô màu vàng cam (🔧) là lịch bảo trì của kỹ thuật viên. Thiết bị không thể đặt trong thời gian này',
          },
        ],
      },
      {
        key: 'review',
        icon: <CheckCircleOutlined />,
        title: 'Đánh giá Thiết bị',
        steps: [
          {
            title: 'Tạo đánh giá',
            description: 'Vào "Đánh giá thiết bị" → Chọn lịch đặt đã hoàn thành → Chọn số sao (1-5) → Nhập nhận xét (không bắt buộc) → Nhấn "Gửi đánh giá"',
          },
          {
            title: 'Xem đánh giá',
            description: 'Xem danh sách các đánh giá đã gửi, có thể sửa hoặc xóa đánh giá',
          },
          {
            title: 'Ý nghĩa số sao',
            description: '5 sao: Rất tốt, 4 sao: Tốt, 3 sao: Trung bình, 2 sao: Kém, 1 sao: Rất kém',
          },
        ],
      },
      {
        key: 'support',
        icon: <WarningOutlined />,
        title: 'Yêu cầu Hỗ trợ',
        steps: [
          {
            title: 'Tạo yêu cầu hỗ trợ',
            description: 'Vào "Yêu cầu hỗ trợ kỹ thuật" → Nhấn "Tạo yêu cầu" → Điền tiêu đề, mô tả chi tiết → Chọn loại (Sửa chữa/Bảo trì) → Chọn mức độ ưu tiên → Chọn thiết bị (nếu có) → Nhấn "Gửi"',
          },
          {
            title: 'Theo dõi yêu cầu',
            description: 'Xem các tab: Tất cả, Chờ xử lý, Đang xử lý, Đã hoàn thành. Cột "Người xử lý" hiển thị kỹ thuật viên được phân công',
          },
          {
            title: 'Xóa yêu cầu',
            description: 'Chỉ có thể xóa yêu cầu đang ở trạng thái "Chờ xử lý"',
          },
        ],
      },
      {
        key: 'chatbot',
        icon: <MessageOutlined />,
        title: 'Sử dụng Trợ lý AI',
        steps: [
          {
            title: 'Mở ChatWidget',
            description: 'Nhấn vào icon AI (hình robot) ở góc dưới bên phải màn hình. Widget có sẵn trên mọi trang trong hệ thống',
          },
          {
            title: 'Đặt câu hỏi',
            description: 'Gõ câu hỏi về thiết bị, lịch đặt, quy trình sử dụng hoặc bất kỳ thông tin nào. AI sẽ tự động tìm và trả lời dựa trên knowledge base',
          },
          {
            title: 'Đánh giá câu trả lời',
            description: 'Sau mỗi câu trả lời, nhấn nút Like (👍) nếu hữu ích hoặc Dislike (👎) nếu chưa chính xác. Feedback của bạn giúp AI học và cải thiện',
          },
          {
            title: 'Xem badge thông báo',
            description: 'Badge màu đỏ trên icon AI cho biết số tin nhắn chưa đọc. Nhấn vào để mở widget',
          },
        ],
      },
    ],
    tips: [
      'Đặt lịch trước ít nhất 1 ngày để Admin có thời gian phê duyệt',
      'Kiểm tra thời gian biểu trước khi đặt để tránh trùng lịch',
      'Đánh giá thiết bị sau khi sử dụng để giúp cải thiện chất lượng',
      'Mô tả chi tiết khi tạo yêu cầu hỗ trợ để kỹ thuật viên xử lý nhanh hơn',
      'Click vào icon AI (góc dưới phải) để chat với trợ lý thông minh',
      'Đánh giá Like/Dislike sau mỗi câu trả lời để AI học và cải thiện',
      'ChatWidget có sẵn trên mọi trang, sử dụng bất cứ khi nào cần',
    ],
  });

  const getTechnicianContent = () => ({
    overview: {
      title: 'Hướng dẫn cho Kỹ thuật viên',
      description: 'Là Kỹ thuật viên, bạn có trách nhiệm xử lý các yêu cầu hỗ trợ, bảo trì thiết bị và cập nhật trạng thái thiết bị.',
      features: [
        'Xem các yêu cầu hỗ trợ được phân công',
        'Cập nhật trạng thái yêu cầu và thiết bị',
        'Xem lịch bảo trì theo calendar',
        'Quản lý và cập nhật trạng thái thiết bị',
        'Xem lịch sử công việc đã hoàn thành',
        'Sử dụng ChatWidget AI để tra cứu thông tin nhanh',
      ],
    },
    guides: [
      {
        key: 'dashboard',
        icon: <RocketOutlined />,
        title: 'Dashboard - Tổng quan',
        steps: [
          {
            title: 'Xem thống kê',
            description: '4 thẻ thống kê hiển thị: Đang chờ xử lý, Đang xử lý, Đã hoàn thành, Lịch hôm nay',
          },
          {
            title: 'Yêu cầu khẩn cấp',
            description: 'Bảng hiển thị các yêu cầu có mức độ "Khẩn cấp" cần xử lý ngay',
          },
          {
            title: 'Lịch bảo trì hôm nay',
            description: 'Hiển thị các công việc bảo trì được lên lịch trong ngày',
          },
        ],
      },
      {
        key: 'assignments',
        icon: <ToolOutlined />,
        title: 'Yêu cầu được phân công',
        steps: [
          {
            title: 'Xem danh sách',
            description: 'Vào "Yêu cầu được phân công" → Xem các tab: Tất cả, Chờ xử lý, Đang xử lý, Đã hoàn thành',
          },
          {
            title: 'Xem chi tiết',
            description: 'Nhấn "Chi tiết" để xem đầy đủ thông tin: người yêu cầu, thiết bị, mô tả, lịch bảo trì',
          },
          {
            title: 'Cập nhật trạng thái',
            description: 'Nhấn "Cập nhật" → Chọn trạng thái mới (Đang xử lý/Đã hoàn thành) → Chọn trạng thái thiết bị (Sẵn sàng/Bảo trì/Hỏng) → Nhập ghi chú → Nhấn "Cập nhật"',
          },
          {
            title: 'Hoàn thành công việc',
            description: 'Sau khi sửa xong, đổi trạng thái thành "Đã hoàn thành" và cập nhật trạng thái thiết bị về "Sẵn sàng" (nếu đã sửa xong) hoặc "Hỏng" (nếu không sửa được)',
          },
        ],
      },
      {
        key: 'schedule',
        icon: <BookOutlined />,
        title: 'Lịch Bảo trì',
        steps: [
          {
            title: 'Xem lịch theo tháng',
            description: 'Vào "Lịch bảo trì" → Calendar hiển thị các lịch bảo trì trong tháng với badge màu (đỏ: khẩn cấp, vàng: bình thường)',
          },
          {
            title: 'Xem chi tiết ngày',
            description: 'Click vào ngày có lịch → Modal hiển thị tất cả công việc trong ngày: thời gian, thiết bị, vị trí, người yêu cầu, mô tả',
          },
        ],
      },
      {
        key: 'devices',
        icon: <SafetyOutlined />,
        title: 'Quản lý Thiết bị',
        steps: [
          {
            title: 'Xem danh sách thiết bị',
            description: 'Vào "Quản lý thiết bị" → Xem tất cả thiết bị với thông tin: tên, model, số serial, vị trí, trạng thái, thời gian sử dụng, bảo trì lần cuối, bảo hành',
          },
          {
            title: 'Tìm kiếm và lọc',
            description: 'Sử dụng ô tìm kiếm để tìm theo tên, model, phòng. Lọc theo trạng thái: Tất cả/Sẵn sàng/Bảo trì/Hỏng',
          },
          {
            title: 'Cập nhật trạng thái',
            description: 'Nhấn "Cập nhật" → Chọn trạng thái mới → Nhấn "Cập nhật". Nếu đổi về "Sẵn sàng", ngày bảo trì sẽ tự động cập nhật',
          },
        ],
      },
      {
        key: 'history',
        icon: <CheckCircleOutlined />,
        title: 'Lịch sử Công việc',
        steps: [
          {
            title: 'Xem thống kê',
            description: '3 thẻ hiển thị: Tổng công việc, Số lượng sửa chữa, Số lượng bảo trì',
          },
          {
            title: 'Lọc theo loại và thời gian',
            description: 'Chọn loại công việc (Tất cả/Sửa chữa/Bảo trì) và khoảng thời gian để xem lịch sử',
          },
          {
            title: 'Xem chi tiết',
            description: 'Bảng hiển thị: tiêu đề, loại, người yêu cầu, thiết bị, ưu tiên, ngày nhận, ngày hoàn thành, ghi chú',
          },
        ],
      },
    ],
    tips: [
      'Ưu tiên xử lý yêu cầu "Khẩn cấp" trước',
      'Cập nhật trạng thái công việc thường xuyên để Admin và Teacher biết tiến độ',
      'Ghi chú chi tiết về công việc đã làm để có thể tra cứu sau này',
      'Kiểm tra lịch bảo trì hàng ngày để không bỏ lỡ công việc',
      'Cập nhật trạng thái thiết bị ngay sau khi hoàn thành sửa chữa/bảo trì',
      'Dùng ChatWidget AI để tra cứu lịch sử sửa chữa hoặc thông số thiết bị',
      'Đánh giá feedback AI để cải thiện chất lượng tra cứu thông tin',
    ],
  });

  const getCurrentContent = () => {
    if (!userInfo) return null;
    switch (userInfo.role) {
      case 'admin':
        return getAdminContent();
      case 'teacher':
        return getTeacherContent();
      case 'technician':
        return getTechnicianContent();
      default:
        return null;
    }
  };

  const getRoleInfo = () => {
    if (!userInfo) return { title: '', color: '', icon: null };
    switch (userInfo.role) {
      case 'admin':
        return { title: 'Quản trị viên', color: '#1677ff', icon: <SafetyOutlined /> };
      case 'teacher':
        return { title: 'Giáo viên', color: '#52c41a', icon: <UserOutlined /> };
      case 'technician':
        return { title: 'Kỹ thuật viên', color: '#faad14', icon: <ToolOutlined /> };
      default:
        return { title: '', color: '', icon: null };
    }
  };

  const content = getCurrentContent();
  const roleInfo = getRoleInfo();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!content) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải hướng dẫn sử dụng"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <QuestionCircleOutlined style={{ marginRight: 8, color: roleInfo.color }} />
          Trợ giúp & Hướng dẫn
        </Title>
        <Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
          <Tag color={roleInfo.color} icon={roleInfo.icon}>
            {roleInfo.title}
          </Tag>
          Xin chào <strong>{userInfo?.fullName}</strong>! Dưới đây là hướng dẫn sử dụng hệ thống dành cho bạn.
        </Paragraph>
      </div>

      {/* Overview */}
      <Card className={styles.overviewCard}>
        <div className={styles.overview}>
          <div className={styles.overviewHeader}>
            <InfoCircleOutlined style={{ fontSize: 24, color: roleInfo.color }} />
            <Title level={3} style={{ margin: 0 }}>{content.overview.title}</Title>
          </div>
          <Paragraph className={styles.overviewDescription}>
            {content.overview.description}
          </Paragraph>
          <div className={styles.features}>
            <Text strong>Chức năng chính:</Text>
            <ul>
              {content.overview.features.map((feature, index) => (
                <li key={index}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Guides */}
      <Card title={
        <span>
          <BookOutlined style={{ marginRight: 8, color: roleInfo.color }} />
          Hướng dẫn chi tiết
        </span>
      } className={styles.guidesCard}>
        <Collapse 
          accordion 
          className={styles.collapse}
          expandIconPosition="end"
        >
          {content.guides.map((guide, index) => (
            <Panel
              key={guide.key}
              header={
                <div className={styles.panelHeader}>
                  <span className={styles.panelIcon}>{guide.icon}</span>
                  <span className={styles.panelTitle}>{guide.title}</span>
                </div>
              }
            >
              <Steps
                direction="vertical"
                current={-1}
                items={guide.steps.map((step, stepIndex) => ({
                  title: <Text strong>{step.title}</Text>,
                  description: <Paragraph className={styles.stepDescription}>{step.description}</Paragraph>,
                  icon: <div className={styles.stepNumber}>{stepIndex + 1}</div>,
                }))}
              />
            </Panel>
          ))}
        </Collapse>
      </Card>

      {/* Tips */}
      <Card 
        title={
          <span>
            <RocketOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Mẹo sử dụng hiệu quả
          </span>
        }
        className={styles.tipsCard}
      >
        <ul className={styles.tipsList}>
          {content.tips.map((tip, index) => (
            <li key={index}>
              <CheckCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      {/* Contact */}
      <Alert
        message="Cần hỗ trợ thêm?"
        description="Nếu bạn cần hỗ trợ thêm hoặc gặp vấn đề khi sử dụng hệ thống, vui lòng liên hệ với quản trị viên qua email hoặc sử dụng chức năng Yêu cầu hỗ trợ kỹ thuật."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className={styles.contactAlert}
      />
    </div>
  );
}

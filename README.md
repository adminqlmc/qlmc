# QLMC - Hệ thống Quản lý Máy Chiếu

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Python](https://img.shields.io/badge/Python-3.11.10-3776AB?style=for-the-badge&logo=python)
![Ant Design](https://img.shields.io/badge/Ant_Design-5.27.5-0170FE?style=for-the-badge&logo=ant-design)

**Hệ thống quản lý máy chiếu thông minh với AI Assistant**

[Tính năng](#-tính-năng-chính) • [Cài đặt](#-cài-đặt) • [Cấu trúc](#-cấu-trúc-project) • [API](#-api-endpoints)

</div>

---

## Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu trúc Project](#-cấu-trúc-project)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Scripts](#-scripts)
- [Deployment](#-deployment)

---

## Giới thiệu

**QLMC** là hệ thống quản lý máy chiếu toàn diện cho các trường học, tích hợp công nghệ AI để hỗ trợ người dùng 24/7. Hệ thống giúp tối ưu hóa việc đặt mượn, bảo trì và theo dõi tình trạng thiết bị một cách hiệu quả.

### Điểm nổi bật

-  **AI Assistant thông minh** - ChatWidget với khả năng tự học từ feedback người dùng
-  **Dashboard trực quan** - Thống kê real-time cho từng vai trò
-  **Quản lý booking** - Đặt lịch, phê duyệt và theo dõi tự động
-  **Bảo trì thiết bị** - Lên lịch và quản lý công việc kỹ thuật
-  **Thống kê chi tiết** - Biểu đồ sử dụng thiết bị, đánh giá và báo cáo
-  **Giao diện hiện đại** - Responsive, thân thiện với người dùng

---

## Tính năng chính

### Phân quyền theo vai trò

#### **Admin (Quản trị viên)**
- ✅ Quản lý thiết bị (CRUD, cập nhật trạng thái)
- ✅ Quản lý người dùng (thêm, sửa, xóa, phân quyền)
- ✅ Phê duyệt/từ chối lịch đặt
- ✅ Xem thống kê sử dụng thiết bị (biểu đồ, báo cáo)
- ✅ Quản lý yêu cầu hỗ trợ và phân công kỹ thuật viên
- ✅ **AI Learning History**: Xem logs học tập hàng ngày với top questions
- ✅ **AI Feedback Analytics**: Thống kê Like/Dislike ratio, trends
- ✅ Train AI với knowledge base mới
- ✅ Liên kết tài khoản Google OAuth (email recovery)

#### **Teacher (Giáo viên)**
- ✅ Đặt mượn máy chiếu theo thời gian
- ✅ Xem lịch đặt của mình và lịch chung
- ✅ Đánh giá thiết bị sau khi sử dụng (1-5 sao + nhận xét)
- ✅ Gửi yêu cầu hỗ trợ kỹ thuật với priority levels
- ✅ Sử dụng AI Assistant 24/7 (hỏi đáp, hướng dẫn)
- ✅ Feedback AI responses (Like/Dislike) để cải thiện chất lượng
- ✅ Quên mật khẩu: Reset qua email với OTP verification
- ✅ Liên kết tài khoản Google OAuth (email recovery)

#### **Technician (Kỹ thuật viên)**
- ✅ Xem yêu cầu hỗ trợ được phân công
- ✅ Cập nhật trạng thái công việc (Pending → In Progress → Resolved)
- ✅ Quản lý và cập nhật trạng thái thiết bị
- ✅ Xem lịch bảo trì theo calendar
- ✅ Xem lịch sử công việc đã hoàn thành
- ✅ Liên kết tài khoản Google OAuth (email recovery)

### AI Assistant & Tự Học

- **ChatWidget tích hợp** trên mọi trang với UI hiện đại
- **RAG (Retrieval Augmented Generation)** với FAISS vector search
- **Feedback system** (Like/Dislike) để đánh giá câu trả lời
- **Real-time learning**: Feedback ngay lập tức cập nhật điểm số
- **Daily batch learning** (00:00 hàng ngày): Phân tích toàn diện
- **Exponential Moving Average**: Cân bằng historical data (70%) và feedback mới (30%)
- **MongoDB Persistence**: FAISS index được lưu trữ lâu dài, không mất khi restart
- **Search re-ranking**: Documents có feedback tốt xuất hiện trên đầu
- **Admin Analytics**: Dashboard xem learning logs và top questions

### Thống kê & Báo cáo

- Biểu đồ thời gian sử dụng thiết bị (Bar chart)
- Biểu đồ trạng thái thiết bị (Pie chart)
- Biểu đồ đánh giá người dùng (Pie chart)
- Lịch sử AI Learning với top questions
- Analytics feedback chatbot (Like/Dislike ratio)

---

## Công nghệ sử dụng

### Frontend
- **Next.js 15.5.6** - React framework với App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Ant Design 5.27.5** - UI components
- **Recharts 3.3.0** - Data visualization
- **Day.js 1.11.18** - Date manipulation
- **SWR 2.3.6** - Data fetching & caching
- **Zod 3.23.8** - Schema validation

### Backend (Next.js)
- **Next.js API Routes** - RESTful API
- **Prisma 5.22.0** - ORM với MongoDB
- **MongoDB 5.5** - Database driver
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Bcrypt.js 2.4.3** - Password hashing
- **Nodemailer 6.9.13** - Email verification
- **Google OAuth 2.0** - Social login

### AI Backend (Python 3.11.10)
- **FastAPI 0.115.0** - Python web framework
- **Uvicorn 0.30.6** - ASGI server
- **FAISS-CPU 1.12.0** - Vector search engine
- **Transformers 4.46.1** - Hugging Face models (384-dim embeddings)
- **Google Generative AI** - LLM (Gemini)
- **PyMongo 4.6.0** - MongoDB driver cho persistence
- **PyTorch 2.4.1** - Deep learning framework
- **Pydantic 2.9.2** - Data validation
- **NumPy 1.26.4** - Numerical computing

### DevOps & Deployment
- **Vercel** - Frontend hosting với Cron Jobs
- **Render** - Python backend hosting
- **MongoDB Atlas** - Cloud database
- **Vercel Cron** - Daily AI learning scheduler
- **Node-cron** - Local cron scheduler

---

## Yêu cầu hệ thống

### Bắt buộc
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 hoặc **yarn** >= 1.22.0
- **MongoDB Atlas Account** (miễn phí tại mongodb.com/cloud/atlas)
- **Python** 3.9 - 3.11 (khuyến nghị: 3.11.10)
- **Google Gemini API Key** (miễn phí tại ai.google.dev)

### Khuyến nghị
- **RAM**: >= 8GB (16GB cho AI training)
- **Disk**: >= 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **GPU**: Optional (CUDA-compatible cho faster AI inference)

---

## Cài đặt

### Bước 1: Clone Repository từ GitHub

```bash
# Clone project về máy
git clone https://github.com/tpd0905/qlmc.git

# Di chuyển vào thư mục project
cd qlmc
```

---

### Bước 2: Cài đặt Dependencies Frontend (Next.js)

```bash
# Cài đặt tất cả dependencies Node.js
npm install

# Hoặc nếu dùng yarn:
# yarn install
```

> **Lưu ý**: Quá trình này có thể mất 3-5 phút tùy tốc độ mạng

---

### Bước 3: Cấu hình Database

#### 3.1. Tạo MongoDB Atlas Cluster (Miễn phí)

1. Đăng ký tại https://www.mongodb.com/cloud/atlas
2. Tạo Cluster miễn phí (M0 Sandbox)
3. Whitelist IP: `0.0.0.0/0` (cho phép tất cả)
4. Tạo Database User với username/password
5. Copy Connection String

#### 3.2. Cấu hình `.env` cho Next.js

**Tạo file `.env` trong thư mục gốc project:**

```bash
# Windows (PowerShell):
New-Item .env -ItemType File

# macOS/Linux:
touch .env
```

**Mở file `.env` và dán nội dung sau:**

```env
# MongoDB Atlas Connection
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/qlmc?retryWrites=true&w=majority"

# JWT Secret (đổi thành chuỗi ngẫu nhiên mạnh)
JWT_SECRET="your-super-secret-jwt-key-change-me-in-production"

# Cron Secret (bảo vệ daily AI learning endpoint)
CRON_SECRET="your-cron-secret-key-change-me"

# Email Configuration (Gmail SMTP)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
EMAIL_FROM="QLMC System <your-email@gmail.com>"

# Google OAuth 2.0 (Optional - cho social login)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Python Backend URL
NEXT_PUBLIC_PYTHON_BACKEND_URL="http://127.0.0.1:8001"
PY_CHATBOT_URL="http://127.0.0.1:8001"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **⚠️ QUAN TRỌNG**: 
> - Thay `<username>`, `<password>`, `cluster0.xxxxx` bằng thông tin MongoDB của bạn
> - Đổi `JWT_SECRET` và `CRON_SECRET` thành chuỗi bí mật mạnh
> - Email config là **tùy chọn** (nếu không cần reset password qua email)

#### 3.3. Cấu hình Python Backend `.env`

**Tạo file `py-chatbot/.env`:**

```bash
# Windows (PowerShell):
cd py-chatbot; New-Item .env -ItemType File; cd ..

# macOS/Linux:
touch py-chatbot/.env
```

**Mở file `py-chatbot/.env` và dán nội dung sau:**

```env
# Google Gemini API Key (MIỄN PHÍ tại ai.google.dev)
# Hướng dẫn lấy API key:
# 1. Truy cập https://ai.google.dev/
# 2. Click "Get API key" → "Create API key"
# 3. Copy key và paste vào đây
GOOGLE_API_KEY="your-gemini-api-key-here"

# MongoDB Connection (dùng CHUNG với Next.js - copy từ .env chính)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/qlmc?retryWrites=true&w=majority"
MONGODB_DB_NAME="qlmc"

# Next.js API URL (để lấy/lưu FAISS index)
NEXTJS_API_URL="http://localhost:3000"
```

> **⚠️ QUAN TRỌNG**: 
> - GOOGLE_API_KEY là BẮT BUỘC để chatbot hoạt động
> - MONGODB_URI phải GIỐNG CHÍNH XÁC với DATABASE_URL trong `.env` chính

---

### Bước 4: Setup Database Schema

**Quay về thư mục gốc project:**

```bash
# Nếu đang ở trong thư mục khác
cd d:\file\project\qlmc
# hoặc macOS/Linux:
# cd ~/qlmc
```

**Chạy các lệnh sau theo thứ tự:**

```bash
# 1. Generate Prisma Client (tạo TypeScript types)
npx prisma generate

# 2. Push schema to MongoDB (tạo collections)
npx prisma db push

# 3. Seed database với dữ liệu mẫu (users, projectors, etc.)
npm run seed
```

**Output mong đợi:**
- ✅ Prisma Client generated successfully
- ✅ Database synchronized
- ✅ Seeded: 3 users, 5 projectors, 3 bookings, etc.

> **💡 Lưu ý**: MongoDB không dùng migrations như SQL. Prisma sẽ tự động sync schema.

---

### Bước 5: Cài đặt Python AI Backend

#### 5.1. Tạo Virtual Environment

```bash
# Di chuyển vào thư mục Python backend
cd py-chatbot

# Tạo virtual environment
python -m venv .venv
```

#### 5.2. Kích hoạt Virtual Environment

```bash
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Windows (CMD):
.venv\Scripts\activate.bat

# macOS/Linux:
source .venv/bin/activate
```

**Kiểm tra virtual environment đã active:**
- Windows: Prompt sẽ hiện `(.venv)` ở đầu dòng
- macOS/Linux: Terminal sẽ hiện `(.venv)` ở đầu dòng

#### 5.3. Cài đặt Python Dependencies

```bash
# Upgrade pip trước (khuyến nghị)
pip install --upgrade pip

# Cài đặt tất cả dependencies
pip install -r requirements.txt
```

**Packages sẽ được cài (từ requirements.txt):**
- FastAPI 0.115.0 - Web framework
- Uvicorn 0.30.6 - ASGI server
- Transformers 4.46.1 - Hugging Face models
- FAISS-CPU 1.12.0 - Vector search
- PyTorch 2.4.1 - Deep learning (CPU version)
- PyMongo 4.6.0 - MongoDB driver
- Pydantic 2.9.2 - Data validation
- NumPy 1.26.4 - Numerical computing

> **⏱️ Thời gian**: Quá trình này mất 5-10 phút, đặc biệt PyTorch (~800MB)

#### 5.4. Train AI với Knowledge Base

```bash
# Đảm bảo đang trong thư mục py-chatbot và venv đã active
# Quay về thư mục gốc để import app.main
cd ..

# Train AI lần đầu (tạo FAISS index)
python -c "import sys; sys.path.insert(0, 'py-chatbot'); import app.main; print('✅ Training complete!')"
```

**Output mong đợi:**
```
Loading sentence transformer model...
Building FAISS index from knowledge base...
Index built with X documents
Saving FAISS index to MongoDB...
✅ Training complete!
```

> **💾 Lưu trữ**: FAISS index sẽ được lưu vào MongoDB collection `FAISSIndex` tự động

---

### Bước 6: Khởi động Development Server

#### Option 1: Tự động - Concurrently (Khuyến nghị) ⭐

**Quay về thư mục gốc project:**

```bash
# Từ thư mục py-chatbot
cd ..

# Hoặc từ bất kỳ đâu:
cd d:\file\project\qlmc  # Windows
# cd ~/qlmc  # macOS/Linux
```

**Chạy lệnh:**

```bash
npm run dev
```

**Lệnh này sẽ tự động khởi động đồng thời:**
- 🌐 Next.js dev server (port 3000) - màu xanh dương
- 🤖 Python FastAPI server (port 8001) - màu magenta

**Output mong đợi:**
```
[web] ▲ Next.js 15.5.6
[web] - Local: http://localhost:3000
[ai] INFO: Uvicorn running on http://127.0.0.1:8001
[ai] INFO: Application startup complete
```

#### Option 2: Thủ công - 2 Terminals riêng biệt

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev:next
# hoặc: next dev
```

**Terminal 2 - Python AI Backend:**
```bash
cd py-chatbot

# Windows PowerShell:
.venv\Scripts\Activate.ps1

# macOS/Linux:
source .venv/bin/activate

# Chạy server
python -m uvicorn app.main:app --reload --port 8001
```

---

### Bước 7: Truy cập và Kiểm tra Ứng dụng

#### 7.1. Mở trình duyệt và truy cập:

- **🏠 Frontend Application**: http://localhost:3000
- **📚 Python API Docs (Swagger)**: http://127.0.0.1:8001/docs
- **🔄 Python API Redoc**: http://127.0.0.1:8001/redoc

#### 7.2. Test kết nối:

**Kiểm tra Next.js API:**
```bash
curl http://localhost:3000/api/auth/check
```

**Kiểm tra Python Backend:**
```bash
curl http://127.0.0.1:8001/health
# hoặc
curl http://127.0.0.1:8001/
```

#### 7.3. Đăng nhập lần đầu:

1. Truy cập http://localhost:3000/login
2. Sử dụng tài khoản mặc định (xem mục [Tài khoản mặc định](#-tài-khoản-mặc-định)):
   ```
   Email: admin@example.com
   Password: ab1234@
   ```
3. Explore dashboard và test ChatWidget ở góc dưới bên phải! 🤖

> **🎉 Chúc mừng!** Bạn đã setup thành công hệ thống QLMC!

---

## Cấu trúc Project

```
qlmc/
├── prisma/                    # Database schema & migrations
│   ├── schema.prisma         # Prisma schema definition
│   ├── seed.ts               # Database seeding script
│   └── migrations/           # Migration files
│
├── py-chatbot/               # Python AI Backend (FastAPI)
│   ├── app/                  # FastAPI application
│   │   ├── main.py          # Main FastAPI app
│   │   ├── chat.py          # Chat logic & RAG
│   │   └── knowledge.py     # Knowledge base management
│   ├── store/               # FAISS vector store
│   └── requirements.txt     # Python dependencies
│
├── scripts/                 # Automation scripts
│   ├── start-ai.js         # Start Python backend
│   ├── daily-ai-learning.js # Daily AI learning cron
│   └── generate_knowledge.py # Generate knowledge base
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/         # Admin pages
│   │   ├── teacher/       # Teacher pages
│   │   ├── technician/    # Technician pages
│   │   ├── api/           # API Routes
│   │   ├── help/          # Help & documentation
│   │   └── profile/       # User profile
│   │
│   ├── components/        # React components
│   │   ├── ChatWidget/    # AI ChatWidget
│   │   └── layouts/       # Layout components
│   │
│   ├── lib/              # Utility libraries
│   └── utils/           # Helper functions
│
├── public/              # Static files
├── .env                # Environment variables (git-ignored)
├── package.json        # Node dependencies
└── README.md          # This file
```

---

## Database Schema

### Core Models

#### **User**
- id, userID (unique), fullName, email, password
- role: admin | teacher | technician
- avatar, isActive

#### **Projector**
- id, name, model, serialNumber (unique)
- room, building
- status: available | maintenance | broken
- purchaseDate, warrantyExpiry, timeUsed

#### **Booking**
- projectorId, userId, startTime, endTime
- purpose, status: pending | approved | rejected | completed

#### **SupportRequest**
- userId, projectorId, title, description
- priority: low | medium | high | urgent
- status: pending | in_progress | resolved | closed
- scheduledStartTime, scheduledEndTime

#### **ChatbotFeedback**
- userId, question, answer
- feedback: "like" | "dislike"
- sources: JSON array of document IDs
- createdAt

#### **AILearningLog**
- totalFeedback, likeCount, dislikeCount
- documentsUpdated: số documents đã update scores
- topQuestions: JSON array [{question, count, avgScore}]
- improvements: JSON array of improvement notes
- learningDate

#### **FAISSIndex** (MongoDB Persistence)
- indexData: Base64-encoded FAISS binary
- metadata: JSON {docCount, dimension, createdBy}
- isActive: boolean
- createdAt, updatedAt

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check auth status
- `POST /api/auth/forgot-password/*` - Password recovery

### Admin APIs
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/bookings` - List bookings
- `PATCH /api/admin/bookings/[id]` - Approve/reject
- `GET /api/admin/statistics` - Statistics
- `POST /api/admin/support/assign` - Assign technician

### Chatbot & AI Learning APIs
- `POST /api/chat` - Send message to AI
- `POST /api/chatbot-feedback` - Submit like/dislike feedback
- `GET /api/chatbot-feedback` - Get all feedback (Admin only)
- `GET /api/admin/ai-learning-history` - Get learning logs
- `POST /api/admin/train` - Train AI với knowledge base mới
- `GET /api/faiss-index` - Get FAISS index từ MongoDB
- `POST /api/faiss-index` - Save FAISS index to MongoDB

### Cron Jobs
- `POST /api/cron/daily-ai-learning` - Daily AI learning (00:00)
  - Phân tích feedback 24h qua
  - Tính điểm documents (like=+1.0, dislike=-0.5)
  - Update Python backend với scores
  - Track top 10 questions
  - Save learning log to MongoDB

---

## Hướng dẫn sử dụng

### 1. Đăng nhập
Truy cập http://localhost:3000/login

### 2. Sử dụng ChatWidget
- Click icon AI ở góc dưới bên phải
- Gõ câu hỏi và nhấn Enter
- Đánh giá câu trả lời bằng 👍 hoặc 👎

### 3. Đặt lịch mượn máy chiếu (Teacher)
1. Vào `/teacher/booking`
2. Click "Đặt mượn mới"
3. Chọn thiết bị, thời gian, nhập mục đích
4. Gửi yêu cầu

### 4. Phê duyệt lịch đặt (Admin)
1. Vào `/admin/bookings`
2. Tab "Chờ duyệt"
3. Click "Duyệt" hoặc "Từ chối"

---

## Tài khoản mặc định

Sau khi chạy `npm run seed`:

### Admin
```
Email: admin@example.com
Password: ab1234@
UserID: QNU2579128
```

### Teacher
```
Email: teacher@gmail.com
Password: ab1234@
UserID: QNU8532553
```

### Technician
```
Email: technician@gmail.com
Password: ab1234@
UserID: QNU2127652
```

> **Lưu ý**: Đổi mật khẩu trong môi trường production!

---

## Scripts

```bash
# Development
npm run dev                # Start Next.js + Python backend (concurrently)
npm run dev:next          # Start Next.js only
npm run dev:ai            # Start Python backend only

# Database
npx prisma generate       # Generate Prisma Client
npx prisma db push        # Push schema to MongoDB
npx prisma studio         # Open Prisma Studio GUI
npm run seed              # Seed database với dữ liệu mẫu

# AI & Learning
npm run ai-learning       # Trigger daily AI learning manually
node scripts/daily-ai-learning.js  # Run cron scheduler locally

# Build & Production
npm run build             # Build for production
npm start                 # Start production server
```

---

## Deployment

### Production Setup

#### 1. Frontend (Vercel)
```bash
# Push to GitHub
git push origin main

# Import to Vercel
# 1. Vào vercel.com → Import Project
# 2. Connect GitHub repository
# 3. Add Environment Variables:
#    - DATABASE_URL (MongoDB Atlas)
#    - JWT_SECRET
#    - CRON_SECRET
#    - EMAIL_USER, EMAIL_PASS
#    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)
#    - NEXT_PUBLIC_PYTHON_BACKEND_URL (Render URL)
#    - NEXT_PUBLIC_APP_URL (Vercel URL)

# 4. Deploy
# Vercel Cron sẽ tự động chạy daily-ai-learning (00:00)
```

#### 2. Python Backend (Render)
```bash
# 1. Tạo account tại render.com
# 2. New Web Service → Connect GitHub repo
# 3. Settings:
#    - Root Directory: py-chatbot
#    - Build Command: pip install -r requirements.txt
#    - Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
# 4. Environment Variables:
#    - GOOGLE_API_KEY
#    - MONGODB_URI
#    - MONGODB_DB_NAME=qlmc
#    - NEXTJS_API_URL (Vercel URL)
# 5. Deploy
```

#### 3. Database (MongoDB Atlas)
- Whitelist Vercel IPs: `0.0.0.0/0`
- Whitelist Render IPs: `0.0.0.0/0`
- Connection string cho cả Next.js và Python

#### 4. Verify Deployment
```bash
# Test frontend
curl https://your-app.vercel.app/api/health

# Test Python backend
curl https://your-backend.onrender.com/health

# Test daily learning
curl -X POST https://your-app.vercel.app/api/cron/daily-ai-learning \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Environment Variables Summary

**Next.js (.env):**
```env
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="..."
CRON_SECRET="..."
EMAIL_USER="..."
EMAIL_PASS="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_PYTHON_BACKEND_URL="https://your-backend.onrender.com"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

**Python (py-chatbot/.env):**
```env
GOOGLE_API_KEY="..."
MONGODB_URI="mongodb+srv://..."
MONGODB_DB_NAME="qlmc"
NEXTJS_API_URL="https://your-app.vercel.app"
```

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│            (Browser: Chrome, Edge, Safari)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                         │
│                  (Vercel Deployment)                        │
│  - React 19 + TypeScript                                    │
│  - Ant Design UI Components                                 │
│  - ChatWidget (Real-time feedback)                          │
│  - JWT Authentication                                       │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
        ↓                      ↓
┌──────────────────┐   ┌──────────────────────────┐
│  NEXT.JS API     │   │   PYTHON AI BACKEND       │
│  (Serverless)    │   │   (Render Deployment)     │
│                  │   │                           │
│ • Auth APIs      │   │ • FastAPI                 │
│ • CRUD APIs      │   │ • FAISS Vector Search     │
│ • Cron Jobs      │   │ • Sentence Transformers   │
│ • Email (SMTP)   │   │ • Google Gemini LLM       │
│ • Google OAuth   │   │ • PyMongo                 │
└───────┬──────────┘   └───────┬───────────────────┘
        │                      │
        ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   MONGODB ATLAS                             │
│              (Cloud NoSQL Database)                         │
│                                                             │
│ Collections:                                                │
│ • User, Projector, Booking, Review                          │
│ • SupportRequest, Activity                                  │
│ • ChatbotFeedback, AILearningLog                            │
│ • FAISSIndex (Binary storage)                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: AI Self-Learning

```
1. User Chat → ChatWidget
2. ChatWidget → POST /api/chat → Python Backend
3. Python FAISS Search → Return answer + sources
4. User clicks 👍/👎 → POST /api/chatbot-feedback
5. Real-time: Update Python document scores (immediate)
6. Daily 00:00: Vercel Cron → POST /api/cron/daily-ai-learning
7. Analyze 24h feedback → Calculate avg scores
8. Batch update Python backend → EMA algorithm (0.7 old + 0.3 new)
9. Save to AILearningLog → Admin can view analytics
10. Next search: Documents with high scores rank higher
```

---

## Troubleshooting

### MongoDB Connection Error
```bash
# Kiểm tra connection string
# Đảm bảo whitelist IP: 0.0.0.0/0
# Kiểm tra username/password encode đúng (dùng encodeURIComponent)
```

### Python Backend Not Starting
```bash
# Kiểm tra virtual environment
cd py-chatbot
.venv\Scripts\activate  # Windows

# Cài lại dependencies
pip install -r requirements.txt

# Kiểm tra GOOGLE_API_KEY trong .env
```

### FAISS Index Not Loading
```bash
# Train lại từ đầu
cd py-chatbot
python -c "import app.main; print('OK')"

# Kiểm tra MongoDB có collection FAISSIndex không
# Hoặc xóa và train lại
```

### Daily Learning Không Chạy
```bash
# Kiểm tra Vercel Cron config trong vercel.json
# Hoặc chạy thủ công:
curl -X POST http://localhost:3000/api/cron/daily-ai-learning \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Contact

Project maintained by: **QLMC Team**

- **GitHub**: [tpd0905/qlmc](https://github.com/tpd0905/qlmc)
- **Issues**: [GitHub Issues](https://github.com/tpd0905/qlmc/issues)

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Ant Design](https://ant.design/) - Enterprise-class UI Design
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud Database
- [FAISS](https://github.com/facebookresearch/faiss) - Vector Search Engine
- [Google Gemini](https://ai.google.dev/) - Advanced AI Model
- [Vercel](https://vercel.com/) - Deployment Platform
- [Render](https://render.com/) - Python Backend Hosting

---

<div align="center">

**Made with ❤️ by QLMC Team**

⭐ Star this repo if you find it helpful!

</div>

# YT2FUTURE - BACKEND API 🚀

Hệ thống cung cấp dịch vụ xác thực, quản trị nội dung và dữ liệu thị trường cho YT2Future.

## 📝 Giới thiệu
Backend được xây dựng để xử lý các nghiệp vụ cốt lõi bao gồm quản lý người dùng (RBAC), lưu trữ bài viết phân tích và làm cầu nối (Bridge) lấy dữ liệu chứng khoán thời gian thực từ các nguồn dữ liệu tài chính.

## 💻 Công nghệ sử dụng
* **Runtime:** Node.js (Express.js)
* **Database:** PostgreSQL (via Supabase)
* **ORM:** Prisma
* **Authentication:** JWT & Supabase Auth
* **Storage:** Cloudinary (Quản lý hình ảnh/avatar)
* **Data Analysis:** Python (Thư viện vnstock)

## 📂 Cấu trúc thư mục
```text
backend/
├── src/
│   ├── api/            # Route handlers (Auth, Users, Posts, Market)
│   ├── middlewares/    # Kiểm tra Token, phân quyền Admin
│   ├── controllers/    # Xử lý logic nghiệp vụ chi tiết
│   ├── models/         # Cấu hình Prisma Schema & Database
│   └── utils/          # Hàm bổ trợ (Gửi mail, Upload Cloudinary)
├── python_scripts/     # Các script Python cào dữ liệu Vnstock
├── prisma/             # File cấu hình migration Database
├── .env                # Biến môi trường (Secret Keys, Database URL)
└── server.js           # Điểm khởi đầu của ứng dụng

© 2025 YT2Future - Shaping Tomorrow through agile innovation

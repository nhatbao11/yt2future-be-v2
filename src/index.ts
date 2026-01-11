import 'dotenv/config'; // LUÔN LUÔN Ở DÒNG 1
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload'; // THÊM THƯ VIỆN XỬ LÝ FILE
import { v2 as cloudinary } from 'cloudinary';

// Import Routes - GIỮ NGUYÊN TOÀN BỘ CỦA SẾP
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// A. CẤU HÌNH CLOUDINARY
cloudinary.config({
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: String(process.env.CLOUDINARY_API_KEY),
  api_secret: String(process.env.CLOUDINARY_API_SECRET),
});

console.log(">>> [System] Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME ? "READY" : "MISSING");

// B. MIDDLEWARES
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [process.env.FRONTEND_URL || 'https://yt2future.com', 'http://localhost:3000'];
    // Cho phép nếu:
    // 1. Không có origin (Postman/Server-to-Server)
    // 2. Nằm trong danh sách cứng (local, domain chính)
    // 3. Là subdomain của vercel.app (cho Preview Deploy)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Biến đi! CORS không cho phép.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// --- ĐOẠN FIX LỖI NẰM Ở ĐÂY ---
// Đưa fileUpload lên trước express.json() để tránh lỗi "Unexpected end of form"
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 20 * 1024 * 1024 }, // Tăng giới hạn lên 20MB cho thoải mái
  abortOnLimit: true,
  parseNested: true // Hỗ trợ bóc tách dữ liệu phức tạp tốt hơn
}));
// ------------------------------

app.use(express.json());

// C. ROUTES - GIỮ NGUYÊN KHÔNG THIẾU MỘT CHỮ
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes); // Đường dẫn này sẽ map với reportService bên FE
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.send('YT2Future API đang chạy với chế độ Cookie và Cloudinary sẵn sàng...');
});

// D. START SERVER VÀ FIX TIMEOUT
const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Chống đứt kết nối khi đang truyền file lớn
server.timeout = 600000;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // Đảm bảo đã npm i cookie-parser
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Cấu hình Cookie Parser
app.use(cookieParser());

// 2. Cấu hình CORS chặt chẽ để cho phép nhận/gửi Cookie
app.use(cors({
  origin: 'http://localhost:3000', // Địa chỉ Frontend
  credentials: true,               // BẮT BUỘC: Để trình duyệt chấp nhận Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());

// 3. Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Y&T Capital API đang chạy với chế độ Cookie an toàn...');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
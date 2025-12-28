import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import _slugify from 'slugify';

const prisma = new PrismaClient();
const slugify = _slugify as unknown as (string: string, options?: any) => string;

export const createReport = async (req: any, res: any) => {
  try {
    const { title, categoryId, description, status } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: "Sếp quên nhập tiêu đề báo cáo rồi!" });
    }

    // 1. Tạo slug tự động
    const rawSlug = slugify(title, {
      lower: true,
      locale: 'vi',
      strict: true
    });
    const slug = `${rawSlug}-${Date.now()}`;

    let thumbnail = "";
    let pdfUrl = "";

    // 2. XỬ LÝ FILE THEO HỆ express-fileupload (KHÔNG DÙNG MULTER NỮA)
    if (req.files) {
      // Xử lý Upload Ảnh đại diện (Thumbnail)
      if (req.files.thumbnail) {
        const thumbFile = req.files.thumbnail;
        // Upload trực tiếp từ đường dẫn tạm tempFilePath
        const result = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
          folder: "yt_reports/thumbnails"
        });
        thumbnail = result.secure_url;
      }

      // Xử lý Upload file PDF (pdfFile)
      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile;

        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
          folder: "yt_reports/pdf",
          resource_type: "raw", // Bắt buộc để nhận file không phải ảnh
          format: 'pdf',        // THÊM DÒNG NÀY: Ép Cloudinary nhận diện đuôi .pdf
          use_filename: true,   // Giữ tên file gốc của sếp
          unique_filename: false // Giúp link file nhìn đẹp hơn, không bị chèn mã loằng ngoằng
        });
        pdfUrl = result.secure_url;
      }
    }

    // 3. Lưu vào DB theo đúng Schema Prisma của sếp
    const newReport = await prisma.report.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        pdfUrl: pdfUrl || "",
        status: status || "PENDING",
        categoryId: Number(categoryId),
        userId: userId,
      }
    });

    res.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("Lỗi Controller:", error);
    res.status(500).json({ message: "Lỗi tạo báo cáo: " + error.message });
  }
};

// --- CÁC HÀM KHÁC GIỮ NGUYÊN LOGIC CỦA SẾP ---

export const getAllReportsAdmin = async (req: any, res: any) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        category: { select: { name: true } },
        user: { select: { fullName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách báo cáo sếp ơi!" });
  }
};

export const reviewReport = async (req: any, res: any) => {
  try {
    const { id, status } = req.body;
    const updated = await prisma.report.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, report: updated });
  } catch (error) {
    res.status(500).json({ message: "Lỗi duyệt bài" });
  }
};

export const getPublicReports = async (req: any, res: any) => {
  try {
    const { page = 1, categoryId, search = "" } = req.query;
    const limit = 6;
    const skip = (Number(page) - 1) * limit;

    const whereCondition: any = {
      status: "APPROVED",
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(search ? {
        title: { contains: String(search), mode: 'insensitive' }
      } : {})
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereCondition,
        include: {
          category: { select: { name: true } },
          user: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.report.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu công khai: " + error.message });
  }
};
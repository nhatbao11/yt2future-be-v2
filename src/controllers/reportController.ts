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
      console.log("DETECTED FILES:", Object.keys(req.files)); // DEBUG

      // Xử lý Upload Ảnh đại diện (Thumbnail)
      if (req.files.thumbnail) {
        const thumbFile = req.files.thumbnail;
        const result = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
          folder: "yt_reports/thumbnails"
        });
        thumbnail = result.secure_url;
      }

      // Xử lý Upload file PDF (pdfFile)
      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile;
        console.log("Uploading PDF (Raw - N/A):", pdfFile.name);

        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
          folder: "yt_reports/pdf",
          resource_type: "raw",
          use_filename: true,
          unique_filename: false
        });

        console.log("PDF Upload API Result:", result);
        pdfUrl = result.secure_url;
      }
    } else {
      console.log("NO FILES UPLOADED");
    }

    // 3. Lưu vào DB
    console.log("Saving Report with PDF URL:", pdfUrl);
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
    const { page = 1 } = req.query;
    const limit = 5;
    const skip = (Number(page) - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        include: {
          category: { select: { name: true } },
          user: { select: { fullName: true, avatarUrl: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.report.count()
    ]);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
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

export const deleteReport = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.report.delete({ where: { id } });
    res.json({ success: true, message: "Đã xóa báo cáo!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa báo cáo" });
  }
};

export const updateReport = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, categoryId, description } = req.body;

    const oldReport = await prisma.report.findUnique({ where: { id } });
    if (!oldReport) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    let updateData: any = {
      title,
      description,
      categoryId: Number(categoryId)
    };

    if (title && title !== oldReport.title) {
      const rawSlug = slugify(title, { lower: true, locale: 'vi', strict: true });
      updateData.slug = `${rawSlug}-${Date.now()}`;
    }

    if (req.files) {
      console.log("UPDATE FILES:", Object.keys(req.files));

      if (req.files.thumbnail) {
        const thumbFile = req.files.thumbnail;
        const result = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
          folder: "yt_reports/thumbnails"
        });
        updateData.thumbnail = result.secure_url;
      }

      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile;
        console.log("Updating PDF (Raw - N/A):", pdfFile.name);

        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
          folder: "yt_reports/pdf",
          resource_type: "raw",
          use_filename: true,
          unique_filename: false
        });

        console.log("Updated PDF URL:", result.secure_url);
        updateData.pdfUrl = result.secure_url;
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, report: updatedReport });
  } catch (error: any) {
    console.error("Lỗi update:", error);
    res.status(500).json({ message: "Lỗi cập nhật báo cáo" });
  }
};
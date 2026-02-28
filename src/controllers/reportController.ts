import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../lib/prisma.js';
import _slugify from 'slugify';
import fs from 'fs';

const slugify = _slugify as unknown as (string: string, options?: any) => string;

export const createReport = async (req: any, res: any) => {
  try {
    const { title, categoryId, description, status } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: req.t('report.titleRequired') });
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
        const result = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
          folder: "yt_reports/thumbnails"
        });
        thumbnail = result.secure_url;
        fs.unlink(thumbFile.tempFilePath, () => { }); // Xóa temp file sau upload
      }

      // Xử lý Upload file PDF (pdfFile)
      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile;
        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
          folder: "yt_reports/pdf",
          resource_type: "raw",
          use_filename: true,
          unique_filename: false
        });
        pdfUrl = result.secure_url;
        fs.unlink(pdfFile.tempFilePath, () => { }); // Xóa temp file sau upload
      }
    }

    // 3. Lưu vào DB
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

    res.json({ success: true, report: newReport, message: req.t('report.createSuccess') });
  } catch (error: any) {
    console.error("Lỗi Controller:", error);
    res.status(500).json({ message: req.t('report.createError', { error: error.message }) });
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
    res.status(500).json({ message: req.t('report.fetchError') });
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
    res.status(500).json({ message: req.t('report.reviewError') });
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
    res.status(500).json({ message: req.t('report.publicFetchError', { error: error.message }) });
  }
};

export const deleteReport = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.report.delete({ where: { id } });
    res.json({ success: true, message: req.t('report.deleteSuccess') });
  } catch (error) {
    res.status(500).json({ message: req.t('report.deleteError') });
  }
};

export const updateReport = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, categoryId, description } = req.body;

    const oldReport = await prisma.report.findUnique({ where: { id } });
    if (!oldReport) return res.status(404).json({ message: req.t('report.notFound') });

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
      if (req.files.thumbnail) {
        const thumbFile = req.files.thumbnail;
        const result = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
          folder: "yt_reports/thumbnails"
        });
        updateData.thumbnail = result.secure_url;
        fs.unlink(thumbFile.tempFilePath, () => { }); // Xóa temp file sau upload
      }

      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile;
        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
          folder: "yt_reports/pdf",
          resource_type: "raw",
          use_filename: true,
          unique_filename: false
        });
        updateData.pdfUrl = result.secure_url;
        fs.unlink(pdfFile.tempFilePath, () => { }); // Xóa temp file sau upload
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, report: updatedReport, message: req.t('report.updateSuccess') });
  } catch (error: any) {
    console.error("Lỗi update:", error);
    res.status(500).json({ message: req.t('report.updateError') });
  }
};
import { v2 as cloudinary } from 'cloudinary';
// SỬA TÊN BIẾN CHO KHỚP VỚI INDEX.TS
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});
export const uploadFile = async (req, res) => {
    try {
        // 1. Kiểm tra xem middleware fileUpload đã hoạt động chưa
        if (!req.files) {
            return res.status(400).json({ message: "Server không nhận được file nào!" });
        }
        // 2. Lấy file theo cấu trúc của express-fileupload
        // Sếp gửi từ FE là 'pdfFile' nên ở đây nhận đúng 'pdfFile'
        const pdfFile = req.files.pdfFile;
        const thumbFile = req.files.thumbnail;
        if (!pdfFile) {
            return res.status(400).json({ message: "Thiếu file PDF báo cáo sếp ơi!" });
        }
        // 3. Đẩy lên Cloudinary dùng tempFilePath (đường dẫn tạm của express-fileupload)
        const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
            folder: 'yt_reports_pdf',
            resource_type: "raw", // BẮT BUỘC để giữ định dạng .pdf
            use_filename: true,
            unique_filename: true
        });
        // 4. Trả về kết quả thành công
        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    }
    catch (error) {
        console.error("Lỗi Controller Upload:", error.message);
        res.status(500).json({
            success: false,
            message: "Lỗi xử lý file tại server: " + error.message
        });
    }
};
//# sourceMappingURL=uploadController.js.map
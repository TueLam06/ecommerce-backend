const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

// POST /api/products
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            category,
            stock,
            feature,
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                error: "Tên và giá sản phẩm là bắt buộc",
            });
        }

        let imageUrl = null;

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "ecommerce/products",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            imageUrl = result.secure_url;
        }

        res.status(201).json({
            message: "Tạo sản phẩm thành công",
            product: {
                name,
                price,
                description,
                category,
                stock,
                feature,
                image: imageUrl,
            },
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Upload sản phẩm thất bại",
        });
    }
});

module.exports = router;
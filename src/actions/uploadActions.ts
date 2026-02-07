"use server"

import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

export async function uploadToCloudinary(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    const file = formData.get("file") as File

    if (!file) {
        return { success: false, error: "Nenhum arquivo selecionado" }
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
        return { success: false, error: "Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF." }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Máximo 5MB." }
    }

    try {
        // Convert File to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")
        const dataUri = `data:${file.type};base64,${base64}`

        // Upload to Cloudinary with transformations
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "av-continua/membros",
            resource_type: "image",
            transformation: [
                { width: 500, height: 500, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        })

        return { success: true, url: result.secure_url }
    } catch (error) {
        console.error("Upload error:", error)
        return { success: false, error: "Erro ao fazer upload da imagem" }
    }
}

export async function deleteFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await cloudinary.uploader.destroy(publicId)
        return { success: true }
    } catch (error) {
        console.error("Delete error:", error)
        return { success: false, error: "Erro ao deletar imagem" }
    }
}

export async function uploadQuestaoImageToCloudinary(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    const file = formData.get("file") as File

    if (!file) {
        return { success: false, error: "Nenhum arquivo selecionado" }
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
        return { success: false, error: "Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF." }
    }

    // Validate file size (max 10MB for question images)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Máximo 10MB." }
    }

    try {
        // Convert File to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")
        const dataUri = `data:${file.type};base64,${base64}`

        // Upload to Cloudinary with higher quality for question images
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "av-continua/questoes",
            resource_type: "image",
            transformation: [
                { width: 1200, crop: "limit" },
                { quality: "auto:good" },
                { fetch_format: "auto" },
            ],
        })

        return { success: true, url: result.secure_url }
    } catch (error) {
        console.error("Upload error:", error)
        return { success: false, error: "Erro ao fazer upload da imagem" }
    }
}

export async function uploadPdfToCloudinary(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    const file = formData.get("file") as File

    if (!file) {
        return { success: false, error: "Nenhum arquivo selecionado" }
    }

    // Validate file type - only PDF
    if (file.type !== "application/pdf") {
        return { success: false, error: "Tipo de arquivo inválido. Envie apenas arquivos PDF." }
    }

    // Validate file size (max 10MB for PDFs)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Máximo 10MB." }
    }

    try {
        // Convert File to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")
        const dataUri = `data:${file.type};base64,${base64}`

        // Upload to Cloudinary - use 'image' resource type with page delivery for PDF viewing
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "av-continua/notas-fiscais",
            resource_type: "raw",
            type: "upload",
            access_mode: "public",
        })

        // Modify URL to allow inline viewing instead of download
        // Add fl_attachment:false flag to prevent forced download
        let viewableUrl = result.secure_url

        // For raw PDFs, we need to use a different approach
        // Replace /raw/upload/ with /raw/upload/fl_attachment:false/ to allow browser viewing
        if (viewableUrl.includes("/raw/upload/")) {
            viewableUrl = viewableUrl.replace("/raw/upload/", "/raw/upload/fl_attachment:false/")
        }

        return { success: true, url: viewableUrl }
    } catch (error) {
        console.error("Upload PDF error:", error)
        return { success: false, error: "Erro ao fazer upload do PDF" }
    }
}


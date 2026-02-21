import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ModerationResult {
    safe: boolean;
    message?: string;
    url?: string;
}

/**
 * Moderate and upload an image file. 
 * Optimized: Only uses 'nudity-2.0,offensive' for speed unless more are strictly needed.
 */
export const moderateAndUploadImage = async (
    filePath: string,
    carInfo?: { brand: string; model: string }
): Promise<ModerationResult> => {
    try {
        // 1. Moderate with Sightengine (Optimized models list for speed)
        const form = new FormData();
        form.append('media', fs.createReadStream(filePath));
        form.append('models', 'nudity-2.0,offensive'); // Removed slower ones like 'wad', 'scam'
        form.append('api_user', process.env.SIGHTENGINE_API_USER);
        form.append('api_secret', process.env.SIGHTENGINE_API_SECRET);

        // Parallelize hash calculation with moderation call if possible, 
        // but moderation usually takes longer so we'll just keep it clean.
        const [sightengineRes, fileBuffer] = await Promise.all([
            axios.post('https://api.sightengine.com/1.0/check.json', form, {
                headers: form.getHeaders(),
            }),
            fs.promises.readFile(filePath)
        ]);

        const data = sightengineRes.data;

        if (data.status === 'failure') {
            throw new Error(data.error.message || 'Sightengine moderation failed');
        }

        const isNude = data.nudity && (data.nudity.sexual_activity > 0.5 || data.nudity.sexual_display > 0.5 || data.nudity.erotica > 0.5);
        const isOffensive = data.offensive && data.offensive.prob > 0.5;

        if (isNude || isOffensive) {
            return {
                safe: false,
                message: 'La imagen fue rechazada por contenido inapropiado.',
            };
        }

        // 2. Calculate Hash for Deduplication
        const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const publicId = `img_${hash}`;

        // Create folder path based on car info
        const folder = carInfo
            ? `car-dealership/${carInfo.brand.toLowerCase()}-${carInfo.model.toLowerCase()}`
            : 'car-dealership/general';

        // 3. Upload to Cloudinary
        const uploadRes = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            public_id: publicId,
            overwrite: false,
            tags: ['car-dealership'],
            resource_type: 'auto'
        });

        console.log(`Image uploaded to Cloudinary: ${uploadRes.secure_url} (Folder: ${folder})`);

        return {
            safe: true,
            url: uploadRes.secure_url,
        };
    } catch (error: any) {
        console.error('Image processing error:', error);
        throw new Error(error.message || 'Error al procesar la imagen');
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

/**
 * List images in a specific folder or all.
 */
export const listLibraryImages = async (folder?: string): Promise<string[]> => {
    try {
        const options: any = {
            type: 'upload',
            max_results: 500,
        };

        if (folder) {
            options.prefix = folder.endsWith('/') ? folder : `${folder}/`;
        } else {
            options.prefix = 'car-dealership/';
        }

        const result = await cloudinary.api.resources(options);
        return result.resources.map((res: any) => res.secure_url);
    } catch (error) {
        console.error('Error listing library:', error);
        return [];
    }
};

/**
 * List all folders under car-dealership/
 */
export const listLibraryFolders = async (): Promise<string[]> => {
    try {
        // First check if car-dealership exists by trying to list its subfolders
        const result = await cloudinary.api.sub_folders('car-dealership');
        return result.folders.map((f: any) => f.path);
    } catch (error: any) {
        // If it fails with 404, it might be because the folder hasn't been created yet
        if (error.http_code === 404) {
            console.log('Folder car-dealership not found yet.');
            return [];
        }
        console.error('Error listing folders:', error);
        return [];
    }
};

/**
 * Moderate a URL. Optimized speed.
 */
export const moderateImageUrl = async (url: string): Promise<ModerationResult> => {
    try {
        const sightengineRes = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
                url: url,
                models: 'nudity-2.0,offensive',
                api_user: process.env.SIGHTENGINE_API_USER,
                api_secret: process.env.SIGHTENGINE_API_SECRET,
            },
        });

        const data = sightengineRes.data;
        if (isSafetyFailure(data)) {
            return { safe: false, message: 'La URL contiene contenido inapropiado.' };
        }

        return { safe: true, url: url };
    } catch (error: any) {
        console.error('URL moderation error:', error);
        throw new Error(error.message || 'Error al validar la URL');
    }
};

const isSafetyFailure = (data: any) => {
    if (data.status === 'failure') throw new Error(data.error.message);
    const isNude = data.nudity && (data.nudity.sexual_activity > 0.5 || data.nudity.sexual_display > 0.5 || data.nudity.erotica > 0.5);
    const isOffensive = data.offensive && data.offensive.prob > 0.5;
    return isNude || isOffensive;
};

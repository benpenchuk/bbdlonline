import { supabase } from '../config/supabaseClient';

/**
 * Image upload service for Supabase Storage
 */

const STORAGE_BUCKETS = {
  PLAYER_AVATARS: 'player-avatars',
  TEAM_LOGOS: 'team-logos',
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique filename for upload
 */
function generateFileName(originalName: string, prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

/**
 * Ensure storage bucket exists, create if it doesn't
 */
async function ensureBucketExists(bucketName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to list files in bucket to check if it exists
    const { error: listError } = await supabase.storage.from(bucketName).list('', { limit: 1 });
    
    // If bucket doesn't exist, we'll get an error
    if (listError && (listError.message.includes('not found') || listError.message.includes('Bucket'))) {
      return { 
        success: false, 
        error: `Storage bucket "${bucketName}" not found. Please create it in Supabase Storage settings.\n\n` +
               `Steps:\n` +
               `1. Go to your Supabase Dashboard\n` +
               `2. Navigate to Storage section\n` +
               `3. Click "New bucket"\n` +
               `4. Name it "${bucketName}"\n` +
               `5. Make sure "Public bucket" is enabled\n` +
               `6. Click "Create bucket"\n\n` +
               `See STORAGE_SETUP.md for detailed instructions.`
      };
    }
    
    return { success: true };
  } catch (error: any) {
    // If we can't check, assume it might exist and let upload try
    return { success: true };
  }
}

/**
 * Upload a player avatar image
 * @param file - The image file to upload
 * @param playerId - Optional player ID for organizing files
 * @returns Public URL of the uploaded image
 */
export async function uploadPlayerAvatar(
  file: File,
  playerId?: string
): Promise<{ url: string; error?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: '', error: validation.error };
  }

  try {
    // Check if bucket exists
    const bucketCheck = await ensureBucketExists(STORAGE_BUCKETS.PLAYER_AVATARS);
    if (!bucketCheck.success) {
      return { url: '', error: bucketCheck.error };
    }

    const prefix = playerId ? `player-${playerId}` : 'player';
    const fileName = generateFileName(file.name, prefix);
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.PLAYER_AVATARS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading player avatar:', error);
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        return { 
          url: '', 
          error: `Storage bucket "${STORAGE_BUCKETS.PLAYER_AVATARS}" not found. Please create it in Supabase Storage settings.` 
        };
      }
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PLAYER_AVATARS)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected error uploading player avatar:', error);
    return { url: '', error: error.message || 'Failed to upload image' };
  }
}

/**
 * Upload a team logo image
 * @param file - The image file to upload (can be a cropped canvas blob)
 * @param teamId - Optional team ID for organizing files
 * @returns Public URL of the uploaded image
 */
export async function uploadTeamLogo(
  file: File | Blob,
  teamId?: string
): Promise<{ url: string; error?: string }> {
  // Convert Blob to File if needed
  const fileToUpload = file instanceof File 
    ? file 
    : new File([file], `team-logo-${Date.now()}.png`, { type: 'image/png' });

  const validation = validateImageFile(fileToUpload);
  if (!validation.valid) {
    return { url: '', error: validation.error };
  }

  try {
    // Check if bucket exists
    const bucketCheck = await ensureBucketExists(STORAGE_BUCKETS.TEAM_LOGOS);
    if (!bucketCheck.success) {
      return { url: '', error: bucketCheck.error };
    }

    const prefix = teamId ? `team-${teamId}` : 'team';
    const fileName = generateFileName(fileToUpload.name, prefix);
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.TEAM_LOGOS)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading team logo:', error);
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        return { 
          url: '', 
          error: `Storage bucket "${STORAGE_BUCKETS.TEAM_LOGOS}" not found. Please create it in Supabase Storage settings.` 
        };
      }
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.TEAM_LOGOS)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected error uploading team logo:', error);
    return { url: '', error: error.message || 'Failed to upload image' };
  }
}

/**
 * Delete an image from storage
 * @param imageUrl - The public URL of the image to delete
 * @param bucket - The storage bucket (player-avatars or team-logos)
 * @returns Success status
 */
export async function deleteImage(
  imageUrl: string,
  bucket: 'player-avatars' | 'team-logos'
): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true }; // No image to delete
  }

  try {
    // Extract file path from URL
    // Supabase URLs are like: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = imageUrl.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid image URL format' };
    }

    const filePath = urlParts[1].split('?')[0]; // Remove query params if any

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error deleting image:', error);
    return { success: false, error: error.message || 'Failed to delete image' };
  }
}

/**
 * Get a preview URL for an image file (for display before upload)
 * @param file - The image file
 * @returns Object URL for preview
 */
export function getImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL (cleanup)
 * @param url - The preview URL to revoke
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Crop image to circular format
 * @param file - The image file to crop
 * @param size - Size of the output image (default: 200px)
 * @returns Blob of the cropped circular image
 */
export async function cropImageToCircle(
  file: File,
  size: number = 200
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      // Calculate scaling to fill the circle
      const scale = Math.max(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}


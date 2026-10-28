import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import type { UserRole } from '@/lib/generated/prisma';

export const cloudinaryUploadPurposes = [
  'doctor-profile-photo',
  'doctor-profile-video',
  'facility-profile-photo',
  'facility-profile-video',
  'article-cover'
] as const;

export type CloudinaryUploadPurpose = (typeof cloudinaryUploadPurposes)[number];
export type CloudinaryResourceType = 'image' | 'video';

type UploadPurposeConfig = {
  resourceType: CloudinaryResourceType;
  allowedFormats: string;
  presetEnv: 'CLOUDINARY_IMAGE_PRESET' | 'CLOUDINARY_VIDEO_PRESET';
  roles: readonly UserRole[];
};

const uploadPurposeConfig: Record<CloudinaryUploadPurpose, UploadPurposeConfig> = {
  'doctor-profile-photo': {
    resourceType: 'image',
    allowedFormats: 'jpg,png,webp',
    presetEnv: 'CLOUDINARY_IMAGE_PRESET',
    roles: ['DOCTOR']
  },
  'doctor-profile-video': {
    resourceType: 'video',
    allowedFormats: 'mp4,webm',
    presetEnv: 'CLOUDINARY_VIDEO_PRESET',
    roles: ['DOCTOR']
  },
  'facility-profile-photo': {
    resourceType: 'image',
    allowedFormats: 'jpg,png,webp',
    presetEnv: 'CLOUDINARY_IMAGE_PRESET',
    roles: ['FACILITY', 'PHARMACY']
  },
  'facility-profile-video': {
    resourceType: 'video',
    allowedFormats: 'mp4,webm',
    presetEnv: 'CLOUDINARY_VIDEO_PRESET',
    roles: ['FACILITY', 'PHARMACY']
  },
  'article-cover': {
    resourceType: 'image',
    allowedFormats: 'jpg,png,webp',
    presetEnv: 'CLOUDINARY_IMAGE_PRESET',
    roles: ['DOCTOR', 'FACILITY', 'PHARMACY']
  }
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super('Cloudinary belum dikonfigurasi.');
    this.name = 'CloudinaryNotConfiguredError';
  }
}

export function isCloudinaryConfigured() {
  return Boolean(cloudName && apiKey && apiSecret);
}

export function getUploadPurposeConfig(purpose: CloudinaryUploadPurpose) {
  return uploadPurposeConfig[purpose];
}

export function isUploadPurposeAllowed(purpose: CloudinaryUploadPurpose, role: UserRole) {
  return uploadPurposeConfig[purpose].roles.includes(role);
}

export function getCloudinaryFolder(userId: string, purpose: CloudinaryUploadPurpose) {
  return `silk/users/${userId}/${purpose}`;
}

export function createCloudinaryUploadSignature(userId: string, purpose: CloudinaryUploadPurpose) {
  if (!isCloudinaryConfigured()) {
    throw new CloudinaryNotConfiguredError();
  }

  const config = uploadPurposeConfig[purpose];
  const folder = getCloudinaryFolder(userId, purpose);
  const timestamp = Math.floor(Date.now() / 1000);
  const preset = process.env[config.presetEnv]?.trim();
  const params: Record<string, string | number> = {
    timestamp,
    folder,
    allowed_formats: config.allowedFormats
  };

  if (preset) {
    params.upload_preset = preset;
  }

  return {
    cloudName,
    apiKey,
    signature: cloudinary.utils.api_sign_request(params, apiSecret),
    timestamp,
    folder,
    allowedFormats: config.allowedFormats,
    uploadPreset: preset || null,
    resourceType: config.resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${config.resourceType}/upload`
  };
}

export function isValidCloudinaryAsset({
  userId,
  purpose,
  url,
  publicId
}: {
  userId: string;
  purpose: CloudinaryUploadPurpose;
  url: string;
  publicId: string;
}) {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  const folderPrefix = `${getCloudinaryFolder(userId, purpose)}/`;
  const urlPrefix = `https://res.cloudinary.com/${cloudName}/`;
  const assetName = publicId.slice(folderPrefix.length);

  return (
    publicId.startsWith(folderPrefix) &&
    /^[A-Za-z0-9_-]+$/.test(assetName) &&
    url.startsWith(urlPrefix)
  );
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType
) {
  if (!isCloudinaryConfigured()) {
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true
  });
}

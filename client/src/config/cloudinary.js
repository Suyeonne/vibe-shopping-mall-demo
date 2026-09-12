// Cloudinary Upload Widget (unsigned)에 필요한 값
// VITE_CLOUDINARY_CLOUD_NAME: 대시보드의 Cloud name
// VITE_CLOUDINARY_UPLOAD_PRESET: Signing Mode가 Unsigned인 업로드 프리셋 이름
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
}

export function hasCloudinaryConfig() {
  return Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset)
}

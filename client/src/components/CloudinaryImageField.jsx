import { useEffect, useRef, useState } from 'react'
import { cloudinaryConfig, hasCloudinaryConfig } from '../config/cloudinary'

function CloudinaryImageField({ value, onChange }) {
  const { cloudName, uploadPreset } = cloudinaryConfig
  const inputRef = useRef(null)
  const previewRef = useRef('')
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const clearPending = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = ''
    }
    setPendingFile(null)
    setPreviewUrl('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
    }

    const nextPreview = URL.createObjectURL(file)
    previewRef.current = nextPreview
    setPendingFile(file)
    setPreviewUrl(nextPreview)
    setError('')
  }

  const handleUpload = async () => {
    setError('')

    if (!hasCloudinaryConfig()) {
      setError('VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET 값을 넣어 주세요.')
      return
    }

    if (!pendingFile) return

    setUploading(true)

    try {
      const body = new FormData()
      body.append('file', pendingFile)
      body.append('upload_preset', uploadPreset)
      body.append('folder', 'products')

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
      })
      const data = await response.json()

      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || '이미지 업로드에 실패했습니다.')
      }

      onChange(data.secure_url)
      clearPending()
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || value

  return (
    <div className="admin-image-box">
      {displayUrl ? (
        <img className="admin-image-preview" src={displayUrl} alt="상품 이미지 미리보기" />
      ) : (
        <div className="admin-image-placeholder">미리보기 없음</div>
      )}

      <div className="admin-image-actions">
        <input
          ref={inputRef}
          className="admin-image-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleSelect}
        />
        <button className="admin-btn-ghost" type="button" onClick={() => inputRef.current?.click()}>
          {value || pendingFile ? '이미지 변경' : '이미지 추가'}
        </button>
        {pendingFile && (
          <>
            <button className="admin-btn" type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? '업로드 중...' : '완료'}
            </button>
            <button className="admin-btn-ghost" type="button" onClick={clearPending} disabled={uploading}>
              취소
            </button>
            <p className="admin-image-hint">완료를 눌러야 Cloudinary에 업로드됩니다.</p>
          </>
        )}
        {error && <p className="admin-message error">{error}</p>}
      </div>
    </div>
  )
}

export default CloudinaryImageField

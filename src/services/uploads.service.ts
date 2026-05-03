import apiClient from './apiClient'
import type { ApiResponse } from '../types/api.types'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

// Small file upload (≤5MB) — single request
async function uploadSmall(file: File, onProgress?: (p: UploadProgress) => void): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await apiClient.post<ApiResponse<{ url: string }>>(
    '/file-upload/uploadsmallcontent',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress({ loaded: e.loaded, total: e.total, percent: (e.loaded / e.total) * 100 })
        }
      },
    },
  )
  return res.data.data.url
}

// Large file upload (>5MB) — chunked multipart
async function uploadLarge(file: File, onProgress?: (p: UploadProgress) => void): Promise<string> {
  // 1. Initiate
  const initiateRes = await apiClient.post<ApiResponse<{ uploadId: string }>>(
    '/file-upload/initiateupload',
    { fileName: file.name, fileType: file.type },
  )
  const { uploadId } = initiateRes.data.data

  // 2. Upload chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const eTags: string[] = []
  let uploaded = 0

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const chunk = file.slice(start, start + CHUNK_SIZE)
    const form = new FormData()
    form.append('file', chunk)
    form.append('uploadId', uploadId)
    form.append('partNumber', String(i + 1))
    form.append('fileName', file.name)

    const chunkRes = await apiClient.post<ApiResponse<{ eTag: string }>>(
      '/file-upload/uploadchunk',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    eTags.push(chunkRes.data.data.eTag)
    uploaded += chunk.size

    if (onProgress) {
      onProgress({ loaded: uploaded, total: file.size, percent: (uploaded / file.size) * 100 })
    }
  }

  // 3. Complete
  const completeRes = await apiClient.post<ApiResponse<{ url: string }>>(
    '/file-upload/completeupload',
    { uploadId, fileName: file.name, parts: eTags.map((eTag, i) => ({ partNumber: i + 1, eTag })) },
  )
  return completeRes.data.data.url
}

export const uploadsService = {
  async upload(file: File, onProgress?: (p: UploadProgress) => void): Promise<string> {
    return file.size <= CHUNK_SIZE ? uploadSmall(file, onProgress) : uploadLarge(file, onProgress)
  },
}

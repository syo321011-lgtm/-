/**
 * iPhone / スマホカメラ写真の最適化 & 圧縮ユーティリティ
 * ChatWork APIの5MB上限に対応し、高画質を維持しながら自動縮小します
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  width: number;
  height: number;
}

export const MAX_CHATWORK_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const TARGET_MAX_SIZE = 4 * 1024 * 1024; // 4MB safe margin

/**
 * 画像ファイルを読み込み、必要に応じてリサイズ・圧縮する (汎用ラッパー)
 */
export async function compressImage(
  file: File,
  _options?: { maxWidth?: number; maxHeight?: number; quality?: number; maxSizeBytes?: number }
): Promise<File> {
  const res = await optimizeMobilePhoto(file);
  return res.file;
}

/**
 * 画像ファイルを読み込み、必要に応じてリサイズ・圧縮する
 */
export async function optimizeMobilePhoto(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // 画像として読み込み
  const imageBitmap = await createImageBitmap(file).catch(async () => {
    // createImageBitmap fallback for older Safari
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  });

  const width = imageBitmap.width;
  const height = imageBitmap.height;

  // 既に4MB未満で、解像度も2400px以下ならそのまま利用
  if (originalSize <= TARGET_MAX_SIZE && Math.max(width, height) <= 2400) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      previewUrl,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      width,
      height
    };
  }

  // リサイズ比率計算（長辺最大 2048px）
  const MAX_DIMENSION = 2048;
  let newWidth = width;
  let newHeight = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      newWidth = MAX_DIMENSION;
      newHeight = Math.round((height * MAX_DIMENSION) / width);
    } else {
      newHeight = MAX_DIMENSION;
      newWidth = Math.round((width * MAX_DIMENSION) / height);
    }
  }

  // HTML5 Canvas で描画・再エンコード
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be initialized');
  }

  ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  // JPEG 85% 品質でエクスポート
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
  });

  if (!blob) {
    throw new Error('画像圧縮に失敗しました');
  }

  const baseFileName = file.name.replace(/\.[^/.]+$/, '') || 'iphone_camera_photo';
  const compressedFile = new File([blob], `${baseFileName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });

  const previewUrl = URL.createObjectURL(compressedFile);

  return {
    file: compressedFile,
    previewUrl,
    originalSize,
    compressedSize: compressedFile.size,
    wasCompressed: true,
    width: newWidth,
    height: newHeight
  };
}

/**
 * File オブジェクトを Base64 文字列（プレフィックスなし）に変換
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,xxxx のヘッダーを除去
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * バイト数を読みやすい形式 (KB, MB) に変換
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') ?? false;
  } catch {
    return false;
  }
};

export const getImageDimensions = async (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

export const getImageBlurHash = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    // You would implement actual blur hash generation here
    // For now, returning a placeholder
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
  } catch {
    return '';
  }
};

export const isValidImageDimensions = (width: number, height: number): boolean => {
  const MAX_DIMENSION = 10000;
  const MIN_DIMENSION = 1;
  
  return (
    width >= MIN_DIMENSION &&
    width <= MAX_DIMENSION &&
    height >= MIN_DIMENSION &&
    height <= MAX_DIMENSION
  );
}; 
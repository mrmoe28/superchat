export const sampleImages = {
  products: [
    {
      id: 'product-1',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      alt: 'Smart watch with black band',
      category: 'electronics'
    },
    {
      id: 'product-2',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      alt: 'Wireless headphones in gold',
      category: 'electronics'
    },
    {
      id: 'product-3',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      alt: 'Red Nike sneakers',
      category: 'fashion'
    },
    {
      id: 'product-4',
      url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
      alt: 'Colorful sneakers on white',
      category: 'fashion'
    }
  ],
  placeholders: [
    {
      id: 'placeholder-1',
      url: 'https://via.placeholder.com/400x300',
      alt: 'Product placeholder'
    }
  ]
};

export const getRandomProductImage = (category?: string) => {
  const products = category 
    ? sampleImages.products.filter(img => img.category === category)
    : sampleImages.products;
  
  return products[Math.floor(Math.random() * products.length)] || sampleImages.placeholders[0];
};

export const getSampleImageUrl = (width: number, height: number, text?: string) => {
  const baseUrl = 'https://via.placeholder.com';
  const dimensions = `${width}x${height}`;
  return text 
    ? `${baseUrl}/${dimensions}?text=${encodeURIComponent(text)}`
    : `${baseUrl}/${dimensions}`;
}; 
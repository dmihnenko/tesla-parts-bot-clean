import axios from 'axios';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_URL = 'https://api.imgbb.com/1/upload';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CX = import.meta.env.VITE_GOOGLE_CX;
const GOOGLE_IMAGES_URL = 'https://www.googleapis.com/customsearch/v1';
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export const uploadImageFromUrl = async (imageUrl: string): Promise<string> => {
  if (!IMGBB_API_KEY || IMGBB_API_KEY.trim() === '') {
    console.warn('IMGBB API key not found, using placeholder URL');
    return 'https://www.pngfind.com/pngs/m/24-245028_tesla-logo-tesla-motors-hd-png-download.png';
  }

  try {
    // Download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // Create a File from the downloaded data
    const mimeType = imageResponse.headers['content-type'] || 'image/png';
    const fileName = `placeholder.${mimeType.split('/')[1]}`;
    const imageFile = new File([imageResponse.data], fileName, { type: mimeType });

    // Upload to IMGBB
    return await uploadImage(imageFile);
  } catch (error: any) {
    console.error('Upload from URL error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Fallback to placeholder on any error
    return 'https://i.ibb.co/b5BRhGCC/placeholder.png';
  }
};

export const uploadImage = async (imageFile: File): Promise<string> => {
  console.log('IMGBB_API_KEY in uploadImage:', IMGBB_API_KEY);
  // Check if API key is available
  if (!IMGBB_API_KEY || IMGBB_API_KEY.trim() === '') {
    console.warn('IMGBB API key not found, using placeholder URL');
    // Return a placeholder URL for development
    return 'https://i.ibb.co/b5BRhGCC/placeholder.png';
  }

  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('key', IMGBB_API_KEY);

    const response = await axios.post(IMGBB_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error('Invalid response from IMGBB API');
    }
  } catch (error: any) {
    console.error('IMGBB upload error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Fallback to placeholder on any error
    return 'https://www.pngfind.com/pngs/m/24-245028_tesla-logo-tesla-motors-hd-png-download.png';
  }
};

export interface ImageSearchResult {
  title: string;
  link: string;
  thumbnail: string;
  contextLink: string;
}

export const searchImages = async (query: string): Promise<ImageSearchResult[]> => {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.warn('Google API credentials not configured');
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const searchQuery = `${query} Tesla part photo`;
    const url = `${GOOGLE_IMAGES_URL}?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=10`;

    const response = await axios.get(url, {
      timeout: 10000,
    });

    if (response.data && response.data.items) {
      return response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        contextLink: item.image?.contextLink || item.link,
      }));
    }

    return [];
  } catch (error: any) {
    console.error('Image search error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  }
};

export const detectLanguage = async (text: string): Promise<string> => {
  if (!GOOGLE_API_KEY || !text.trim()) {
    return 'en'; // Default to English
  }

  try {
    const url = `${GOOGLE_TRANSLATE_URL}/detect?key=${GOOGLE_API_KEY}&q=${encodeURIComponent(text)}`;

    const response = await axios.post(url);
    const detections = response.data?.data?.detections;

    if (detections && detections.length > 0 && detections[0].length > 0) {
      return detections[0][0].language;
    }

    return 'en';
  } catch (error: any) {
    console.error('Language detection error:', error);
    return 'en';
  }
};

export const translateText = async (text: string, targetLanguage: string = 'ru'): Promise<string> => {
  if (!GOOGLE_API_KEY || !text.trim()) {
    return text;
  }

  try {
    const url = `${GOOGLE_TRANSLATE_URL}?key=${GOOGLE_API_KEY}&q=${encodeURIComponent(text)}&target=${targetLanguage}`;

    const response = await axios.post(url);
    const translations = response.data?.data?.translations;

    if (translations && translations.length > 0) {
      return translations[0].translatedText;
    }

    return text;
  } catch (error: any) {
    console.error('Translation error:', error);
    return text;
  }
};
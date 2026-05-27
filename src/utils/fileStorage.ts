/**
 * Utility to handle File objects in JSON storage (LocalStorage/SessionStorage)
 * by converting them to Base64 strings and back.
 * 
 * ⚠️ WARNING FOR REACT NATIVE / MOBILE DEVELOPERS:
 * Serializing files to Base64 and storing them in AsyncStorage is highly discouraged
 * due to AsyncStorage storage limits (typically 6MB on Android). In React Native,
 * file picker outputs should keep their reference 'uri' paths as plain strings rather
 * than converting full binary payloads to Base64.
 */

export const serializeFiles = async (data: any): Promise<any> => {
  if (!data) return data;

  // Handle File objects
  if (typeof File !== 'undefined' && data instanceof File) {
    console.log('📦 Serializing file:', data.name);
    const base64 = await fileToBase64(data);
    return {
      __is_file: true,
      name: data.name,
      type: data.type,
      data: base64,
    };
  }

  // Handle FileList (the common format for file inputs)
  if (typeof FileList !== 'undefined' && data instanceof FileList) {
    const files = Array.from(data);
    return {
      __is_file_list: true,
      files: await Promise.all(files.map(serializeFiles)),
    };
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return Promise.all(data.map(serializeFiles));
  }

  // Handle Objects (Recursion)
  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = await serializeFiles(data[key]);
      }
    }
    return result;
  }

  return data;
};

export const deserializeFiles = (data: any): any => {
  if (!data) return data;

  // Restore File from our custom format
  if (data && typeof data === 'object' && data.__is_file && data.data) {
    console.log('📂 Deserializing file:', data.name);
    return dataUrlToFile(data.data, data.name, data.type);
  }

  // Restore FileList from our custom format
  if (data && typeof data === 'object' && data.__is_file_list && Array.isArray(data.files)) {
    const files = data.files.map(deserializeFiles);
    if (typeof DataTransfer !== 'undefined') {
      const dt = new DataTransfer();
      files.forEach((f: any) => dt.items.add(f));
      return dt.files;
    }
    return files; // Fallback to array if DataTransfer is not available (e.g. React Native)
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(deserializeFiles);
  }

  // Handle Objects
  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = deserializeFiles(data[key]);
      }
    }
    return result;
  }

  return data;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const dataUrlToFile = (dataUrl: string, filename: string, mimeType: string): any => {
  if (typeof File === 'undefined') {
    return { uri: dataUrl, name: filename, type: mimeType };
  }
  const arr = dataUrl.split(',');
  const bstr = typeof atob !== 'undefined' ? atob(arr[1]) : '';
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};

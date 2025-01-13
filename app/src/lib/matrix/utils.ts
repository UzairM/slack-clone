import { MatrixClient } from 'matrix-js-sdk';

const MXC_URL_PATTERN = /^mxc:\/\//;

/**
 * Converts a Matrix MXC URL to an HTTP URL using v3 API
 * @param client Matrix client instance
 * @param mxcUrl MXC URL to convert (e.g., mxc://example.com/abc123)
 * @param width Optional width for thumbnails
 * @param height Optional height for thumbnails
 * @param resizeMethod Optional resize method ('crop' or 'scale')
 * @returns HTTP URL or empty string if conversion fails
 */
export function getMxcUrl(
  client: MatrixClient | null,
  mxcUrl?: string,
  width?: number,
  height?: number,
  resizeMethod: 'crop' | 'scale' = 'scale'
): string {
  if (!client || !mxcUrl || !MXC_URL_PATTERN.test(mxcUrl)) {
    return '';
  }

  try {
    // Extract server name and media ID from MXC URL
    // Format: mxc://<server-name>/<media-id>
    const matches = mxcUrl.match(/^mxc:\/\/([^/]+)\/([^/]+)$/);
    if (!matches) {
      console.error('Invalid MXC URL format:', mxcUrl);
      return '';
    }

    const [, serverName, mediaId] = matches;
    const baseUrl = client.baseUrl.replace(/\/$/, '');
    const accessToken = client.getAccessToken();

    // For thumbnails, use the new client/v1 thumbnail endpoint with authentication
    if (width && height) {
      return `${baseUrl}/_matrix/client/v1/media/thumbnail/${serverName}/${mediaId}?width=${width}&height=${height}&method=${resizeMethod}&access_token=${accessToken}`;
    }

    // For full-size images, use the new client/v1 download endpoint with authentication
    return `${baseUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}?access_token=${accessToken}`;
  } catch (error) {
    console.error('Failed to convert MXC URL:', error);
    return '';
  }
}

/**
 * Gets the appropriate image URL for Matrix content with fallback
 * @param client Matrix client instance
 * @param mxcUrl MXC URL to convert
 * @param fallbackUrl Fallback URL to use if conversion fails
 * @param width Optional width for thumbnails
 * @param height Optional height for thumbnails
 * @param resizeMethod Optional resize method ('crop' or 'scale')
 * @returns HTTP URL or fallback URL
 */
export function getMatrixImageUrl(
  client: MatrixClient | null,
  mxcUrl?: string,
  fallbackUrl?: string,
  width?: number,
  height?: number,
  resizeMethod: 'crop' | 'scale' = 'scale'
): string {
  // Early return if no valid input
  if (!mxcUrl || !client) {
    return fallbackUrl || '';
  }

  // Try to convert MXC URL
  const httpUrl = getMxcUrl(client, mxcUrl, width, height, resizeMethod);

  // Return converted URL or fallback
  return httpUrl || fallbackUrl || '';
}

/**
 * Validates if a string is a valid MXC URL
 * @param url URL to validate
 * @returns boolean indicating if URL is a valid MXC URL
 */
export function isValidMxcUrl(url?: string): boolean {
  if (!url) return false;
  return MXC_URL_PATTERN.test(url) && /^mxc:\/\/[^/]+\/[^/]+$/.test(url);
}

/**
 * Gets the appropriate media URL for Matrix content (audio, video, files)
 * @param client Matrix client instance
 * @param mxcUrl MXC URL to convert
 * @param fallbackUrl Optional fallback URL
 * @param fileName Optional file name for download
 * @returns HTTP URL for the media content
 */
export function getMatrixMediaUrl(
  client: MatrixClient | null,
  mxcUrl?: string,
  fallbackUrl?: string,
  fileName?: string
): string {
  if (!client || !mxcUrl || !MXC_URL_PATTERN.test(mxcUrl)) {
    return fallbackUrl || '';
  }

  try {
    // Extract server name and media ID from MXC URL
    const matches = mxcUrl.match(/^mxc:\/\/([^/]+)\/([^/]+)$/);
    if (!matches) {
      console.error('Invalid MXC URL format:', mxcUrl);
      return fallbackUrl || '';
    }

    const [, serverName, mediaId] = matches;
    const baseUrl = client.baseUrl.replace(/\/$/, '');
    const accessToken = client.getAccessToken();

    // Use new client/v1 download endpoint with optional fileName
    const downloadUrl = fileName
      ? `${baseUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}/${encodeURIComponent(fileName)}`
      : `${baseUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}`;

    return `${downloadUrl}?access_token=${accessToken}`;
  } catch (error) {
    console.error('Failed to convert media MXC URL:', error);
    return fallbackUrl || '';
  }
}

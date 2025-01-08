import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isSessionExpired, sessionSchema } from './lib/matrix/session';

// Add paths that require authentication
const protectedPaths = ['/chat', '/settings'];
// Add paths that should redirect to chat if already authenticated
const authPaths = ['/login', '/register'];
// Add paths that require CSRF protection
const mutatingPaths = ['/api/chat', '/api/settings'];

// Generate CSRF token
const generateCsrfToken = () => {
  const token = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(token).toString('base64');
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  try {
    // Get auth token from cookies and parse it correctly
    const authStorage = request.cookies.get('auth-storage')?.value;
    let isAuthenticated = false;
    let sessionData = null;

    if (authStorage) {
      const parsedStorage = JSON.parse(authStorage);

      try {
        // Validate session data against schema
        sessionData = sessionSchema.parse(parsedStorage.state);
        isAuthenticated = !!sessionData.accessToken && !isSessionExpired(sessionData.expiresAt);
      } catch (error) {
        console.error('Invalid session data:', error);
      }
    }

    // CSRF Protection for mutating endpoints
    if (mutatingPaths.some(path => pathname.startsWith(path))) {
      const requestCsrfToken = request.headers.get('x-csrf-token');
      const cookieCsrfToken = request.cookies.get('csrf-token')?.value;

      if (!requestCsrfToken || !cookieCsrfToken || requestCsrfToken !== cookieCsrfToken) {
        return new NextResponse('Invalid CSRF token', { status: 403 });
      }
    }

    // Generate new CSRF token if needed
    if (!request.cookies.has('csrf-token')) {
      const csrfToken = generateCsrfToken();
      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    // Check if path requires authentication
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
    const isAuthPath = authPaths.some(path => pathname.startsWith(path));

    // Redirect to login if accessing protected path without auth
    if (isProtectedPath && !isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to chat if accessing auth paths while authenticated
    if (isAuthPath && isAuthenticated) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

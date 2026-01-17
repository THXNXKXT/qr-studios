import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for auth token in cookies
    const backendToken = request.cookies.get('auth_token')?.value;
    // Check for NextAuth session token (standard and secure versions)
    const nextAuthToken = 
      request.cookies.get('next-auth.session-token')?.value || 
      request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    const authHeader = request.headers.get('authorization');
    
    // If no tokens found, redirect to login
    if (!backendToken && !nextAuthToken && !authHeader) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

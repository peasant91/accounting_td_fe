import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public paths through
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // Cookie presence check.
    // Sanctum SPA sets XSRF-TOKEN and a session cookie (typically 'laravel_session' or an app-specific name).
    // We check for either: XSRF-TOKEN is set after first CSRF fetch; session cookie is set after login.
    const session = req.cookies.get('laravel_session')
        || req.cookies.get('accounting_td_session')
        || req.cookies.get('XSRF-TOKEN');

    if (!session) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
    ],
};

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-in/sso-callback(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/clerk",
  "/api/wordpress(.*)",
  "/api/report/pdf(.*)",
  "/api/report/voice(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (request.nextUrl.pathname === "/login") {
    return Response.redirect(new URL("/sign-in", request.url));
  }

  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

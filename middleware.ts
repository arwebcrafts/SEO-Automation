import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/services",
  "/pricing",
  "/privacy",
  "/terms",
  "/plugin",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/stripe",
  "/api/webhooks/clerk",
  "/api/health",
  "/api/chatbot/message",
  "/api/reviews/unsubscribe",
]);

export default clerkMiddleware((auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }
  
  // Redirect authenticated users from root to dashboard
  if (request.nextUrl.pathname === "/") {
    const userId = auth().userId;
    if (userId) {
      return Response.redirect(new URL("/dashboard", request.url));
    }
  }
  
  auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

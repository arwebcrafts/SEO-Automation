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

  // Protect all private routes
  auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

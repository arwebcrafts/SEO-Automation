import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/scan",
  "/about",
  "/contact",
  "/services",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-in/sso-callback(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/clerk",
  "/api/webhooks/stripe",
  "/api/health",
  "/api/contact",
  "/api/wordpress(.*)",
  "/api/report/pdf(.*)",
  "/api/report/voice(.*)",
  "/api/chatbot/config/(.*)",
  "/api/chatbot/message",
  "/api/chatbot/leads",
  "/api/reviews/unsubscribe",
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

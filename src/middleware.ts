import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/game(.*)",
  "/api/games(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/admin/login(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)/",
    "/",
    "/(api|trpc)(.*)",
  ],
};

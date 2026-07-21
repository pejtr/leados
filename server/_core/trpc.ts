import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit } from "./rateLimit";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const rateLimitMiddleware = t.middleware(async opts => {
  const { ctx, next, path } = opts;
  if (!ENV.rateLimitEnabled) return next();
  if (ctx.user) {
    const isLlmRoute = path?.includes("sendMessage") || path?.includes("aiChat") || path?.includes("chat") || path?.includes("mission") || path?.includes("mastermind") || path?.includes("computerFlow") || path?.includes("review") || path?.includes("panel");
    checkRateLimit(ctx.user.id, { isLlmRoute });
  }
  return next();
});

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      // tRPC doesn't narrow ctx.user type — explicitly type as non-null
      user: ctx.user as NonNullable<typeof ctx.user>,
    },
  });
});

export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

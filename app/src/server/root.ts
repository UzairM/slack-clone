import { channelsRouter } from './routers/channels';
import { messagesRouter } from './routers/messages';
import { userRouter } from './routers/user';
import { router } from './trpc';

export const appRouter = router({
  channels: channelsRouter,
  user: userRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;

import { router } from './router';
import { leadsRouter } from './routers/leads';
import { documentsRouter } from './routers/documents';
import { emailsRouter } from './routers/emails';

// Create the root router with all sub-routers
export const appRouter = router({
  leads: leadsRouter,
  documents: documentsRouter,
  emails: emailsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
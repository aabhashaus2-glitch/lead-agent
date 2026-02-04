import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';

export async function POST(request: Request) {
  console.log('[DEBUG] Form submission received');
  
  const verification = await checkBotId();

  if (verification.isBot) {
    console.log('[DEBUG] Request blocked - detected as bot');
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();
  console.log('[DEBUG] Form body:', body);

  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    console.error('[ERROR] Form validation failed:', parsedBody.error.message);
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  console.log('[DEBUG] Starting workflow with data:', parsedBody.data);
  
  try {
    await start(workflowInbound, [parsedBody.data]);
    console.log('[DEBUG] Workflow started successfully');
  } catch (error) {
    console.error('[ERROR] Failed to start workflow:', error);
    throw error;
  }

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}

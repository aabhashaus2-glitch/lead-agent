import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepWriteEmail
} from './steps';

/**
 * workflow to handle the inbound lead
 * - research the lead
 * - qualify the lead
 * - if the lead is qualified or follow up:
 *   - write an email for the lead
 *   - get human feedback for the email
 *   - send the email to the human for approval
 * - if the lead is not qualified or follow up:
 *   - take other actions here based on other qualification categories
 */
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  try {
    console.log('[DEBUG WORKFLOW] Starting inbound workflow with data:', data);

    console.log('[DEBUG WORKFLOW] Step 1: Research');
    const research = await stepResearch(data);
    console.log('[DEBUG WORKFLOW] Research completed, length:', research.length);

    console.log('[DEBUG WORKFLOW] Step 2: Qualify');
    const qualification = await stepQualify(data, research);
    console.log('[DEBUG WORKFLOW] Qualification result:', qualification);

    // ROUTE BASED ON CATEGORY
    if (qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') {
      // SALES PATH: Write email and send to Slack for approval
      console.log('[DEBUG WORKFLOW] Step 3: Write Email (Sales Path)');
      const email = await stepWriteEmail(data, research, qualification);
      console.log('[DEBUG WORKFLOW] Email written, length:', email.length);

      console.log('[DEBUG WORKFLOW] Step 4: Send to Slack (Email Approval)');
      await stepHumanFeedback(research, email, qualification);
      console.log('[DEBUG WORKFLOW] Slack notification sent with email draft');
    } 
    else if (qualification.category === 'SUPPORT') {
      // SUPPORT PATH: Alert support team  
      console.log('[DEBUG WORKFLOW] Step 3: Route to Support (Support Path)');
      await stepHumanFeedback(research, '', { ...qualification, isSupport: true });
      console.log('[DEBUG WORKFLOW] Support team alerted via Slack');
    }
    else if (qualification.category === 'UNQUALIFIED') {
      // UNQUALIFIED PATH: Log and notify
      console.log('[DEBUG WORKFLOW] Step 3: Log Unqualified Lead');
      await stepHumanFeedback(research, '', { ...qualification, isUnqualified: true });
      console.log('[DEBUG WORKFLOW] Unqualified lead logged and notified');
    }

    console.log('[DEBUG WORKFLOW] Workflow completed successfully');
  } catch (error) {
    console.error('[ERROR WORKFLOW] Workflow failed:', error);
    throw error;
  }
};

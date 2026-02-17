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
    console.log('[DEBUG WORKFLOW] ========== WORKFLOW STARTED ==========');
    console.log('[DEBUG WORKFLOW] Lead: ', data.name, 'from', data.company);
    console.log('[DEBUG WORKFLOW] Email:', data.email);
    console.log('[DEBUG WORKFLOW] Message:', data.message.substring(0, 100) + '...');

    console.log('[DEBUG WORKFLOW] Step 1: Research');
    let research = '';
    try {
      research = await stepResearch(data);
      console.log('[DEBUG WORKFLOW] ✓ Research completed, length:', research.length);
    } catch (researchError) {
      console.error('[ERROR WORKFLOW] Research step failed:', researchError);
      console.error('[ERROR WORKFLOW] Error details:', (researchError as any)?.message);
      throw researchError;
    }

    console.log('[DEBUG WORKFLOW] Step 2: Qualify');
    let qualification;
    try {
      qualification = await stepQualify(data, research);
      console.log('[DEBUG WORKFLOW] ✓ Qualification completed');
      console.log('[DEBUG WORKFLOW] Category:', qualification.category);
      console.log('[DEBUG WORKFLOW] Reason:', qualification.reason.substring(0, 100) + '...');
    } catch (qualifyError) {
      console.error('[ERROR WORKFLOW] Qualification step failed:', qualifyError);
      console.error('[ERROR WORKFLOW] Error details:', (qualifyError as any)?.message);
      throw qualifyError;
    }

    // ROUTE BASED ON CATEGORY
    if (qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') {
      // SALES PATH: Write email and send to Slack for approval
      console.log('[DEBUG WORKFLOW] Step 3: Write Email (Sales Path)');
      let email = '';
      try {
        email = await stepWriteEmail(data, research, qualification);
        console.log('[DEBUG WORKFLOW] ✓ Email written, length:', email.length);
      } catch (emailError) {
        console.error('[ERROR WORKFLOW] Email generation failed:', emailError);
        console.error('[ERROR WORKFLOW] Error details:', (emailError as any)?.message);
        throw emailError;
      }

      console.log('[DEBUG WORKFLOW] Step 4: Send to Slack (Email Approval)');
      try {
        await stepHumanFeedback(research, email, qualification);
        console.log('[DEBUG WORKFLOW] ✓ Slack notification sent successfully');
      } catch (slackError) {
        console.error('[ERROR WORKFLOW] Slack notification failed:', slackError);
        console.error('[ERROR WORKFLOW] Error details:', (slackError as any)?.message);
        console.error('[ERROR WORKFLOW] Error code:', (slackError as any)?.code);
        throw slackError;
      }
    } 
    else if (qualification.category === 'SUPPORT') {
      // SUPPORT PATH: Alert support team  
      console.log('[DEBUG WORKFLOW] Step 3: Route to Support (Support Path)');
      try {
        await stepHumanFeedback(research, '', qualification);
        console.log('[DEBUG WORKFLOW] ✓ Support team alerted via Slack');
      } catch (supportError) {
        console.error('[ERROR WORKFLOW] Support notification failed:', supportError);
        console.error('[ERROR WORKFLOW] Error details:', (supportError as any)?.message);
        throw supportError;
      }
    }
    else if (qualification.category === 'UNQUALIFIED') {
      // UNQUALIFIED PATH: Log and notify
      console.log('[DEBUG WORKFLOW] Step 3: Log Unqualified Lead');
      try {
        await stepHumanFeedback(research, '', qualification);
        console.log('[DEBUG WORKFLOW] ✓ Unqualified lead logged and notified');
      } catch (unqualifiedError) {
        console.error('[ERROR WORKFLOW] Unqualified notification failed:', unqualifiedError);
        console.error('[ERROR WORKFLOW] Error details:', (unqualifiedError as any)?.message);
        throw unqualifiedError;
      }
    }

    console.log('[DEBUG WORKFLOW] ========== WORKFLOW COMPLETED SUCCESSFULLY ==========');
  } catch (error) {
    console.error('[ERROR WORKFLOW] ========== WORKFLOW FAILED ==========');
    console.error('[ERROR WORKFLOW] Error:', error);
    console.error('[ERROR WORKFLOW] Error message:', (error as any)?.message);
    console.error('[ERROR WORKFLOW] Error stack:', (error as any)?.stack);
    console.error('[ERROR WORKFLOW] Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
};

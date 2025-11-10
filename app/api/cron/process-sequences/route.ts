import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSequenceEmail } from "@/lib/email/send-sequence-emails";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all leads ready for next email
    const { data: leads, error } = await supabase
      .rpc('get_leads_ready_for_email');

    if (error) {
      console.error('[ProcessSequences] Error getting leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        message: 'No leads ready for email',
        processed: 0,
        errors: 0
      });
    }

    console.log(`[ProcessSequences] Processing ${leads.length} leads`);

    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process each lead
    for (const lead of leads) {
      try {
        // Get lead data from appropriate table
        let leadData;
        const leadTable = lead.lead_type === 'consultation'
          ? 'consultation_bookings'
          : 'enterprise_demo_requests';

        const { data: leadRecord, error: leadError } = await supabase
          .from(leadTable)
          .select('email, full_name, company_name, status')
          .eq('id', lead.lead_id)
          .single();

        if (leadError || !leadRecord) {
          console.error(`[ProcessSequences] Lead not found: ${lead.lead_id}`, leadError);
          results.errors++;
          results.details.push({
            lead_id: lead.lead_id,
            error: 'Lead not found'
          });
          continue;
        }

        // Skip if lead has been converted or is no longer pending
        if (leadRecord.status === 'converted' || leadRecord.status === 'closed_won') {
          console.log(`[ProcessSequences] Skipping converted lead: ${lead.lead_id}`);

          // Mark sequence as completed
          await supabase
            .from('lead_email_sequence_state')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', lead.enrollment_id);

          continue;
        }

        leadData = {
          email: leadRecord.email,
          full_name: leadRecord.full_name,
          company_name: leadRecord.company_name
        };

        // Send email
        await sendSequenceEmail(lead.email_template, leadData);

        // Mark as sent and schedule next
        const { error: updateError } = await supabase
          .rpc('mark_email_sent', {
            p_enrollment_id: lead.enrollment_id,
            p_next_step: lead.next_step
          });

        if (updateError) {
          console.error(`[ProcessSequences] Error updating enrollment: ${lead.enrollment_id}`, updateError);
          results.errors++;
          results.details.push({
            lead_id: lead.lead_id,
            enrollment_id: lead.enrollment_id,
            error: 'Failed to update enrollment'
          });
        } else {
          results.processed++;
          results.details.push({
            lead_id: lead.lead_id,
            enrollment_id: lead.enrollment_id,
            step: lead.next_step,
            template: lead.email_template,
            email: leadData.email,
            success: true
          });

          console.log(`[ProcessSequences] Sent ${lead.email_template} to ${leadData.email}`);
        }

      } catch (emailError: any) {
        console.error(`[ProcessSequences] Error processing lead ${lead.lead_id}:`, emailError);
        results.errors++;
        results.details.push({
          lead_id: lead.lead_id,
          enrollment_id: lead.enrollment_id,
          error: emailError.message
        });
      }
    }

    console.log(`[ProcessSequences] Complete: ${results.processed} sent, ${results.errors} errors`);

    return NextResponse.json({
      message: `Processed ${leads.length} leads`,
      processed: results.processed,
      errors: results.errors,
      details: results.details
    });

  } catch (error: any) {
    console.error('[ProcessSequences] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Nurture Email Sequence - 7-day educational series
export const nurtureSequence = {
  name: "AI Productivity Nurture Sequence",
  description: "7-day educational sequence to nurture leads",
  sequence_type: "nurture",
  trigger_event: "lead_magnet_download",
  steps: [
    {
      step_number: 1,
      delay_days: 0,
      delay_hours: 0, // Immediate
      subject: "Welcome! Here's your {LEAD_MAGNET_NAME} 📥",
      template: "nurture_day_1"
    },
    {
      step_number: 2,
      delay_days: 1,
      delay_hours: 0,
      subject: "{FIRST_NAME}, the #1 mistake businesses make with AI",
      template: "nurture_day_2"
    },
    {
      step_number: 3,
      delay_days: 2,
      delay_hours: 0,
      subject: "How {COMPANY_EXAMPLE} saved 20 hours/week with AI",
      template: "nurture_day_3"
    },
    {
      step_number: 4,
      delay_days: 3,
      delay_hours: 0,
      subject: "Your AI implementation roadmap (free template)",
      template: "nurture_day_4"
    },
    {
      step_number: 5,
      delay_days: 5,
      delay_hours: 0,
      subject: "The ROI calculator every business needs",
      template: "nurture_day_5"
    },
    {
      step_number: 6,
      delay_days: 7,
      delay_hours: 0,
      subject: "Ready to transform your workflow? Let's talk",
      template: "nurture_day_6"
    }
  ]
};

export default nurtureSequence;

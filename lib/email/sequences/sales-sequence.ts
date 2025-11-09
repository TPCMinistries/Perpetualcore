// Sales Email Sequence - 10-day conversion-focused series
export const salesSequence = {
  name: "AI Platform Sales Sequence",
  description: "10-day sales sequence to convert leads to customers",
  sequence_type: "sales",
  trigger_event: "lead_magnet_download",
  steps: [
    {
      step_number: 1,
      delay_days: 0,
      delay_hours: 0,
      subject: "Your AI transformation starts here, {FIRST_NAME}",
      template: "sales_day_1"
    },
    {
      step_number: 2,
      delay_days: 1,
      delay_hours: 0,
      subject: "See Perpetual Core in action (2-min demo)",
      template: "sales_day_2"
    },
    {
      step_number: 3,
      delay_days: 2,
      delay_hours: 0,
      subject: "Why companies choose Perpetual Core over ChatGPT",
      template: "sales_day_3"
    },
    {
      step_number: 4,
      delay_days: 4,
      delay_hours: 0,
      subject: "{FIRST_NAME}, your competitors are already using AI",
      template: "sales_day_4"
    },
    {
      step_number: 5,
      delay_days: 6,
      delay_hours: 0,
      subject: "Limited time: Get 50% off your first month",
      template: "sales_day_5"
    },
    {
      step_number: 6,
      delay_days: 8,
      delay_hours: 0,
      subject: "Last chance: Special pricing ends in 48 hours",
      template: "sales_day_6"
    },
    {
      step_number: 7,
      delay_days: 10,
      delay_hours: 0,
      subject: "Can I ask you a question, {FIRST_NAME}?",
      template: "sales_day_7"
    }
  ]
};

export default salesSequence;

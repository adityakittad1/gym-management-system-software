const cron = require('node-cron');
const logger = require('./logger');
const templateEngine = require('./whatsapp-template-engine');
const whatsappService = require('./whatsapp-service');
const { supabaseAdmin } = require('./supabase');

let activeJobs = [];

const initScheduler = () => {
  logger.info('Scheduler', 'Initializing automated background jobs...');

  // 1. Daily WhatsApp Reminders & Expiry checks
  // Runs every day at 09:00 AM
  const reminderJob = cron.schedule('0 9 * * *', async () => {
    logger.info('Scheduler', 'Running daily expiry check & reminders...');
    try {
      // Fetch settings
      const { data: settingsData } = await supabaseAdmin.from('settings').select('*');
      const gymSettings = {};
      (settingsData || []).forEach(s => { gymSettings[s.key] = s.value; });

      // Fetch members
      const { data: members } = await supabaseAdmin.from('members_view').select('*').in('status', ['active', 'expiring', 'expired']);
      
      let sent = 0, failed = 0;

      for (const member of (members || [])) {
        if (!member.phone || member.phone.length < 10) continue;

        let templateType = null;
        let days = member.days_remaining;

        if (days === 30) templateType = 'expiry_30';
        else if (days === 15) templateType = 'expiry_15';
        else if (days === 7) templateType = 'expiry_7';
        else if (days === 5) templateType = 'expiry_5';
        else if (days === 3) templateType = 'expiry_3';
        else if (days === 2) templateType = 'expiry_2';
        else if (days === 1) templateType = 'expiry_tomorrow';
        else if (days === 0) templateType = 'expiry_today';
        else if (days < 0 && days >= -5) templateType = 'expired';

        if (templateType) {
          try {
            const message = templateEngine.generateMessage(templateType, member, gymSettings);
            await whatsappService.sendMessage(member.phone, message, { member: member.name });
            
            await supabaseAdmin.from('whatsapp_logs').insert([{
              recipient_phone: member.phone,
              member_id: member.id,
              message_type: templateType,
              content: message,
              status: 'sent',
              sent_at: new Date().toISOString()
            }]);
            sent++;
          } catch (e) {
            failed++;
            await supabaseAdmin.from('whatsapp_logs').insert([{
              recipient_phone: member.phone,
              member_id: member.id,
              message_type: templateType,
              content: 'Failed to generate or send message',
              status: 'failed',
              error_reason: e.message
            }]);
          }
        }
      }
      logger.info('Scheduler', `Daily reminders finished. Sent: ${sent}, Failed: ${failed}`);
    } catch (err) {
      logger.error('Scheduler', 'Failed to run daily reminders', err);
    }
  });

  // 2. Pending Payments Follow-up
  // Runs every day at 10:00 AM
  const paymentJob = cron.schedule('0 10 * * *', async () => {
    logger.info('Scheduler', 'Running daily pending payments check...');
    // Future integration for payment reminders
  });

  activeJobs.push(reminderJob, paymentJob);
  logger.info('Scheduler', 'All automated jobs scheduled successfully.');
};

const getStatus = () => {
  return {
    running: activeJobs.length > 0,
    jobCount: activeJobs.length
  };
};

module.exports = {
  initScheduler,
  getStatus
};

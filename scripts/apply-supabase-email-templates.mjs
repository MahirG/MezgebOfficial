import { mezgebAuthEmailConfig } from '../supabase/email-templates/mezgeb-email-templates.mjs';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'vcyzgoiconxjmntoreto';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const dryRun = process.argv.includes('--dry-run');

function validateConfiguration(config) {
  const required = [
    'mailer_templates_confirmation_content',
    'mailer_templates_recovery_content',
    'mailer_templates_magic_link_content',
    'mailer_templates_invite_content',
    'mailer_templates_email_change_content',
    'mailer_templates_reauthentication_content'
  ];

  for (const key of required) {
    const value = config[key];
    if (typeof value !== 'string' || value.length < 500) {
      throw new Error(`Email template ${key} is missing or unexpectedly short.`);
    }
  }

  const linkTemplates = required.filter((key) => key !== 'mailer_templates_reauthentication_content');
  for (const key of linkTemplates) {
    if (!config[key].includes('{{ .ConfirmationURL }}')) {
      throw new Error(`${key} must preserve Supabase's ConfirmationURL variable.`);
    }
  }

  if (!config.mailer_templates_reauthentication_content.includes('{{ .Token }}')) {
    throw new Error('The reauthentication template must preserve Supabase\'s Token variable.');
  }
}

validateConfiguration(mezgebAuthEmailConfig);

if (dryRun) {
  const templates = Object.keys(mezgebAuthEmailConfig).filter((key) => key.includes('templates_'));
  console.log(`Validated ${templates.length} Mezgeb email templates for project ${projectRef}.`);
  process.exit(0);
}

if (!accessToken) {
  console.error('SUPABASE_ACCESS_TOKEN is required. Create it in your Supabase account settings and store it as a local environment variable or protected CI secret.');
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(mezgebAuthEmailConfig)
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Supabase Auth template update failed (${response.status}): ${body}`);
}

console.log(`Mezgeb authentication email templates were applied to ${projectRef}.`);

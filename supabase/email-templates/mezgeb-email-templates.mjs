const brand = {
  navy: '#0A0E27',
  blue: '#0071E3',
  blueDark: '#005BB5',
  gold: '#F5B544',
  text: '#1D1D1F',
  muted: '#6E6E73',
  background: '#F3F5F7',
  line: '#E5E7EB',
  success: '#0F8A5F',
  danger: '#C93C52'
};

const greeting = '{{ if .Data.full_name }}Selam {{ .Data.full_name }},{{ else }}Selam,{{ end }}';

function emailShell({
  preheader,
  eyebrow,
  title,
  intro,
  content = '',
  ctaLabel,
  ctaUrl,
  code,
  note,
  danger = false
}) {
  const action = ctaLabel && ctaUrl
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0 26px">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" style="display:inline-block;background:${brand.blue};color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:700;line-height:20px;padding:15px 26px;border-radius:999px;box-shadow:0 10px 24px rgba(0,113,227,.22)">${ctaLabel}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:18px;color:${brand.muted};text-align:center">Button not working? Copy and paste this secure link into your browser:</p>
      <p style="margin:0;word-break:break-all;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:17px;color:${brand.blue};text-align:center">${ctaUrl}</p>`
    : '';

  const codeBlock = code
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0">
        <tr>
          <td align="center" style="background:${brand.background};border:1px solid ${brand.line};border-radius:20px;padding:22px 18px">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:34px;line-height:42px;font-weight:800;letter-spacing:8px;color:${brand.navy}">${code}</div>
            <div style="margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:18px;color:${brand.muted}">Enter this one-time code in Mezgeb.</div>
          </td>
        </tr>
      </table>`
    : '';

  const noteBlock = note
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px">
        <tr>
          <td style="background:${danger ? '#FFF2F4' : '#F5F9FF'};border:1px solid ${danger ? '#F5CCD3' : '#D8E9FF'};border-radius:18px;padding:16px 18px">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:20px;color:${danger ? brand.danger : brand.text}">${note}</p>
          </td>
        </tr>
      </table>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <style>
    @media only screen and (max-width:620px){
      .email-wrap{width:100%!important;border-radius:0!important}
      .email-pad{padding-left:24px!important;padding-right:24px!important}
      .email-title{font-size:29px!important;line-height:34px!important}
      .brand-copy{font-size:16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${brand.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${brand.background}">
    <tr>
      <td align="center" style="padding:34px 12px">
        <table class="email-wrap" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:30px;overflow:hidden;box-shadow:0 24px 70px rgba(10,14,39,.10)">
          <tr>
            <td class="email-pad" style="padding:24px 40px;background:${brand.navy}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="48" valign="middle">
                    <div style="width:42px;height:42px;border-radius:13px;background:linear-gradient(145deg,${brand.blue},#6BAEFF);color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:22px;line-height:42px;font-weight:800;text-align:center">M</div>
                  </td>
                  <td valign="middle" style="padding-left:12px">
                    <div class="brand-copy" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:18px;line-height:22px;font-weight:800;color:#ffffff;letter-spacing:-.3px">Mezgeb <span style="color:${brand.gold}">መዝገብ</span></div>
                    <div style="margin-top:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:15px;color:#B8C4E3">Your business, clearly recorded.</div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:7px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:10px;line-height:12px;font-weight:700;letter-spacing:.8px;color:#D8E0F4;text-transform:uppercase">Secure account email</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:42px 48px 38px">
              <div style="display:inline-block;background:#EEF6FF;border-radius:999px;padding:7px 11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:14px;font-weight:800;letter-spacing:.8px;color:${brand.blue};text-transform:uppercase">${eyebrow}</div>
              <h1 class="email-title" style="margin:20px 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:36px;line-height:41px;letter-spacing:-1.3px;color:${brand.text}">${title}</h1>
              <p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:25px;color:${brand.text}">${greeting}</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:25px;color:${brand.muted}">${intro}</p>
              ${content}
              ${codeBlock}
              ${action}
              ${noteBlock}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:24px 48px 30px;background:#FAFAFB;border-top:1px solid ${brand.line}">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:19px;color:${brand.muted}">This automated security message was sent for your Mezgeb account. Never share a password or verification code with anyone.</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:17px;color:#929297">© Mezgeb · Built for Ethiopian businesses · <a href="{{ .SiteURL }}" style="color:${brand.blue};text-decoration:none">Open Mezgeb</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const actionNotice = 'This link is personal, time-limited, and can be used only for this account. If you did not request this action, you can safely ignore this message.';
const urgentNotice = 'You did not make this change? Protect your account immediately by resetting your password and reviewing your account security.';

export const mezgebAuthEmailConfig = {
  mailer_subjects_confirmation: 'Confirm your Mezgeb account',
  mailer_templates_confirmation_content: emailShell({
    preheader: 'Confirm your email to finish creating your Mezgeb account.',
    eyebrow: 'Confirm registration',
    title: 'One click and your record is ready.',
    intro: 'Confirm your email address to activate your secure Mezgeb account and continue setting up your business workspace.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">Registered email: <strong style="color:#1D1D1F">{{ .Email }}</strong></p>',
    ctaLabel: 'Confirm my email',
    ctaUrl: '{{ .ConfirmationURL }}',
    note: actionNotice
  }),

  mailer_subjects_recovery: 'Reset your Mezgeb password',
  mailer_templates_recovery_content: emailShell({
    preheader: 'Use this secure link to choose a new Mezgeb password.',
    eyebrow: 'Password recovery',
    title: 'Reset your password securely.',
    intro: 'We received a request to reset the password for your Mezgeb account. Continue below to create a new password.',
    ctaLabel: 'Reset my password',
    ctaUrl: '{{ .ConfirmationURL }}',
    note: 'Did not request a password reset? Ignore this email. Your current password will remain unchanged.'
  }),

  mailer_subjects_magic_link: 'Your secure Mezgeb sign-in link',
  mailer_templates_magic_link_content: emailShell({
    preheader: 'Sign in to Mezgeb using this secure, one-time link.',
    eyebrow: 'Secure sign in',
    title: 'Your Mezgeb sign-in link is ready.',
    intro: 'Use the button below to sign in without entering your password. The link expires shortly and works only once.',
    ctaLabel: 'Sign in to Mezgeb',
    ctaUrl: '{{ .ConfirmationURL }}',
    note: actionNotice
  }),

  mailer_subjects_invite: 'You are invited to Mezgeb',
  mailer_templates_invite_content: emailShell({
    preheader: 'Accept your invitation to join Mezgeb.',
    eyebrow: 'Workspace invitation',
    title: 'You have been invited to Mezgeb.',
    intro: 'A secure Mezgeb account has been prepared for you. Accept the invitation to join and begin working with clear business records.',
    ctaLabel: 'Accept invitation',
    ctaUrl: '{{ .ConfirmationURL }}',
    note: actionNotice
  }),

  mailer_subjects_email_change: 'Confirm your new Mezgeb email',
  mailer_templates_email_change_content: emailShell({
    preheader: 'Confirm the new email address for your Mezgeb account.',
    eyebrow: 'Email address change',
    title: 'Confirm your new email address.',
    intro: 'You requested to change the email used for your Mezgeb account. Confirm the new address below to complete the update.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">New email: <strong style="color:#1D1D1F">{{ .NewEmail }}</strong></p>',
    ctaLabel: 'Confirm new email',
    ctaUrl: '{{ .ConfirmationURL }}',
    note: 'Did not request this email change? Do not click the button. Your account email will remain unchanged.',
    danger: true
  }),

  mailer_subjects_reauthentication: '{{ .Token }} is your Mezgeb verification code',
  mailer_templates_reauthentication_content: emailShell({
    preheader: 'Use this one-time code to verify a sensitive Mezgeb action.',
    eyebrow: 'Identity verification',
    title: 'Verify that it is really you.',
    intro: 'Enter this one-time verification code to continue the sensitive action in Mezgeb.',
    code: '{{ .Token }}',
    note: 'Never share this code. Mezgeb support will never ask you to read it aloud or send it by message.'
  }),

  mailer_notifications_password_changed_enabled: true,
  mailer_subjects_password_changed_notification: 'Your Mezgeb password was changed',
  mailer_templates_password_changed_notification_content: emailShell({
    preheader: 'Security notice: your Mezgeb password was changed.',
    eyebrow: 'Security notification',
    title: 'Your password was changed.',
    intro: 'The password for your Mezgeb account was recently updated. You can continue using your account normally if you made this change.',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_email_changed_enabled: true,
  mailer_subjects_email_changed_notification: 'Your Mezgeb email address was changed',
  mailer_templates_email_changed_notification_content: emailShell({
    preheader: 'Security notice: your Mezgeb email address was changed.',
    eyebrow: 'Security notification',
    title: 'Your email address was changed.',
    intro: 'The email address used to sign in to Mezgeb has been updated.',
    content: '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0"><tr><td style="background:#F3F5F7;border-radius:18px;padding:16px 18px"><div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:13px;line-height:20px;color:#6E6E73">Previous email<br><strong style="color:#1D1D1F">{{ .OldEmail }}</strong><br><br>New email<br><strong style="color:#1D1D1F">{{ .Email }}</strong></div></td></tr></table>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_phone_changed_enabled: true,
  mailer_subjects_phone_changed_notification: 'Your Mezgeb phone number was changed',
  mailer_templates_phone_changed_notification_content: emailShell({
    preheader: 'Security notice: your Mezgeb phone number was changed.',
    eyebrow: 'Security notification',
    title: 'Your phone number was changed.',
    intro: 'The phone number connected to your Mezgeb account has been updated.',
    content: '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0"><tr><td style="background:#F3F5F7;border-radius:18px;padding:16px 18px"><div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:13px;line-height:20px;color:#6E6E73">Previous phone<br><strong style="color:#1D1D1F">{{ .OldPhone }}</strong><br><br>New phone<br><strong style="color:#1D1D1F">{{ .Phone }}</strong></div></td></tr></table>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_mfa_factor_enrolled_enabled: true,
  mailer_subjects_mfa_factor_enrolled_notification: 'A verification method was added to Mezgeb',
  mailer_templates_mfa_factor_enrolled_notification_content: emailShell({
    preheader: 'Security notice: a verification method was added to your Mezgeb account.',
    eyebrow: 'Security notification',
    title: 'A verification method was added.',
    intro: 'A new sign-in verification method was added to your Mezgeb account.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">Method: <strong style="color:#1D1D1F">{{ .FactorType }}</strong></p>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_mfa_factor_unenrolled_enabled: true,
  mailer_subjects_mfa_factor_unenrolled_notification: 'A verification method was removed from Mezgeb',
  mailer_templates_mfa_factor_unenrolled_notification_content: emailShell({
    preheader: 'Security notice: a verification method was removed from your Mezgeb account.',
    eyebrow: 'Security notification',
    title: 'A verification method was removed.',
    intro: 'A sign-in verification method was removed from your Mezgeb account.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">Method: <strong style="color:#1D1D1F">{{ .FactorType }}</strong></p>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_identity_linked_enabled: true,
  mailer_subjects_identity_linked_notification: 'A sign-in method was linked to Mezgeb',
  mailer_templates_identity_linked_notification_content: emailShell({
    preheader: 'Security notice: a sign-in method was linked to your Mezgeb account.',
    eyebrow: 'Security notification',
    title: 'A sign-in method was linked.',
    intro: 'A new external sign-in method was connected to your Mezgeb account.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">Provider: <strong style="color:#1D1D1F">{{ .Provider }}</strong></p>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  }),

  mailer_notifications_identity_unlinked_enabled: true,
  mailer_subjects_identity_unlinked_notification: 'A sign-in method was removed from Mezgeb',
  mailer_templates_identity_unlinked_notification_content: emailShell({
    preheader: 'Security notice: a sign-in method was removed from your Mezgeb account.',
    eyebrow: 'Security notification',
    title: 'A sign-in method was removed.',
    intro: 'An external sign-in method was disconnected from your Mezgeb account.',
    content: '<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:22px;color:#6E6E73">Provider: <strong style="color:#1D1D1F">{{ .Provider }}</strong></p>',
    ctaLabel: 'Review my account',
    ctaUrl: '{{ .SiteURL }}/account',
    note: urgentNotice,
    danger: true
  })
};

export const authenticationTemplateKeys = [
  'confirmation',
  'recovery',
  'magic_link',
  'invite',
  'email_change',
  'reauthentication'
];

export const securityNotificationKeys = [
  'password_changed_notification',
  'email_changed_notification',
  'phone_changed_notification',
  'mfa_factor_enrolled_notification',
  'mfa_factor_unenrolled_notification',
  'identity_linked_notification',
  'identity_unlinked_notification'
];

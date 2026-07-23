# Mezgeb Supabase email templates

This directory contains the production email design system for Mezgeb authentication and account-security messages.

## Visual system

- Mezgeb midnight navy, trusted blue and Ethiopian gold accents
- Table-based email layout for broad inbox compatibility
- Responsive mobile presentation
- System fonts only; no blocked external font downloads
- Text-based Mezgeb mark so the brand remains visible when images are disabled
- Hidden preheader text for a cleaner inbox preview
- Clear call-to-action buttons plus plain-link fallbacks
- Security notices for sensitive account changes
- English copy with a light local greeting: `Selam`
- Personalization using `{{ .Data.full_name }}` when available

## Authentication templates

1. Confirm registration
2. Password recovery
3. Magic-link sign in
4. User invitation
5. Email-address change
6. Reauthentication code

## Security notifications

1. Password changed
2. Email changed
3. Phone changed
4. MFA method added
5. MFA method removed
6. Sign-in identity linked
7. Sign-in identity removed

## Supabase variables preserved

The templates deliberately retain Supabase Go-template variables such as:

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .SiteURL }}`
- `{{ .Email }}`
- `{{ .NewEmail }}`
- `{{ .OldEmail }}`
- `{{ .Phone }}`
- `{{ .OldPhone }}`
- `{{ .Provider }}`
- `{{ .FactorType }}`
- `{{ .Data.full_name }}`

Do not replace these with hard-coded links or user data.

## Validate locally

```bash
npm run email:validate
```

CI runs this validation automatically and fails when a required confirmation link or OTP variable is removed.

## Apply to hosted Supabase

The deployment script uses the official Supabase Management API. Create a personal access token in the Supabase account settings and keep it in a protected local environment variable or CI secret. Never commit it.

```bash
export SUPABASE_ACCESS_TOKEN="your-private-management-token"
export SUPABASE_PROJECT_REF="vcyzgoiconxjmntoreto"
npm run email:apply
```

The project reference defaults to the Mezgeb project. The script updates Auth email subjects, HTML bodies, and enables the included security notifications.

## Dashboard alternative

Hosted Supabase templates can also be applied manually from **Authentication → Email Templates**. The canonical template definitions remain in `mezgeb-email-templates.mjs` so visual changes stay version-controlled.

## Deliverability note

A custom SMTP provider should be configured before production launch so emails use a Mezgeb-controlled sender domain, SPF, DKIM and DMARC. Email-link tracking should remain disabled because link rewriting can interfere with authentication links.

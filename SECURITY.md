# Security policy

## Supported version

Only the latest commit on `main` is supported.

## Reporting vulnerabilities

Use GitHub private vulnerability reporting or contact the repository owner privately. Do not disclose vulnerabilities in public issues.

## Secrets

Never commit `.env` files, Supabase service-role keys, database passwords, payment credentials, SMTP secrets or GitHub tokens. Rotate any secret that has ever been exposed.

## Financial-data warning

Do not use this project with real financial or customer data until a dedicated production backend, RLS verification, legal review, backups, monitoring and incident response are complete.

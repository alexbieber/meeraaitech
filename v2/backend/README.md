# MeeraAI website backend

Two small serverless endpoints for meeraaitech.com, deployed with AWS SAM in **ap-south-1 (Mumbai)**:

| Route | What it does |
|---|---|
| `POST /contact` | Validates the contact form and emails it to Official@meeraaitech.com through Amazon SES. Spam is filtered with a hidden honeypot field. |
| `POST /describe` | Runs the "Hear what SpectraSense sees" demo: sends the visitor's photo to Claude on Amazon Bedrock and returns the spoken-style description. Nothing is stored. |

Both endpoints accept calls only from the origins in `AllowedOrigins` and are rate-limited (burst 10, 3 requests per second).

## One-time setup

1. **Install tools:** [AWS CLI](https://docs.aws.amazon.com/cli/) and [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/), then `aws configure` with an account that can create Lambda, API Gateway and IAM roles.
2. **Verify the domain in SES (ap-south-1):** SES console → Identities → Create identity → Domain → `meeraaitech.com`. Add the DKIM CNAME records it shows to your DNS.
   - New SES accounts start in the *sandbox*, where mail can only go to verified addresses. Verify `Official@meeraaitech.com` as well, or request production access.
3. **Enable Claude on Bedrock (ap-south-1):** Bedrock console → Model access → enable Anthropic Claude Haiku 4.5 (and Sonnet 4.6 if you want it).
   - Indian accounts reach Claude through **global cross-Region inference**, so photos may be processed outside India. The site says this next to the upload button.

## Deploy

```bash
cd backend
npm install          # installs esbuild for the build step
sam build
sam deploy --guided  # region: ap-south-1, accept the defaults or change the parameters
```

The deploy prints `ApiUrl`, for example `https://abc123.execute-api.ap-south-1.amazonaws.com`.

## Connect the site

Open `index.html`, find this line near the top of the main script and paste the URL:

```js
const MAIT_API = '';   // e.g. 'https://abc123.execute-api.ap-south-1.amazonaws.com'
```

With it set:
- the contact form sends directly and shows "Message sent";
- the photo demo shows **Use your own photo** on meeraaitech.com (photos are resized to 1024 px in the browser before upload).

With it empty, the site falls back to opening the visitor's email app and showing the example scene, as before.

## Test

```bash
API=https://abc123.execute-api.ap-south-1.amazonaws.com
curl -X POST $API/contact -H 'origin: https://meeraaitech.com' -H 'content-type: application/json' \
  -d '{"name":"Test","email":"you@example.com","subject":"Other","message":"Hello from curl"}'
```

## Costs (rough)

- Lambda, API Gateway and SES: effectively free at website volumes.
- Photo demo: one Claude Haiku call per photo, a small fraction of a rupee each. The rate limit caps abuse; raise or lower it in `template.yaml`.

## Change things

- Different recipient or sender: `sam deploy --parameter-overrides ToAddress=... FromAddress=...`
- Richer descriptions: `ModelId=global.anthropic.claude-sonnet-4-6`
- Allow a staging domain: add it to `AllowedOrigins`.

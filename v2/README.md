# meeraaitech.com

Website for MeeraAI Tech Solutions LLP (MAIT), Mumbai: SpectraSense smart glasses, Dropler.AI, MuscleCRM and our AI, AR/VR and software services.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The whole site: one self-contained page (3D scene with three.js, GSAP and Lenis from public CDNs). |
| `og.png`, `logo.png` | Social share image and site icon. |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Search and AI-search files. |
| `backend/` | Optional AWS SAM backend (ap-south-1): contact form via SES and the live SpectraSense photo demo via Amazon Bedrock. See `backend/README.md`. |

## Deploy

Upload the files at the repository root to any static host (S3 + CloudFront, Netlify, Vercel, GitHub Pages). No build step.

To turn on the backend, deploy `backend/` and paste its `ApiUrl` into `const MAIT_API = ''` near the top of the script in `index.html`.

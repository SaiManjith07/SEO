# Week 2 Setup: Data Layer (GSC & CrUX)

This document explains how to set up the Google Cloud Platform (GCP) prerequisites required for SEOKit's Data Layer to function. The data layer powers the AI visibility and traditional ranking metrics.

## 1. Google Cloud Project Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

## 2. Enable APIs
You must enable two specific APIs for this project:
1. Navigate to **APIs & Services > Library**.
2. Search for and enable the **Google Search Console API**.
3. Search for and enable the **Chrome UX Report API**.

## 3. Configure Google Search Console (GSC) Access
To allow SEOKit to read your GSC data, you need a Service Account:
1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **Service Account**.
3. Name the service account (e.g., `seokit-gsc-reader`) and create it.
4. Once created, click on the service account, go to the **Keys** tab, and click **Add Key > Create new key**.
5. Choose **JSON** and download the file. 
6. **Rename** the file to `service-account.json` and move it to your project root (or a secure location).
7. Copy the service account's email address.
8. Go to your [Google Search Console](https://search.google.com/search-console).
9. Select your property, navigate to **Settings > Users and permissions**, and click **Add User**.
10. Paste the service account email and set the permission to **Restricted**.

## 4. Configure Chrome UX Report (CrUX) Access
To fetch real-world performance data, you need an API key:
1. In the GCP Console, navigate back to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **API Key**.
3. Once created, click on the API Key to edit its restrictions.
4. Under **API restrictions**, choose **Restrict key** and select only the **Chrome UX Report API**.
5. Copy the API key.

## 5. Environment Variables
SEOKit requires these credentials to be provided via environment variables. Create a `.env` file at the root of your project based on the `.env.example`:

```env
CRUX_API_KEY=your_crux_api_key_here
GSC_SERVICE_ACCOUNT_PATH=./service-account.json
GSC_PROPERTY_URL=https://your-website.com/
```

> ⚠️ **CRITICAL WARNING** ⚠️
> NEVER commit your `service-account.json` file or your `CRUX_API_KEY` (or the `.env` file containing them) to version control. Ensure they are added to your `.gitignore`. Compromised credentials can lead to unauthorized access to your search data and potential quota abuse.

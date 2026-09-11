# my-wallet-app

Expo ベースの個人向け財布管理アプリです。MVP ではローカル保存を使いながら、Firebase の設定がある場合は Firestore に同期します。

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the environment template

   ```bash
   cp .env.example .env
   ```

3. Fill in your Firebase project values in `.env`

4. Start the app

   ```bash
   npx expo start
   ```

## Firebase setup

Create a Firebase project and then add the following values to `.env`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

The app reads these values automatically and only enables Firestore sync when all required variables are present. If the values are missing, it keeps using the local AsyncStorage fallback.

## Firestore data model

The wallet state is saved to the document:

```text
wallets/my-wallet-app
```

with fields like:

```json
{
  "initialBalances": { "bank": 100000, "wallet": 50000 },
  "history": [
    {
      "id": "...",
      "type": "expense",
      "account": "bank",
      "amount": 2500,
      "category": "食費",
      "createdAt": "2026-09-11T12:34:56.000Z"
    }
  ],
  "updatedAt": "2026-09-11T12:34:56.000Z"
}
```

## Useful commands

```bash
npm run web
npm run ios
npm run android
npx tsc --noEmit
```

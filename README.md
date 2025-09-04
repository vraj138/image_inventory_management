## AI Image Inventory System

An AI-powered inventory management system built with Next.js, Firebase, and OpenAI GPT-4o-mini.
This tool allows users to:

* Authenticate with Google or email/password
* Capture images of products using their device’s camera
* Automatically detect items & quantities via OpenAI Vision
* Manage inventory in real-time (add/remove items) synced with Firebase Firestore

## Features

* User Authentication (Google & Email/Password)
* Camera Capture with real-time image recognition
* AI Item Detection using OpenAI GPT-4o-mini (Vision + Text)
* Inventory Persistence per user with Firebase Firestore
* Manual Item Management (add, remove, update)
* Next.js Frontend with Material UI components

## Tech Stack

* Frontend: Next.js, React, Material UI
* Backend/Database: Firebase (Firestore, Auth)
* AI: OpenAI GPT-4o-mini (Vision)
* Hosting/Deployment: Vercel

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/your-username/ai-image-inventory.git
cd ai-image-inventory
```


2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a .env.local file in the root directory and add:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000


## How It Works

1. Log in with Google or Email/Password
2. Open the camera and capture an image of your items
3. OpenAI analyzes the image and returns items with quantities
4. Inventory updates automatically in Firestore
5. You can also manually add/remove items via the UI


## Project Structure

```bash
app/
  layout.js
  page.js        
firebase.js 

```

## Deployment

This project is live! Try it here:
[AI Image Inventory System Demo](https://image-inventory-management.vercel.app/)

Built with Next.js + Firebase + OpenAI GPT-4o-mini, and deployed on Vercel.

If you’d like to deploy your own version:

1. Fork/clone this repo
2. Push to your GitHub
3. Import into Vercel
4. Add the required environment variables in the Vercel dashboard
5. Deploy 
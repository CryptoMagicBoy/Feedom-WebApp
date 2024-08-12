# TonIce Clicker Game

## Overview
Right now I release updates almost every days. Stay tuned with latest news and updates: https://t.me/clicker_game_news

## Environment Variables
You will need the following 6 variables in your `.env` file:


DATABASE_URL="mongo db database url"

BOT_TOKEN="token of your telegram bot"  - you don't need this if you set BYPASS_TELEGRAM_AUTH to true

BYPASS_TELEGRAM_AUTH=true  - it's true during the tests

TELEGRAM_API_ID=""

TELEGRAM_API_HASH=""

TELEGRAM_BOT_TOKEN=""

You will need this one variable in your .env.local

NEXT_PUBLIC_BYPASS_TELEGRAM_AUTH=true - it's true during the tests


In order to see the app in test mode on your local pc you need to 
1. Naviagate to the project directory
2. Install dependencies
npm install
3. Provide URL for prisma in .env
DATABASE_URL="mongo db database url"
4. Provide this in .env for tests
BYPASS_TELEGRAM_AUTH=true  - it's true during the tests
5. Provide this in .env.local for tests:
NEXT_PUBLIC_BYPASS_TELEGRAM_AUTH=true - it's true during the tests
6. Generate prisma schema
npx prisma generate
7. Seed the database with test tasks
npx prisma db seed
8. Now you can run the app
npm run dev

9. See the files "prisma/seed.ts" and "utils/game-mechanics.ts"
10. Check the code and customize it

I WILL RELEASE A VIDEO WITH INSTRUCTIONS FOR USERS WHO BOUGHT THE CODE ON MY YOUTUBE CHANNEL. 
YOU WILL SEE HOW TO RUN THE CODE ON VERCEL AND CREATE A TELEGRAM MINI APP WITH IT. 
STAY TUNED WITH YOUTUBE UPDATES. 

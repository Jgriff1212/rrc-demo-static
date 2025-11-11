#!/bin/bash

# Reveal App Setup Script
# Automates initial setup for development

set -e

echo "🎯 Setting up Reveal App..."
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18.0.0"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn not found. Please install Yarn >= 1.22.0"
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Install from: https://supabase.com/docs/guides/cli"
    read -p "Continue without Supabase CLI? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Prerequisites checked"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
yarn install
echo "✅ Dependencies installed"
echo ""

# Setup Supabase
if command -v supabase &> /dev/null; then
    echo "🗄️  Setting up Supabase..."
    read -p "Start local Supabase instance? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd supabase
        supabase start
        echo ""
        echo "✅ Supabase started"
        echo "📋 Copy the API URL and anon key from above to your .env file"
        cd ..
    fi
    echo ""
fi

# Setup mobile app environment
echo "📱 Setting up mobile app..."
if [ ! -f apps/mobile/.env ]; then
    cp apps/mobile/.env.example apps/mobile/.env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit apps/mobile/.env with your Supabase credentials"
else
    echo "⚠️  .env file already exists, skipping..."
fi
echo ""

# Summary
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit apps/mobile/.env with your Supabase URL and keys"
echo "2. Run 'yarn mobile' to start the development server"
echo "3. Run 'yarn mobile:ios' or 'yarn mobile:android' to launch the app"
echo ""
echo "For more information, see README.md"

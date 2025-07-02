# Expo Go with Tunneling Setup Guide

This guide explains how to run the Algebra Training App using Expo Go with tunneling enabled, allowing you to test the app on physical devices from anywhere.

## Prerequisites

### 1. Development Environment
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Expo CLI**: Installed globally

```bash
# Install Expo CLI globally if not already installed
npm install -g @expo/cli
```

### 2. Mobile Device Setup
- **Expo Go App**: Download from App Store (iOS) or Google Play (Android)
- **Same Network**: Not required with tunneling (this is the advantage!)
- **Expo Account**: Create account at expo.dev and sign in on both your computer and mobile device

### 3. Project Dependencies
Ensure all project dependencies are installed:

```bash
# Navigate to project directory
cd /path/to/algebra-app

# Install dependencies
npm install
```

## Step-by-Step Process

### 1. Navigate to Project Directory
```bash
cd /Users/autumn/projects/work/algebra-app
```

### 2. Start Expo Development Server with Tunneling
```bash
npx expo start --tunnel
```

**What this command does:**
- Starts the Expo development server
- Enables tunneling via ngrok (creates a public URL)
- Generates QR codes for easy mobile connection
- Allows connections from anywhere in the world

### 3. Wait for Server Initialization
You should see output similar to:
```
Starting Metro Bundler
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Using Expo Go
› Press s │ switch to development build
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press d │ show developer menu
› Press shift+d │ toggle auto opening developer menu
› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```

### 4. Connect Mobile Device

#### Method 1: QR Code (Recommended)
1. Open **Expo Go** app on your mobile device
2. Sign in with your Expo account
3. Use the app to scan the QR code displayed in your terminal
4. The app will download and launch automatically

#### Method 2: Manual URL Entry
1. Look for the tunnel URL in the terminal output (starts with `exp://`)
2. Open Expo Go app
3. Manually enter the URL in the app

### 5. Development Workflow
- **Live Reload**: Changes to your code will automatically reload the app
- **Hot Reload**: Some changes apply instantly without full reload
- **Developer Menu**: Shake your device or press `d` in terminal to access

## Verifying the Process is Working

### Check Server Status
To verify the Expo server and tunneling are running:
```bash
# In a new terminal window, check running processes
ps aux | grep expo

# You should see processes like:
# - expo start --tunnel
# - ngrok start (tunneling process)
```

### Expected Terminal Output
Look for these indicators in your terminal:
- ✅ "Metro waiting on exp://..."
- ✅ QR code displayed as ASCII art
- ✅ "Using Expo Go" message
- ✅ Command menu with options (press r, d, etc.)

### Mobile Device Connection Signs
- Expo Go app successfully scans QR code
- App begins downloading/loading
- You see the algebra app interface on your device
- Navigation between tabs works
- No immediate error messages

## Important Notes for This Algebra App

### MathLive Integration
This app uses MathLive for mathematical input, which requires:
- **Development Build**: MathLive won't work in Expo Go due to DOM components
- **Physical Device Testing**: For full functionality, you'll need to create a development build

```bash
# To create a development build for testing MathLive
npx eas build --profile development --platform ios
# or
npx eas build --profile development --platform android
```

### Database Dependencies
The app uses SQLite, which works in Expo Go but:
- Data is sandboxed per session
- Database resets when reloading the app
- For persistent testing, use development builds

## Troubleshooting

### 1. Tunnel Connection Issues
If tunneling fails to start:
```bash
# Kill any existing Expo processes
pkill -f "expo\|metro"

# Clear Expo cache
npx expo r -c

# Restart with tunnel
npx expo start --tunnel --clear
```

### 2. QR Code Not Working
- Ensure both devices are logged into the same Expo account
- Try the manual URL method
- Check your internet connection
- Restart the Expo Go app

### 3. App Won't Load
```bash
# Clear cache and restart
npx expo r -c
npx expo start --tunnel
```

### 4. Slow Loading
- Tunneling can be slower than local network
- First load takes longer as it downloads the bundle
- Subsequent loads are faster due to caching

### 5. MathLive Features Not Working
This is expected in Expo Go. For full MathLive functionality:
```bash
# Create development build
npx eas build --profile development --platform [ios|android]
```

## Alternative: Local Network Testing

If you're on the same network and want faster performance:
```bash
# Start without tunnel (faster but requires same network)
npx expo start

# Start with LAN for network access
npx expo start --lan
```

## Stopping the Development Server

To stop the server:
- Press `Ctrl+C` in the terminal where Expo is running
- Or close the terminal window
- Verify processes stopped: `ps aux | grep expo` (should show no results)

## Environment Variables

For this project, ensure these environment variables are set if testing problem generation:
```bash
export OPENAI_API_KEY="your-openai-key"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export AWS_REGION="us-east-1"
export S3_BUCKET_NAME="your-s3-bucket"
```

## Security Considerations

- Tunneling creates a public URL temporarily
- Don't share the tunnel URL with untrusted parties
- The tunnel automatically closes when you stop the development server
- No permanent exposure of your development environment

## Next Steps

1. **Test Core Features**: Navigate through the app and test basic functionality
2. **Test Math Input**: Try the Training tab for MathLive features (may be limited in Expo Go)
3. **Generate Problems**: Test problem loading and answering
4. **Check Progress**: Verify progress tracking works
5. **Development Build**: For full testing, create a development build

## Success Checklist

- [ ] Expo development server started with `--tunnel`
- [ ] QR code generated and displayed
- [ ] ngrok tunneling process running
- [ ] Mobile device connected via Expo Go
- [ ] App loads successfully on mobile device
- [ ] Can navigate between tabs
- [ ] Can answer problems (basic input)
- [ ] Progress tracking works
- [ ] Live reload working for development

---

**Created**: December 2024
**App**: Algebra Training App
**Purpose**: Mobile testing with Expo Go tunneling
**Status**: ✅ Process successfully started and documented

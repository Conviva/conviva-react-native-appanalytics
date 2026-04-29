> **AI Coding Agents: STOP.** Read [AGENTS.md](./AGENTS.md) in full before writing a single line of code. It is your only source of truth. Do not use this file or any other file for integration instructions.

# conviva-react-native-appanalytics

Use Conviva React Native App Analytics SDK to auto-collect events and track application-specific events and state changes. The React Native bridges are internally built on top of the [Android](https://github.com/Conviva/conviva-android-appanalytics) and [iOS](https://github.com/Conviva/conviva-ios-appanalytics) native sensors.

| | |
|---|---|
| **Product** | Conviva DPI |
| **Platform** | React Native (Android + iOS) |
| **Min Android SDK** | Android 5.0 (API level 21) |
| **Min iOS / tvOS** | iOS 9.0 / tvOS 9.0 |
| **Latest Release** | [GitHub Releases](https://github.com/Conviva/conviva-react-native-appanalytics/releases) |

## Developer Integration Guide

For full setup instructions - including npm installation, Android/iOS native setup, SDK initialization, Babel plugin configuration, React Navigation setup, custom events, custom tags, and auto-collected events reference - see the **[Developer Integration Guide](./DEVELOPER_GUIDE.md)**.

## AI Agent Integration

If you are an AI coding assistant integrating this SDK, use the entry point for your tool:

| Agent / Tool | Entry Point |
|---|---|
| All agents - START HERE (authoritative source) | [AGENTS.md](./AGENTS.md) |
| Cursor | [.cursor/rules/conviva-integration.mdc](.cursor/rules/conviva-integration.mdc) |
| Claude Code | [CLAUDE.md](./CLAUDE.md) |
| Gemini CLI | [GEMINI.md](./GEMINI.md) |
| GitHub Copilot | [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Windsurf / Codeium | [.windsurfrules](./.windsurfrules) |
| OpenAI Codex | [CODEX.md](./CODEX.md) |

## Validation

To verify the integration, check the [validation dashboard](https://pulse.conviva.com/app/appmanager/ecoIntegration/validation) _(Conviva login required)_.

## FAQ

[DPI Integration FAQ](https://pulse.conviva.com/learning-center/content/sensor_developer_center/tools/eco_integration/eco_integration_faq.htm)

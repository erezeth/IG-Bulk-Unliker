# IG Like Cleaner

IG Like Cleaner is a Chrome/Brave extension built with Manifest V3. It helps you remove liked posts from Instagram's **Your Activity → Likes** page using batch actions.

> **Disclaimer:** This extension is intended for managing your own likes history. Use it at your own risk. Running actions too quickly may lead Instagram to temporarily restrict your account. The author is not responsible for any consequences.

## Features

- **Batch processing:** Select a set number of posts, unlike them, confirm the dialog, and continue until the target is reached.
- **Multiple click methods:** Tries synthetic events, `.click()`, keyboard input, and a trusted click through Chrome DevTools Protocol as a fallback.
- **Strategy detection:** Remembers which click method worked and tries it first in later batches.
- **English and Indonesian labels:** Supports both languages and can be extended in `content.js`.
- **Floating control panel:** Uses Shadow DOM to keep the extension UI separate from Instagram's page. The panel can be minimized.
- **Restriction detection:** Stops when it detects messages such as "Try again later" or "Action blocked".
- **Diagnostics and logs:** Inspect page elements and copy logs for troubleshooting.
- **Batch delays:** Waits between batches to reduce the pace of automated actions.

## Installation

### 1. Download the repository

Clone the repository:

    git clone https://github.com/USERNAME/ig-like-cleaner.git

Alternatively, extract `ig-like-cleaner.zip` if you downloaded a release.

### 2. Load the extension

1. Open `chrome://extensions` in Chrome, or `brave://extensions` in Brave. Edge users can open `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `ig-like-cleaner` folder.
4. If the extension is already installed, click **Reload**.
5. Refresh the open Instagram tab.

## Usage

1. Open Instagram's **Your Activity → Likes** page, or use **Open Likes page** in the extension panel.
2. The IG Like Cleaner panel should appear in the bottom-right corner.
3. Set the options:
   - **Batch size:** Number of posts to process in each cycle (1–300, default: 25).
   - **Total target:** Maximum number of posts to unlike. Set to `0` to process all available posts.
4. Click **Start**.

For each batch, the extension enters selection mode, selects posts, clicks **Unlike** or **Delete**, and confirms the dialog if prompted. It then waits around 5–10 seconds before continuing.

Click **Stop** whenever you want to end the process.

### Panel buttons

| Button | Description |
| --- | --- |
| **Diagnostics** | Logs information about checkboxes, buttons, post tiles, and dialogs. |
| **Copy log** | Copies the current log for troubleshooting or bug reports. |
| **Minimize** | Collapses the panel into a small Like Cleaner button. |

## Permissions

| Permission | Purpose |
| --- | --- |
| `debugger` | Uses Chrome DevTools Protocol's `Input.dispatchMouseEvent` as a fallback when regular click methods fail. |
| Content script on `https://www.instagram.com/*` | Adds the control panel and automation logic to Instagram pages. |

When the trusted-click fallback is used, Chrome or Brave may show a "debugging this browser" bar. This is expected while the debugger session is active and should disappear when the process stops or the session disconnects.

## Project structure

    ig-like-cleaner/
    ├── manifest.json      # Manifest V3 configuration
    ├── background.js      # Trusted-click fallback through CDP
    ├── content.js         # UI and automation logic
    └── README.md

## How it works

`content.js` tries these click methods in order:

1. Synthetic click using `PointerEvent` and `MouseEvent`.
2. `element.click()`.
3. Direct event dispatch.
4. Simulated Enter key.
5. Trusted click through Chrome DevTools Protocol.

When a method works, the extension stores it in the `best` variable and tries that method first in later batches.

The content script communicates with `background.js` when it needs the trusted-click fallback.

## Adding languages

Button labels are defined in the `T` object in `content.js`. Add translations that match the labels shown in your Instagram interface.

    const T = {
      select: [
        'select',
        'pilih',
        'auswählen',
        'sélectionner'
      ],

      unlike: [
        'unlike',
        'batal suka',
        'gefällt mir nicht mehr',
        'ne plus aimer'
      ],

      cancel: [
        'cancel',
        'batal',
        'abbrechen',
        'annuler'
      ]
    };

Use lowercase labels to match the extension's text-matching logic.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| The panel does not appear | Reload the extension, then refresh the Instagram tab. |
| "Select button not found" | Make sure you're on `/your_activity/interactions/likes/`. Run Diagnostics and check the logged button labels. |
| Click methods fail | Instagram may have changed its page structure. Run Diagnostics and inspect the logs. |
| Instagram restriction detected | Stop the process and avoid immediately starting it again. |
| The debugging bar stays visible | Click Stop or close the Instagram tab to disconnect the debugger session. |
| A `chrome://` URL access error appears | Reload the extension from `chrome://extensions`, then refresh Instagram. |

## Development

After editing the extension:

1. Open `chrome://extensions`.
2. Click **Reload** on IG Like Cleaner.
3. Refresh the Instagram tab.
4. Open **DevTools → Console** to view messages prefixed with `[IG Like Cleaner]`.

The extension also displays logs in its control panel. Use **Copy log** when reporting an issue.

## Limitations

- Designed for Instagram's **Your Activity → Likes** page.
- Relies on Instagram's page structure, which may change without notice.
- Automated actions can still trigger account restrictions. Delays do not guarantee that restrictions will be avoided.
- The `debugger` permission is powerful and may trigger browser warnings. Review the code and only use the extension if you're comfortable granting that permission.

## License

This project is released under the MIT License. When redistributing it, include attribution and a copy of the license.

## Contributing

Issues and pull requests are welcome, particularly for:

- Adding labels for more languages.
- Updating selectors when Instagram changes its interface.
- Improving restriction detection.
- Improving stability and error handling.

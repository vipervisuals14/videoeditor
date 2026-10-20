# Installing Cutline on macOS

Ten minutes, most of it waiting for packages. You end up with Cutline in
Resolve's **Workspace → Scripts** menu and a drop folder for footage.

## Two folders, two jobs

After installing you will have two folders with similar names. That is correct;
they do different things and neither should be moved into the other.

| Folder | What it is |
|---|---|
| `~/cutline` | The program: code, installer, `.venv`. Lives in your Home folder. |
| `~/Movies/Cutline` | Your work folder: `inbox/` (drop clips), `latest/` (the built timeline), `config.json`, `logs/`. Created by the installer. |

## Easiest way — no Terminal

If Terminal is not your thing, use the one-click installer:

1. Download it:

   <https://github.com/vipervisuals14/videoeditor/raw/arena/baa7f9aa-videoeditor/downloads/cutline-installer.zip>

2. Double-click the downloaded `cutline-installer.zip` to unzip it.
3. Double-click **Start Fresh.command** (it also does a normal first install).

   macOS will probably stop it once with **“Apple could not verify … is free of
   malware”**. That is expected for an unsigned script. Click **Done** (not
   “Move to Bin”), then:

   - Open **System Settings → Privacy & Security**.
   - Scroll down to **Security**. You will see that
     `Install Cutline.command` was blocked — click **Open Anyway**.
   - Enter your Mac password (or Touch ID), then click **Open** in the dialog
     that follows.

   You only do this once. If the alert has no “Open Anyway” anywhere (older
   macOS), right-clicking the file and choosing **Open** does the same thing.
4. Leave the Terminal window open until it says **Cutline is installed.**
   It finds your Cutline folder, installs everything, adds the Resolve menu,
   starts the watcher, and opens the drop folder.
5. **Quit DaVinci Resolve completely (Cmd+Q), reopen it**, open a project, then
   use **Workspace → Scripts → Cutline - check bridge**.

   **If nothing happens:** quit Resolve and reopen it — it reads the Scripts
   folder only at launch. If the entry still does nothing, open
   **Workspace → Console**, switch the language to **Lua**, and run
   `print(app:GetResolve())`. On 21.1 Free the `resolve` global is nil and the
   live handle is on `app`; the shipped scripts already use that path, but the
   check tells you whether Resolve is answering at all.

The installer expects the Cutline folder at `~/cutline` (your home folder). If
it says it cannot find it, move the unzipped folder into your home folder, rename
it `cutline`, and double-click the installer again.

Everything below is the same install done by hand, for when you want to see or
control each step.

## Manual install (Terminal)

### 0. What you need

- macOS (Intel or Apple Silicon)
- DaVinci Resolve — **Free is fine**, 18.5 or newer (built against 21.x)
- **Python 3.10 or newer** — **3.11 or 3.12 recommended**. Newer versions
  sometimes have no prebuilt wheels yet for the optional speech engine.
- Internet for the first install only

Check Python first. Open **Terminal** (Applications → Utilities → Terminal) and run:

```bash
python3 --version
```

If it prints `3.9.x` or lower, install Python from
[python.org/downloads](https://www.python.org/downloads/macos/) (3.11 or 3.12 is
fine), then open a **new** Terminal window and check again. Do not skip this:
macOS ships 3.9, and the engine needs 3.10+.

### 1. Get the Cutline folder

**Option A — download (no git needed).** Download this zip:

<https://github.com/vipervisuals14/videoeditor/archive/refs/heads/arena/baa7f9aa-videoeditor.zip>

It unzips to `videoeditor-arena-baa7f9aa-videoeditor`. Move it somewhere stable —
your home folder is the best place — and rename it:

```bash
cd ~/Downloads
unzip videoeditor-arena-baa7f9aa-videoeditor.zip
mv videoeditor-arena-baa7f9aa-videoeditor ~/cutline
cd ~/cutline
```

**Option B — git.**

```bash
cd ~
git clone -b arena/baa7f9aa-videoeditor https://github.com/vipervisuals14/videoeditor.git cutline
cd ~/cutline
```

Keep it at `~/cutline`, not Desktop or Documents. A background watcher reading
those folders can hit macOS privacy prompts; your home folder avoids that.

### 2. Install the engine

```bash
bash install.sh
```

Use `bash install.sh` rather than `./install.sh` — that avoids the “permission
denied” message if the zip lost its executable bit.

This creates `.venv/`, installs FFmpeg and the timeline libraries, tries to add
local speech-to-text, and writes a launcher. It takes a few minutes. If the
speech model fails to install, captions still work from an `.srt` file.

### 3. Put Cutline inside Resolve

```bash
./bin/cutline resolve-install
./bin/cutline resolve-agent
```

- `resolve-install` writes three small scripts into Resolve's user Scripts folder
  and creates the drop folder at `~/Movies/Cutline`.
- `resolve-agent` installs **and starts** a background watcher, so builds happen
  without a Terminal window open.

Then **quit DaVinci Resolve completely and reopen it.** Resolve only reads the
Scripts folder at launch. This is the step people miss.

### 4. Check that it is wired up

In Resolve: **Workspace → Scripts → Cutline - check bridge**.

On **21.1 Free** this entry can do nothing: that build gates the project API to
Studio. Use **File → Import → Timeline** instead; the rest of the pipeline is
unaffected.

A timeline named `Cutline: bridge ready (Cutline import)` appears in the media
pool. That is the success signal — the free edition mutes `print()`, so a
timeline name is how the script reports back.

If the menu only shows `Cutline - import latest`, that is fine too; run it with
an empty drop folder and it creates `Cutline: nothing imported (run resolve-status)`.

### 5. Make your first cut

1. Put a clip in `~/Movies/Cutline/inbox/`
   (optional: an `.srt` with the same name becomes the captions).
2. Wait 10–30 seconds. Check progress any time:

   ```bash
   ./bin/cutline resolve-status
   ```

   You want `Latest: …` with a duration, clip count, and track list.
3. In Resolve: **Workspace → Scripts → Cutline - import latest**.

The cut lands in the media pool and opens in the Edit page: program on V1,
transitions on V2, captions on V3, collage on V5, viewfinder on V6, audio on A1.

## Changing the look or mode

Edit `~/Movies/Cutline/config.json` in any text editor. `mode` is `social`,
`vlog`, or `music`; vlogs choose `look` `journal` or `viewfinder`. Changes apply
on the next build. The full key table is in
[inside-resolve.md](inside-resolve.md).

## Updating later

**If you downloaded the zip:** download the newer zip and replace `~/cutline`,
then re-run:

```bash
./bin/cutline resolve-install
```

The menu scripts bake in absolute paths, so they must be rewritten if the folder
moves or is replaced.

**If you cloned:** `cd ~/cutline && git pull`, then `bash install.sh` only if
`requirements.txt` changed, then `./bin/cutline resolve-install`.

## Troubleshooting

**`python3 --version` is 3.9.** Install Python 3.10+ from python.org and open a
new Terminal. `install.sh` picks the newest `python3.x` it finds.

**`bash: install.sh: No such file or directory`.** You are not in the Cutline
folder. `cd ~/cutline` first; `ls` should show `install.sh` and `cutline/`.

**No Cutline entries in the Scripts menu.** Resolve was not restarted, or the
files went to a different user account's folder. Check:

```bash
ls ~/Library/Application\ Support/Blackmagic\ Design/DaVinci\ Resolve/Fusion/Scripts/Utility/
```

You should see `Cutline - import latest.lua` and two companions. If they are
there, quit Resolve (Cmd+Q, not just close the window) and reopen.

**`resolve-agent` says the login item failed to load.** Load it by hand:

```bash
launchctl load ~/Library/LaunchAgents/com.cutline.watch.plist
```

If it still refuses, skip the background service and keep a Terminal open with
`./bin/cutline resolve-watch` while you work.

**Nothing happens on import.** The engine may have nothing built yet —
`./bin/cutline resolve-status` says which. If it shows a finished cut but the
import still refuses, use **File → Import → Timeline** on
`~/Movies/Cutline/latest/timeline.otio`; that path works on every Resolve build.
Tell me your exact Resolve version in that case.

**“Apple could not verify ‘Install Cutline.command’ is free of malware.”**
Click **Done**, then allow it in **System Settings → Privacy & Security →
Security → Open Anyway**, authenticate, and click **Open**.

The other route avoids that dialog entirely — run the script *through* Terminal
instead of launching it:

```bash
bash ~/Downloads/Install\ Cutline.command
```

That is still one line, and it is how the file would run if Apple had signed it.
If the file is not in Downloads, drag it into the Terminal window after typing
`bash ` (with a space) to fill in the path.

**Install stops with `pkg-config is required for building PyAV`.** The one-click
installer already skips the speech engine in this case, so the simplest fix is to
use it. Manually: The optional
speech engine has no prebuilt wheel for this Python version, so pip tried to
compile it. Cutline itself does not need it. Remove that one line and install
without captions:

```bash
cd ~/cutline
sed -i '' '/faster-whisper/d' requirements.txt
CUTLINE_SKIP_ASR=1 bash install.sh
```

To get automatic captions later, install **Python 3.12** from python.org, delete
`~/cutline/.venv`, and run `bash install.sh` again (it picks the newest
`python3.x`). Comfortable with Homebrew? `brew install pkg-config ffmpeg` also
lets pip build PyAV, but the wheel route is more reliable.

**Captions are missing.** Either no `.srt` was supplied and speech-to-text is not
installed, or the clip has no audio. Drop an `.srt` beside the clip and rebuild:
`./bin/cutline resolve-build`.

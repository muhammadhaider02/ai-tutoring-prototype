# Haider-PlayX

## How to Install FFmpeg on Windows

### Download FFmpeg Windows build

- Go to: https://www.gyan.dev/ffmpeg/builds/
- Scroll down to "Release builds"
- Click "ffmpeg-git-full.7z" or "ffmpeg-release-full.7z" under Windows Builds by BtbN.

### Extract the downloaded archive

- Use 7-Zip or WinRAR to extract.
- You'll get a folder like ffmpeg-2025-08-26-git-full.

### Move and rename the folder

- Move that folder to C:\ffmpeg
- Rename it simply to ffmpeg.

### Add FFmpeg to PATH

- Press Win+R, type sysdm.cpl, hit Enter.
- Go to Advanced → Environment Variables.
- In System variables, find Path → Edit → New.
- Add:
  ```
  C:\ffmpeg\bin
  ```
- Click OK.

### Verify installation

- Open PowerShell or CMD and run:
  ```
  ffmpeg -version
  ```
- If you see version details, you're good.

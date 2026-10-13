#!/usr/bin/env python3
"""Salin aset web dari repo kuis web ke dalam APK.

Jalankan:
    python tools/sync-assets.py [folder-repo-web]

Default folder sumber: ../korean-quiz (repo kuis web DeepSeek Harness).
Hasil salinan masuk ke app/src/main/assets/, yang ikut dibundel ke dalam APK.

Berkas web TIDAK diubah sama sekali oleh skrip ini — salinannya identik.
"""

import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "app", "src", "main", "assets")

# Berkas & folder yang perlu ada di dalam APK.
ENTRIES = [
    "index.html",
    "manifest.json",
    "sw.js",
    "css",
    "js",
    "icons",
]


def human(size):
    for unit in ("B", "KB", "MB"):
        if size < 1024 or unit == "MB":
            return f"{size:.1f} {unit}" if unit != "B" else f"{size} B"
        size /= 1024.0
    return f"{size:.1f} MB"


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "korean-quiz")
    source = os.path.abspath(source)

    if not os.path.isdir(source):
        raise SystemExit(f"Folder sumber tidak ditemukan: {source}")
    if not os.path.isfile(os.path.join(source, "index.html")):
        raise SystemExit(f"Tidak ada index.html di {source} — bukan repo kuis web?")

    if os.path.isdir(TARGET):
        shutil.rmtree(TARGET)
    os.makedirs(TARGET)

    total = 0
    count = 0
    for entry in ENTRIES:
        src = os.path.join(source, entry)
        if not os.path.exists(src):
            print(f"  lewat  {entry} (tidak ada di sumber)")
            continue

        dst = os.path.join(TARGET, entry)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)

        for dirpath, _dirnames, filenames in os.walk(dst) if os.path.isdir(dst) else [("", [], [dst])]:
            for name in filenames:
                total += os.path.getsize(os.path.join(dirpath, name))
                count += 1
        if os.path.isfile(dst):
            pass
        print(f"  salin  {entry}")

    print(f"\n{count} berkas, {human(total)} -> {os.path.relpath(TARGET, ROOT)}")


if __name__ == "__main__":
    main()

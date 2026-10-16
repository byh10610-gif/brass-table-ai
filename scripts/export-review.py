"""Export a standalone review HTML without installation or update requests."""
import argparse
import re
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path, help="Where to write the standalone HTML")
args = parser.parse_args()
source = (Path(__file__).resolve().parents[1] / "index.html").read_text()
source = source.replace('<html lang="ko">', '<html lang="ko" data-review-preview>', 1)
header = 'function header(){return `<header'
assert source.count(header) == 1, "Header has changed; check the review banner insertion."
source = source.replace(
    header,
    'function header(){return `<div class="review-banner"><span>지도 기능 검토용 · GitHub 반영 전</span> '
    '<button type="button" data-act="map">지도 기능 살펴보기</button></div><header',
    1,
)
pwa = "(() => {\n  const PWA_APP_VERSION = APP_VERSION;"
assert source.count(pwa) == 1, "Check the PWA block before exporting."
source = source.replace(
    pwa,
    "(() => {\n  if(document.documentElement.hasAttribute('data-review-preview')){"
    "document.getElementById('pwa-update-control')?.remove();return;}\n"
    "  const PWA_APP_VERSION = APP_VERSION;",
    1,
)
# Images, CSS, the game engine and both language packs are already inline.
# These optional installation links require neighboring files, so omit them.
source = re.sub(r'<link\b[^>]*\brel="(?:manifest|apple-touch-icon|icon)"[^>]*>', '', source)
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(source, encoding="utf-8")
print(f"Created {args.output} ({args.output.stat().st_size:,} bytes)")

import os
import shutil
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).parent
CONTENT = ROOT / "content" / "konular"
OUT = ROOT / "_site"
BASE = os.environ.get("BASE_URL", "")

env = Environment(loader=FileSystemLoader(ROOT / "templates"))

# Sol menüde görünecek bölümler
NAV = [
    {"href": "/", "title": "Ana Sayfa", "icon": "🏠"},
    {"href": "/konular/", "title": "Konu Anlatımı", "icon": "📚"},
    {"href": "/quizler/", "title": "Quizler", "icon": "📝"},
    {"href": "/periyodik-cetvel/", "title": "Periyodik Cetvel", "icon": "🧪"},
    {"href": "/deneyler/", "title": "Deneyler", "icon": "🔬"},
    {"href": "/sozluk/", "title": "Kimya Sözlüğü", "icon": "📖"},
    {"href": "/hesaplayicilar/", "title": "Hesaplayıcılar", "icon": "🧮"},
    {"href": "/ilerleme/", "title": "İlerlemem", "icon": "📈"},
    {"href": "/hakkinda/", "title": "Hakkında / İletişim", "icon": "ℹ️"},
]
env.globals["nav"] = NAV

# Henüz içeriği hazır olmayan sayfalar
PLACEHOLDER_PAGES = {
    "quizler": ("Quizler", "Konulara göre ayrılmış testler burada olacak."),
    "periyodik-cetvel": ("Periyodik Cetvel", "118 elementin etkileşimli cetveli burada olacak."),
    "deneyler": ("Deneyler", "Deney anlatımları ve videoları burada olacak."),
    "sozluk": ("Kimya Sözlüğü", "Kimya terimlerinin açıklamaları burada olacak."),
    "hesaplayicilar": ("Hesaplayıcılar", "Mol, molarite ve benzeri hesaplayıcılar burada olacak."),
    "ilerleme": ("İlerlemem", "Çözdüğün testler ve puanların burada görünecek."),
    "hakkinda": ("Hakkında / İletişim", "Site ve iletişim bilgileri burada olacak."),
}


def read_md(path):
    text = path.read_text(encoding="utf-8")
    meta, body = {}, text
    if text.startswith("---"):
        _, front, body = text.split("---", 2)
        meta = yaml.safe_load(front) or {}
    html = markdown.markdown(body, extensions=["tables", "fenced_code", "toc"])
    return meta, html


def render(template, out_path, **ctx):
    html = env.get_template(template).render(base=BASE, **ctx)
    target = OUT / out_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8")


def collect_categories():
    categories = []
    for cat_dir in sorted(p for p in CONTENT.iterdir() if p.is_dir()):
        info = {}
        info_file = cat_dir / "_kategori.yaml"
        if info_file.exists():
            info = yaml.safe_load(info_file.read_text(encoding="utf-8")) or {}
        topics = []
        for md in cat_dir.glob("*.md"):
            meta, html = read_md(md)
            topics.append({
                "slug": md.stem,
                "title": meta.get("baslik", md.stem),
                "order": meta.get("sira", 99),
                "html": html,
            })
        topics.sort(key=lambda t: (t["order"], t["title"]))
        categories.append({
            "slug": cat_dir.name,
            "title": info.get("baslik", cat_dir.name.replace("-", " ").title()),
            "description": info.get("aciklama", ""),
            "topics": topics,
        })
    return categories


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    if (ROOT / "static").exists():
        shutil.copytree(ROOT / "static", OUT / "static")

    categories = collect_categories()

    # Ana sayfa ve konu listesi
    render("index.html", "index.html", categories=categories)
    render("konular.html", "konular/index.html", categories=categories)

    # Kategori ve konu sayfaları
    for cat in categories:
        render("kategori.html", f"konular/{cat['slug']}/index.html",
               cat=cat, categories=categories)
        for topic in cat["topics"]:
            render("konu.html", f"konular/{cat['slug']}/{topic['slug']}/index.html",
                   cat=cat, topic=topic, categories=categories)

    # Henüz hazır olmayan sayfalar
    for slug, (title, desc) in PLACEHOLDER_PAGES.items():
        render("sayfa.html", f"{slug}/index.html", title=title, desc=desc)

    # Üyelik sayfaları
    render("giris.html", "giris/index.html")
    render("kayit.html", "kayit/index.html")
    render("profil.html", "profil/index.html")

    print(f"{len(categories)} kategori üretildi.")


if __name__ == "__main__":
    main()

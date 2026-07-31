#!/usr/bin/env python3
"""Shared access to the WordPress XML export.

The export is treated as strictly read-only source material. Paths resolve
relative to this file so the tools work from any checkout; set HDT_EXPORTS to
point at the directory holding the exports if it is not the project's parent.
"""
import glob
import os
import xml.etree.ElementTree as ET

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('HDT_EXPORTS', os.path.dirname(PROJ))

NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
}


def find_export(pattern: str) -> str:
    """Locate a source export, preferring the largest match (the full dump)."""
    matches = sorted(glob.glob(os.path.join(SRC, pattern)), key=os.path.getsize, reverse=True)
    if not matches:
        raise SystemExit(
            f'Could not find {pattern!r} in {SRC!r}.\n'
            'Set HDT_EXPORTS to the directory holding the WordPress exports.'
        )
    return matches[0]


def xml_path() -> str:
    return find_export('*.WordPress.*.xml')


def csv_path() -> str:
    return find_export('wc-product-export-*.csv')


def channel():
    return ET.parse(xml_path()).getroot().find('channel')


def items(post_type: str):
    """Yield (item, postmeta dict) for every item of the given post type."""
    for item in channel().findall('item'):
        if item.findtext('wp:post_type', namespaces=NS) != post_type:
            continue
        meta = {
            m.findtext('wp:meta_key', namespaces=NS):
                (m.findtext('wp:meta_value', namespaces=NS) or '')
            for m in item.findall('wp:postmeta', namespaces=NS)
        }
        yield item, meta


def text(item, tag: str) -> str:
    return item.findtext(tag, namespaces=NS) or ''

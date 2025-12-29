#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert YAML prompt files to JavaScript format
"""
import yaml
import json
import os
from pathlib import Path

# Paths
yml_dir = Path(r'F:\003.stable-diffusion\stable-diffusion-webui\extensions\sdweb-easy-prompt-selector\tags')
output_file = Path(r'F:\003.stable-diffusion\sd-vue-ui\src\data\promptsData.js')

# Ensure output directory exists
output_file.parent.mkdir(parents=True, exist_ok=True)

# Category icons mapping
category_icons = {
    '구도': '📷',
    '인물': '👤',
    '얼굴': '😊',
    '머리카락': '💇',
    '복장': '👗',
    '의상-니트': '🧶',
    '손 위치': '✋',
    '포즈': '🕺',
    '관능포즈': '💃',
    '감정': '😄',
    '장소': '🌆',
    '피부': '✨',
    '부정': '⛔',
    'Ayo': '🎵',
}

# Read all YAML files
all_categories = {}

for yml_file in sorted(yml_dir.glob('*.yml')):
    category_name = yml_file.stem

    with open(yml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    if not data:
        continue

    # Get icon or use default
    icon = category_icons.get(category_name, '📝')

    # Process each subcategory
    prompts = []
    for subcategory, items in data.items():
        if not isinstance(items, dict):
            continue

        for label_kr, prompt_en in items.items():
            # Clean up label
            label = label_kr.replace('_', ' ')

            prompts.append({
                'label': label,
                'text': prompt_en,
                'subcategory': subcategory
            })

    if prompts:
        all_categories[category_name] = {
            'name': category_name,
            'icon': icon,
            'prompts': prompts
        }

# Generate JavaScript file
js_content = '''/**
 * Auto-generated from YAML files
 * Do not edit manually - use convert-yml-to-js.py
 */

export const promptCategories = '''

js_content += json.dumps(all_categories, ensure_ascii=False, indent=2)

# Write to file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'Converted {len(all_categories)} categories to {output_file}')
print(f'Categories: {", ".join(all_categories.keys())}')

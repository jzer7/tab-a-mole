#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGES_DIR="$PROJECT_DIR/images"
SIZES=(16 32 48 128)

function GenerateIcon {
    local svg_file="$1"
    local dir_name
    local base_name
    local _sizes=("${SIZES[@]}")

    dir_name="$(dirname "$svg_file")"
    base_name="$(basename "$svg_file" .svg)"

    # If the file name ends with -<size>, create only that size
    if [[ "$base_name" == *"-"* ]]; then
        local suffix="${base_name##*-}"
        if [[ "$suffix" =~ ^[0-9]+$ ]]; then
            _sizes=("$suffix")
            base_name="${base_name%-*}"
        fi
    fi

    for size in "${_sizes[@]}"; do
        local output_file="$dir_name/${base_name}-$size.png"
        rsvg-convert -w "$size" -h "$size" "$svg_file" -o "$output_file"
    done
}

## MAIN

# TODO: On macOS, you can use qlmanage to generate thumbnails instead, but
# it is less flexible:
#   qlmanage -t -s 128 -i -o . banned-stack.svg

if ! command -v rsvg-convert &>/dev/null; then
    echo "rsvg-convert could not be found."
    echo "On macOS, you can install it via Homebrew: brew install librsvg"
    exit 1
fi

find "$IMAGES_DIR" -name "*.svg" | while read -r svg_file; do
    echo "Generating icons for $svg_file"
    GenerateIcon "$svg_file"
done

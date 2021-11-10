#! /bin/bash
# 192 144 96 72 48 36
declare -ar sizes=(192 144 96 72 48 36)
declare -r here=`dirname $0`

if command -v inkscape &> /dev/null; then
	for svg in $(ls ./${here}/*.svg); do
		for size in (192 144 96 72 48 36); do
			inkscape "${svg}" -h $size -e "${svg%.svg}-${size}.png"
		done
	done
fi

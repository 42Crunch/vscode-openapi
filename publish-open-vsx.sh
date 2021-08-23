#!/bin/sh -e
OVSX_TOKEN=`pass show work/open-vsx-token`

rm -f extension.vsix
npx vsce package --out extension.vsix
npx ovsx publish --pat $OVSX_TOKEN extension.vsix

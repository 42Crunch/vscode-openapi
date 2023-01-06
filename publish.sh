#!/bin/sh -e

VSCE_TOKEN=`pass show work/vsce-token | sed -n '1p'`
npx vsce publish --pat $VSCE_TOKEN 

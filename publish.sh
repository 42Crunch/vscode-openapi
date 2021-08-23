#!/bin/sh -e

VSCE_TOKEN=`pass show work/vsce-token`
npx vsce publish --pat $VSCE_TOKEN 

#!/bin/sh
echo -e '\033]2;CarePackageServer\007'
/usr/bin/x-terminal-emulator -e /usr/bin/npm --prefix=/home/exhibits/Desktop/CarePackageServer/Node/CarePackageMaster/ run dev
#/bin/bash
# Get directory of calling script, from these two: 
# https://stackoverflow.com/questions/59895/how-can-i-get-the-source-directory-of-a-bash-script-from-within-the-script-itsel
# https://unix.stackexchange.com/questions/17499/get-path-of-current-script-when-executed-through-a-symlink
if [ -L "$0" ]; then
  DIR="$(dirname "$(readlink -f "$0")")"
else
  DIR="$( cd "$( dirname "$0" )" &> /dev/null && pwd )"
fi
/usr/bin/env node --experimental-specifier-resolution=node $DIR/lib/lnr.js "$@"


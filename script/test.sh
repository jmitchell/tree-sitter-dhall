#!/usr/bin/env bash

pushd "$(dirname ${BASH_SOURCE[0]})/.."

EXIT_STATUS=0
DHALL_FILES=$(cat <(find "./dhall-lang/Prelude" -type f) \
		  <(find "./dhall-haskell" -name '*.dhall'))

for f in ${DHALL_FILES}; do
    if OUTPUT=$(npm run tree-sitter -- parse "${f}" --quiet --time); then
	echo -e "\033[0;32mPASS\033[0m: ${OUTPUT}"
    else
	EXIT_STATUS=$?
	echo -e "\033[0;31mFAIL\033[0m: ${OUTPUT}"
    fi
done

popd
exit ${EXIT_STATUS}

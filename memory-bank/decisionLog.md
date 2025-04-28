# Decision Log

This file records architectural and implementation decisions using a list format.
2025-04-28 13:36:53 - Log of updates made.

*

## Decision

* [2025-04-28 15:13:30] - Refactored copy_roo.sh to JavaScript (scripts/copy_roo.js) while adding .roomodes file merging functionality.

## Rationale

* [2025-04-28 15:13:45] - JavaScript implementation provides better maintainability, error handling, and cross-platform compatibility compared to shell scripts. The added .roomodes merging functionality allows for preserving custom modes when copying the .roo directory to other projects.

## Implementation Details

* [2025-04-28 15:14:00] - Created scripts/copy_roo.js that replicates the functionality of copy_roo.sh with added .roomodes merging logic. The script:
  1. Copies the .roo directory to the target directory
  2. Handles .roomodes file:
     - If target doesn't have .roomodes, copies the source file
     - If target has .roomodes, merges custom modes by checking for unique slugs
  3. Added a new npm script "copy-roo-js" in package.json while keeping the original shell script

* [2025-04-28 16:07:50] - Changed project license from MIT to Apache License 2.0 to comply with the license of the upstream repository (roo-code-memory-bank).

## Rationale

* [2025-04-28 16:08:00] - The project incorporates code from roo-code-memory-bank which is licensed under Apache License 2.0. To ensure proper compliance with the upstream license, we've adopted the same license for this project.

## Implementation Details

* [2025-04-28 16:08:10] - Updated the following files to comply with Apache License 2.0:
 1. Replaced LICENSE file with the Apache License 2.0 text
 2. Added license headers to all source files (scripts/copy_roo.js, scripts/copy-context-files.js, scripts/copy_roo.sh)
 3. Created a NOTICE file to acknowledge the upstream project
 4. Updated package.json to specify the "Apache-2.0" license
 5. Updated README.md to reflect the license change
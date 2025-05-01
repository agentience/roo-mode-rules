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

* [2025-04-28 16:37:00] - Enhanced orchestrator mode task delegation with MCP server relevance determination capabilities.

## Rationale

* [2025-04-28 16:37:15] - The orchestrator mode needs to provide delegated modes with information about relevant MCP servers for their specific subtasks. This helps the receiving mode understand which external tools and resources are available for its task, improving efficiency and effectiveness.

## Implementation Details

* [2025-04-28 16:38:30] - Implemented a dynamic approach for MCP server relevance determination:
  1. Created mcp-server-relevance.roo.yaml with guidelines for analyzing subtasks and identifying relevant MCP servers
  2. Designed the system to work with whatever MCP servers are available in the orchestrator mode's system prompt
  3. Provided a structured analysis process: extract key concepts, match against available servers, assess relevance, prioritize results
  4. Added the file to the orchestrator mode's context in mode-rule-context.yaml
  5. Included example server categories and task types for illustration, while emphasizing dynamic analysis of actual available servers

* [2025-04-28 17:29:00] - Created a specialized frontend-code mode for React, TypeScript, and Cloudscape development.

## Rationale

* [2025-04-28 17:29:15] - Frontend development with React, TypeScript, and Cloudscape requires specialized knowledge and best practices that are distinct from general code development. Creating a dedicated mode allows for more focused and effective assistance with frontend development tasks, particularly those involving AWS Cloudscape Design System components.

## Implementation Details

* [2025-04-28 17:29:30] - Implemented the frontend-code mode with the following components:
  1. Created .roo/rules-frontend-code/ directory with specialized rule files:
     - typescript-react-best-practices.roo.yaml: Best practices for TypeScript and React development
     - frontend-testing-best-practices.roo.yaml: Comprehensive testing strategies for frontend applications
     - cloudscape-components.roo.yaml: Guidelines for using AWS Cloudscape Design System
  2. Updated .roomodes file to include the new frontend-code mode with appropriate role definition and permissions
  3. Updated mode-rule-context.yaml to include the frontend-code mode and its context files
  4. Updated mode-capabilities.roo.yaml to define the specialized capabilities of the frontend-code mode
  5. Updated task-delegation-patterns.roo.yaml with examples of delegating tasks to the frontend-code mode
  6. Made the mode accessible to code, architect, and orchestrator modes for delegation

* [2025-05-01 12:22:52] - Updated the structure of `copy_history.json` to store only one entry per target directory.

## Rationale

* [2025-05-01 12:22:52] - The previous structure stored a new entry for each copy operation, leading to duplicate entries for the same target directory. This approach was inefficient and could lead to performance issues as the history grew. The new structure is more efficient and easier to maintain, as it only stores the most recent copy operation for each target directory, using the target directory path as the key.

## Implementation Details

* [2025-05-01 12:22:52] - Implemented the following changes:
  1. Created `scripts/update_copy_history.js` to migrate data from `.copy-history.yaml` to the new structure:
     - Reads existing `.copy-history.yaml` file
     - Converts the data to the new object-based format
     - Uses the target directory as the key and stores only the latest timestamp
     - Writes the converted data to `copy_history.json`
  2. Modified `scripts/copy_roo.js` to work with the new structure:
     - Updated `readCopyHistoryJson()` to return an object instead of an array
     - Updated `addToCopyHistoryJson()` to store only one entry per target directory
     - Updated the playback mode section to work with the new structure
  3. Added a new npm script `update-copy-history` to package.json to run the migration
  4. Ensured backward compatibility with existing `.copy-history.yaml` file
  5. Improved error handling and logging for better debugging
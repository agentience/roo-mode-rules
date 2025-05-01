# roo-mode-rules

This repository contains a set of rules and configurations for enhancing Roo modes with robust rules and additional custom modes. It provides tools to easily bootstrap other projects with these rules and modes.

## Overview

The `roo-mode-rules` project helps you:

1. Define and organize mode-specific rules in a structured way
2. Copy these rules to other projects
3. Merge custom modes with existing configurations
4. Maintain a consistent development experience across projects

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A target project where you want to apply the rules

### Installation

```bash
# Clone the repository
git clone git@github.com:agentience/roo-mode-rules.git

# Install dependencies
cd roo-mode-rules
npm install
```

## Usage

### Bootstrapping a Project with Roo Mode Rules

The `copy-roo` script copies specific rule-{mode} folders in `.roo` directory to a target project and handles merging of the `.roomodes` file.

```bash
npm run copy-roo <target_directory>
```

For example:
```bash
npm run copy-roo ../my-project
```

To include modes/rules in addition to the set defined `.roo/default_mode_set.yaml`:
```
npm run copy-roo -- ../my-project --modes=db-migration
```

This script:

- Copies the default mode set, plus any additional modes specified, to the `.roo` directory of the target project
- Handles the `.roomodes` file:
  - If the target doesn't have a `.roomodes` file, it copies the default mode set (see more on modes below) to a .roomodes file in the target directory.
  - If the target has a `.roomodes` file, it merges the default modes, preserving existing modes and adding new ones

### Playback (for your convenience)

You may find yourself editing rules or modes after having already targeted a number of projects.  For this case, a playback functionality is provided.

When you target a specific project directory using `npm run copy-roo {target_dir}` the command is recorded in the `copy_history.json` file (which is not committed to the repo).  To re-run the `copy-roo` command against all previously targeted projects you can run the script without any additional parameters:

```
npm run copy-roo
``` 

### Example Workflow

1. Define your rules in the appropriate context files
2. Run `npm run copy-context` to update the `.roo` directory
3. Run `npm run copy-roo <target_directory>` to apply these rules to another project

## Project Structure

```
roo-mode-rules/
├── .roo/                      # Rules and configurations for Roo modes
│   ├── rules-architect/       # Rules specific to Architect mode
│   ├── rules-code/            # Rules specific to Code mode
│   └── ...                    # Other mode-specific rules
├── scripts/
│   ├── copy-context-files.js      # Script to copy context files
│   ├── copy_roo.js                # Script to copy .roo directory to target
│   ├── mcp-server-relevance.js    # MCP server relevance analysis
│   ├── enhance-task-delegation.js # Task delegation enhancement with MCP servers
│   └── test-mcp-relevance.js      # Test script for MCP server relevance
├── mode-rule-context.yaml     # Defines which context files to use for each mode
├── .roomodes                  # Custom modes configuration
└── package.json               # Project dependencies and scripts
```

## Managing Rules and Modes

### Rules

Mode rules can be configured in 2 ways:

#### 1. Directly under a .roo/rules-{mode} folder.

When rules are certain to be specific to a single mode only, simply place the new rules yaml file under the mode-specific rules folder.

#### 2. Multi-context rules under .roo/context.

When rule files pertain to multiple modes, place these common rules under .roo/context folder.  This folder provides a single place to edit files that are duplicated to specific modes using the script:

```bash
npm run copy-context
```

This script:
- Reads the `mode-rule-context.yaml` file
- For each mode, creates a `.roo/rules-{mode}` directory, if it doesn't exist.
- Copies the specified context files to the appropriate mode folders.

### Customizing Rules

1. Edit or add context files in the `.roo/context/` directory. For single-mode rules add or edit directly under `.roo/rules-{mode}`
2. Update the `mode-rule-context.yaml` file to include any new rules files under `.roo/context`
3. Run `npm run copy-context` to update the `.roo` directory
4. Run `npm run copy-roo <target_directory>` to apply the changes to your target project

### Modes

#### Benefits of Managing Modes

Managing your modes with `copy_roo.js` provides several advantages:

*   **Consistency:** Ensures a consistent set of available modes across different projects or team members, promoting standardized workflows.
*   **Simplified Setup:** Simplifies the setup of new projects by quickly applying a predefined set of relevant modes.
*   **Shareability:** Facilitates the sharing of standardized mode configurations within a team or across an organization.

#### Creating Custom Modes

1. Edit the `.roomodes` file to define your custom modes
2. Create appropriate rule files in the `.roo/context/` directory, or mode-specific rules files directly in `.roo/rules-{mode}`.
3. Update the `mode-rule-context.yaml` file to include your custom mode, as necessary.
4. Follow the steps above to apply the changes to your target project

### Source of Mode Definitions (`.roomodes`)

The `.roomodes` file in this repository acts as a central library containing the definitions (configuration) for *all* available custom modes. When you use `copy_roo.js`, mode definitions are selected *from* this library.

### Default Mode Set (`default_mode_set.yaml`)

The `default_mode_set.yaml` file defines a set of mode slugs that are *always* included by default when you run the `copy_roo.js` (`npm run copy-roo`) script without specifying additional modes.

### Specifying Additional Modes (`--modes` Argument)

You can specify additional mode slugs to copy, beyond the default set, by using the `--modes` command-line argument with the `copy_roo.js` script. For example:

```bash
npm run copy-roo -- ../my-project --modes=mode-slug1,mode-slug2
```

This command would copy the default modes *plus* the modes with slugs `mode-slug1` and `mode-slug2` (if they exist in the source `.roomodes` library).

### Additional Details on the Mode Selection and Copying Process

The `copy_roo.js` script performs the following steps:

1.  It reads the list of default mode slugs from `default_mode_set.yaml`.
2.  It reads any additional mode slugs provided via the `--modes` command-line argument.
3.  It combines the default slugs and the `--modes` slugs to create a final list of desired mode slugs.
4.  It reads the source `.roomodes` file (the central library) in this repository.
5.  It selects the mode definitions from the source `.roomodes` library that match the slugs in the final list.
6.  It creates a *new* `.roomodes` file in the target directory containing *only* the selected mode definitions. 
7.  It modifies the two files responsible for helping *Orchestrator* mode understand how to transition between modes:
 - `.roo/context/workflow-orchestration.roo.yaml`
 - `.roo/context/task-delegation-patterns.roo.yaml`

If a `.roomodes` file already exists in the target, it will be merged with the new mode selections.

This ensures that the target project's `.roomodes` file contains the set of modes you intend to use, without impacting any modes already defined in the target project.

Note: Most of the work above is done in a temp directory that is then copied to the target directory this avoids manipulating the structure of the project or the `.roomodes` file.

### Effective Usage Guidance

Here are some tips for effectively managing your modes:

*   **Curate Default Sets:** Maintain a well-defined `default_mode_set.yaml` for common project types or team standards.
*   **Use `--modes` for Customization:** Leverage the `--modes` argument for project-specific additions without modifying the default set.
*   **Version Control:** Keep your target project's `.roomodes` file under version control to track the specific mode configuration used for that project.

## Default Mode Enhancements

### MCP Server Relevance for Orchestrator Mode

The project includes rules to enhance the orchestrator mode's task delegation with MCP server relevance. These rules instruct Orchestrator mode to analyze the instructions for a subtask and include MCP servers that are relevant to the task, providing this information to the delegated mode.

#### How It Works

1. When the orchestrator mode delegates a task to another mode using the `new_task` tool, the system:
   - Analyzes the task's objective, requirements, and context
   - Extracts keywords and concepts from the task content
   - Matches these against MCP server descriptions, tools, and resources
   - Identifies the most relevant MCP servers for the task
   - Includes this information in the task delegation message

2. The delegated mode receives a task message with a "Relevant MCP Servers" section that lists MCP servers that are likely to be useful for the task, along with brief explanations of why they're relevant.

#### Benefits

- **Improved Efficiency**: Modes immediately know which MCP servers to consider for a task
- **Reduced Cognitive Load**: Modes don't need to search through all available MCP servers
- **Better Task Completion**: Access to the right tools leads to better task outcomes
- **Contextual Awareness**: Modes have more context about the task requirements

### Testing the Functionality

The functionality captured in the `.roo/context/mcp-server-relevance.roo.yaml` is also implemented as scripts, which may be incorporated into an mcp server at a later date.

You can test the MCP server relevance functionality using the provided test script:

```bash
npm run test-mcp-relevance
```

This script demonstrates how the system analyzes different types of tasks and identifies relevant MCP servers.

### Implementation Details

1. **mcp-server-relevance.js**: Core functionality for analyzing tasks and identifying relevant MCP servers
2. **enhance-task-delegation.js**: Integration with the task delegation process
3. **test-mcp-relevance.js**: Test script with sample tasks and MCP servers

The task delegation template in `.roo/rules-orchestrator/task-delegation-patterns.roo.yaml` has been updated to include a section for relevant MCP servers.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
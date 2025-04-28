# roo-mode-rules

This repository contains a set of rules and configurations for enhancing Roo modes with robust rules and additional custom modes. It provides tools to easily bootstrap other projects with these rules.

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

The repository provides two main npm scripts to help you bootstrap another project:

#### 1. Copy Context Files

The `copy-context` script reads the `mode-rule-context.yaml` file and copies the specified context files to the `.roo/rules-{mode}` directories.

```bash
npm run copy-context
```

This script:
- Reads the `mode-rule-context.yaml` file
- For each mode, creates a `.roo/rules-{mode}` directory
- Copies the specified context files to the appropriate directory

#### 2. Copy Roo Configuration to Another Project

The `copy-roo` script copies the `.roo` directory to a target project and handles merging of the `.roomodes` file.

```bash
npm run copy-roo <target_directory>
```

For example:
```bash
npm run copy-roo ../my-project
```

This script:
- Copies the entire `.roo` directory to the target project
- Handles the `.roomodes` file:
  - If the target doesn't have a `.roomodes` file, it copies the source file
  - If the target has a `.roomodes` file, it merges the custom modes, preserving existing modes and adding new ones

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

## Customizing Rules

1. Edit or add context files in the `.roo/context/` directory
2. Update the `mode-rule-context.yaml` file to include your new context files
3. Run `npm run copy-context` to update the `.roo` directory
4. Run `npm run copy-roo <target_directory>` to apply the changes to your target project

## Creating Custom Modes

1. Edit the `.roomodes` file to define your custom modes
2. Create appropriate rule files in the `.roo/context/` directory
3. Update the `mode-rule-context.yaml` file to include your custom mode
4. Follow the steps above to apply the changes to your target project

## MCP Server Relevance for Orchestrator Mode

The project includes functionality to enhance the orchestrator mode's task delegation with MCP server relevance. This feature analyzes the content of a subtask and identifies MCP servers that are relevant to the task, providing this information to the delegated mode.

### How It Works

1. When the orchestrator mode delegates a task to another mode using the `new_task` tool, the system:
   - Analyzes the task's objective, requirements, and context
   - Extracts keywords and concepts from the task content
   - Matches these against MCP server descriptions, tools, and resources
   - Identifies the most relevant MCP servers for the task
   - Includes this information in the task delegation message

2. The delegated mode receives a task message with a "Relevant MCP Servers" section that lists MCP servers that are likely to be useful for the task, along with brief explanations of why they're relevant.

### Benefits

- **Improved Efficiency**: Modes immediately know which MCP servers to consider for a task
- **Reduced Cognitive Load**: Modes don't need to search through all available MCP servers
- **Better Task Completion**: Access to the right tools leads to better task outcomes
- **Contextual Awareness**: Modes have more context about the task requirements

### Testing the Functionality

You can test the MCP server relevance functionality using the provided test script:

```bash
npm run test-mcp-relevance
```

This script demonstrates how the system analyzes different types of tasks and identifies relevant MCP servers.

### Implementation Details

The functionality is implemented in three main files:

1. **mcp-server-relevance.js**: Core functionality for analyzing tasks and identifying relevant MCP servers
2. **enhance-task-delegation.js**: Integration with the task delegation process
3. **test-mcp-relevance.js**: Test script with sample tasks and MCP servers

The task delegation template in `.roo/rules-orchestrator/task-delegation-patterns.roo.yaml` has been updated to include a section for relevant MCP servers.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
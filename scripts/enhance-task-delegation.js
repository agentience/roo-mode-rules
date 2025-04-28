/**
 * Copyright 2025 Agentience
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Task Delegation Enhancer
 * 
 * This script enhances task delegation messages with relevant MCP server information.
 * It integrates with the orchestrator mode to provide targeted MCP server recommendations
 * based on the subtask's content.
 */

const { parseTaskMessage, findRelevantMcpServers, generateMcpServerSection } = require('./mcp-server-relevance');

/**
 * Enhances a task delegation message with relevant MCP server information
 * 
 * @param {string} message - The original task delegation message
 * @param {Array} mcpServers - Array of available MCP servers with their capabilities
 * @param {Object} options - Configuration options
 * @returns {string} - Enhanced task delegation message with MCP server section
 */
function enhanceTaskDelegation(message, mcpServers, options = {}) {
  // Parse the task message to extract subtask components
  const subtask = parseTaskMessage(message);
  
  // Find relevant MCP servers for the subtask
  const relevantServers = findRelevantMcpServers(subtask, mcpServers, options);
  
  // Generate the MCP server section
  const mcpServerSection = generateMcpServerSection(relevantServers);
  
  // Check if the message already has a "Relevant MCP Servers" section
  if (message.includes('## Relevant MCP Servers')) {
    // Replace existing section
    return message.replace(
      /## Relevant MCP Servers\s+([\s\S]*?)(?=##|$)/,
      `${mcpServerSection}\n\n`
    );
  } else {
    // Add new section before "Next Steps" if it exists
    if (message.includes('## Next Steps')) {
      return message.replace(
        /## Next Steps/,
        `${mcpServerSection}\n\n## Next Steps`
      );
    } else {
      // Otherwise, append to the end of the message
      return `${message}\n\n${mcpServerSection}`;
    }
  }
}

/**
 * Processes a new_task tool call to include relevant MCP servers
 * 
 * @param {Object} taskCall - The new_task tool call object
 * @param {Array} mcpServers - Array of available MCP servers
 * @param {Object} options - Configuration options
 * @returns {Object} - Enhanced new_task tool call
 */
function enhanceNewTaskCall(taskCall, mcpServers, options = {}) {
  // Extract mode and message from the task call
  const { mode, message } = taskCall;
  
  // Enhance the message with relevant MCP servers
  const enhancedMessage = enhanceTaskDelegation(message, mcpServers, options);
  
  // Return the enhanced task call
  return {
    ...taskCall,
    message: enhancedMessage
  };
}

/**
 * Example MCP server data structure for testing
 * In production, this would be retrieved from the system prompt or configuration
 */
const exampleMcpServers = [
  {
    name: "github",
    description: "GitHub MCP server for interacting with GitHub repositories",
    tools: [
      { name: "create_or_update_file", description: "Create or update a single file in a GitHub repository" },
      { name: "search_repositories", description: "Search for GitHub repositories" }
    ]
  },
  {
    name: "fetch",
    description: "Fetch MCP server for retrieving data from the internet",
    tools: [
      { name: "fetch", description: "Fetches a URL from the internet and optionally extracts its contents as markdown" }
    ]
  },
  {
    name: "tribal",
    description: "Tribal MCP server for knowledge management",
    tools: [
      { name: "track_error", description: "Track an error and its solution in the knowledge base" },
      { name: "find_similar_errors", description: "Find errors similar to the given query" }
    ]
  }
];

/**
 * Example usage
 */
function example() {
  const taskMessage = `# Task: Implement GitHub Integration

## Rules
Follow all the rules for Code mode, found in markdown files in the folder .roo/rules-code.

## Context
We need to integrate our application with GitHub to allow users to authenticate and access their repositories.

## Objective
Implement GitHub OAuth authentication and repository listing functionality.

## Requirements
- Use GitHub OAuth for authentication
- Allow users to list their repositories
- Implement repository search functionality
- Store user access tokens securely

## Deliverables
- GitHub OAuth integration
- Repository listing component
- Repository search functionality
- User settings for GitHub integration

## Success Criteria
- Users can authenticate with GitHub
- Users can view and search their repositories
- Access tokens are stored securely
- UI is responsive and user-friendly

## Next Steps
After implementation, Debug mode will verify the integration works correctly.`;

  // Enhance the task message with relevant MCP servers
  const enhancedMessage = enhanceTaskDelegation(taskMessage, exampleMcpServers);
  console.log(enhancedMessage);
}

// Export functions for use by the orchestrator mode
module.exports = {
  enhanceTaskDelegation,
  enhanceNewTaskCall,
  example
};

// Run example if executed directly
if (require.main === module) {
  example();
}
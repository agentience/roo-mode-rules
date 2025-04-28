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
 * Test script for MCP Server Relevance functionality
 * 
 * This script demonstrates how the MCP server relevance functionality works
 * by testing it with different example tasks.
 * 
 * Usage:
 * node scripts/test-mcp-relevance.js
 */

const { enhanceTaskDelegation } = require('./enhance-task-delegation');
const { parseTaskMessage, findRelevantMcpServers } = require('./mcp-server-relevance');

// Sample MCP server data for testing
const sampleMcpServers = [
  {
    name: "github",
    description: "GitHub MCP server for interacting with GitHub repositories",
    tools: [
      { name: "create_or_update_file", description: "Create or update a single file in a GitHub repository" },
      { name: "search_repositories", description: "Search for GitHub repositories" },
      { name: "create_repository", description: "Create a new GitHub repository in your account" },
      { name: "push_files", description: "Push multiple files to a GitHub repository in a single commit" }
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
    name: "brave-search",
    description: "Brave Search MCP server for performing web searches",
    tools: [
      { name: "brave_web_search", description: "Performs a web search using the Brave Search API" },
      { name: "brave_local_search", description: "Searches for local businesses and places using Brave's Local Search API" }
    ]
  },
  {
    name: "tribal",
    description: "Tribal MCP server for knowledge management",
    tools: [
      { name: "track_error", description: "Track an error and its solution in the knowledge base" },
      { name: "find_similar_errors", description: "Find errors similar to the given query" }
    ]
  },
  {
    name: "jira-server",
    description: "Jira MCP server for interacting with Jira issues",
    tools: [
      { name: "create_issue", description: "Create a new Jira issue" },
      { name: "update_issue", description: "Update an existing Jira issue" },
      { name: "get_issues", description: "Get all issues and subtasks for a project" }
    ]
  },
  {
    name: "awslabs-cdk-mcp-server",
    description: "AWS Labs CDK MCP server for AWS CDK expertise",
    tools: [
      { name: "CDKGeneralGuidance", description: "Get prescriptive CDK advice for building applications on AWS" },
      { name: "ExplainCDKNagRule", description: "Explain a specific CDK Nag rule with AWS Well-Architected guidance" }
    ]
  },
  {
    name: "unirt.amplify-doc-mcp-server",
    description: "Unirt Amplify Documentation MCP server for AWS Amplify documentation",
    tools: [
      { name: "search_amplify_documentation", description: "Search AWS Amplify Gen 2 documentation using the official search API" },
      { name: "read_amplify_documentation", description: "Fetch and convert an AWS Amplify documentation page to markdown format" }
    ]
  },
  {
    name: "mysql-mcp-server",
    description: "MySQL MCP server for interacting with MySQL databases",
    tools: [
      { name: "execute_sql", description: "Execute an SQL query on the MySQL server" }
    ]
  }
];

// Sample task messages for testing
const sampleTasks = [
  {
    name: "GitHub Integration Task",
    message: `# Task: Implement GitHub Integration

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
After implementation, Debug mode will verify the integration works correctly.`
  },
  {
    name: "AWS Amplify Authentication Task",
    message: `# Task: Implement User Authentication with AWS Amplify

## Rules
Follow all the rules for Code mode, found in markdown files in the folder .roo/rules-code.

## Context
We need to add user authentication to our React application using AWS Amplify and Cognito.

## Objective
Implement a complete authentication flow including sign-up, sign-in, password reset, and email verification.

## Requirements
- Use AWS Amplify libraries for Cognito integration
- Implement sign-up with email verification
- Implement sign-in with remember me functionality
- Implement password reset flow
- Add protected routes that require authentication

## Deliverables
- Authentication components (SignUp, SignIn, ForgotPassword)
- Protected route implementation
- User profile management
- Authentication state management

## Success Criteria
- All authentication flows work as expected
- Protected routes are only accessible to authenticated users
- User feedback is clear and helpful
- Error handling is robust

## Next Steps
After implementation, Debug mode will test edge cases and security.`
  },
  {
    name: "Database Query Task",
    message: `# Task: Implement Database Query Functionality

## Rules
Follow all the rules for Code mode, found in markdown files in the folder .roo/rules-code.

## Context
We need to add database query functionality to our application to allow users to search and filter data.

## Objective
Implement a flexible query builder and execution system for MySQL database.

## Requirements
- Create a query builder interface
- Support filtering, sorting, and pagination
- Implement parameterized queries for security
- Add result caching for performance
- Support complex joins and aggregations

## Deliverables
- Query builder class
- Query execution service
- Result transformation utilities
- Caching mechanism
- Documentation and examples

## Success Criteria
- Queries are secure against SQL injection
- Performance is optimized with appropriate indexing
- Complex queries can be built programmatically
- Results are properly typed and validated

## Next Steps
After implementation, Debug mode will perform security and performance testing.`
  }
];

/**
 * Run tests for each sample task
 */
function runTests() {
  console.log('=== MCP Server Relevance Test ===\n');
  
  sampleTasks.forEach(task => {
    console.log(`\n--- Testing: ${task.name} ---\n`);
    
    // Parse the task message
    const subtask = parseTaskMessage(task.message);
    console.log('Parsed Subtask:');
    console.log(JSON.stringify(subtask, null, 2));
    console.log();
    
    // Find relevant MCP servers
    const relevantServers = findRelevantMcpServers(subtask, sampleMcpServers, { 
      maxResults: 3,
      includeExplanations: true
    });
    console.log('Relevant MCP Servers:');
    console.log(JSON.stringify(relevantServers, null, 2));
    console.log();
    
    // Enhance the task message
    const enhancedMessage = enhanceTaskDelegation(task.message, sampleMcpServers, {
      maxResults: 3
    });
    
    // Extract and display only the MCP server section
    const mcpSection = enhancedMessage.match(/## Relevant MCP Servers\s+([\s\S]*?)(?=##|$)/);
    if (mcpSection) {
      console.log('Generated MCP Server Section:');
      console.log(mcpSection[0]);
    } else {
      console.log('No MCP Server section generated.');
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');
  });
}

// Run the tests
runTests();
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
 * MCP Server Relevance Analyzer
 * 
 * This script analyzes a subtask's content to identify relevant MCP servers
 * based on keyword matching and semantic relevance.
 */

/**
 * Analyzes a subtask to identify relevant MCP servers
 * 
 * @param {Object} subtask - The subtask object containing objective, requirements, etc.
 * @param {Array} mcpServers - Array of available MCP servers with their capabilities
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of relevant MCP servers with explanations
 */
function findRelevantMcpServers(subtask, mcpServers, options = {}) {
  const {
    maxResults = 4,
    minRelevanceScore = 0.3,
    includeExplanations = true
  } = options;

  // Extract text content from subtask
  const subtaskContent = extractSubtaskContent(subtask);
  
  // Extract keywords from subtask content
  const keywords = extractKeywords(subtaskContent);
  
  // Score each MCP server based on relevance to the subtask
  const scoredServers = scoreServers(keywords, mcpServers);
  
  // Filter and sort servers by relevance score
  const relevantServers = scoredServers
    .filter(server => server.relevanceScore >= minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
  
  // Format results with explanations if requested
  return formatResults(relevantServers, includeExplanations);
}

/**
 * Extracts text content from subtask object
 * 
 * @param {Object} subtask - The subtask object
 * @returns {string} - Combined text content from the subtask
 */
function extractSubtaskContent(subtask) {
  const {
    title = '',
    objective = '',
    context = '',
    requirements = [],
    deliverables = []
  } = subtask;
  
  // Combine all text content from the subtask
  return [
    title,
    objective,
    context,
    ...(Array.isArray(requirements) ? requirements : [requirements]),
    ...(Array.isArray(deliverables) ? deliverables : [deliverables])
  ].filter(Boolean).join(' ');
}

/**
 * Extracts keywords from text content
 * 
 * @param {string} content - Text content to analyze
 * @returns {Object} - Object with keywords and their weights
 */
function extractKeywords(content) {
  const keywords = {};
  
  // Convert content to lowercase for case-insensitive matching
  const normalizedContent = content.toLowerCase();
  
  // Define technology domains and their associated keywords
  const domains = {
    aws: ['aws', 'amazon', 'cloud', 'lambda', 's3', 'dynamodb', 'ec2', 'cognito', 'amplify', 'cloudformation', 'cdk'],
    github: ['github', 'git', 'repository', 'repo', 'pull request', 'pr', 'issue', 'commit', 'branch'],
    database: ['database', 'db', 'sql', 'mysql', 'postgresql', 'nosql', 'query', 'schema', 'table'],
    web: ['web', 'html', 'css', 'javascript', 'frontend', 'backend', 'api', 'rest', 'graphql'],
    typescript: ['typescript', 'ts', 'javascript', 'js', 'npm', 'package', 'module', 'library'],
    documentation: ['documentation', 'docs', 'readme', 'wiki', 'guide', 'tutorial', 'reference'],
    testing: ['test', 'testing', 'unit test', 'integration test', 'e2e', 'end-to-end', 'jest', 'mocha', 'cypress'],
    deployment: ['deploy', 'deployment', 'release', 'ci/cd', 'pipeline', 'build', 'publish'],
    debugging: ['debug', 'debugging', 'error', 'bug', 'issue', 'fix', 'troubleshoot', 'problem'],
    search: ['search', 'find', 'query', 'lookup', 'retrieve', 'fetch']
  };
  
  // Check for domain keywords in content
  Object.entries(domains).forEach(([domain, domainKeywords]) => {
    domainKeywords.forEach(keyword => {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        // Add or increment keyword count
        keywords[domain] = (keywords[domain] || 0) + 1;
        
        // Add specific keyword with higher weight
        keywords[keyword.toLowerCase()] = (keywords[keyword.toLowerCase()] || 0) + 2;
      }
    });
  });
  
  // Check for specific MCP server names in content
  const mcpServerPrefixes = [
    'github', 'fetch', 'brave-search', 'tribal', 'jira-server', 'practices',
    'awslabs', 'aws', 'bedrock', 'cdk', 'cost-analysis', 'documentation',
    'diagram', 'amplify', 'mysql', 'ts-pkg-distro'
  ];
  
  mcpServerPrefixes.forEach(prefix => {
    if (normalizedContent.includes(prefix.toLowerCase())) {
      keywords[prefix.toLowerCase()] = (keywords[prefix.toLowerCase()] || 0) + 3;
    }
  });
  
  return keywords;
}

/**
 * Scores MCP servers based on relevance to extracted keywords
 * 
 * @param {Object} keywords - Object with keywords and their weights
 * @param {Array} mcpServers - Array of available MCP servers
 * @returns {Array} - Array of servers with relevance scores
 */
function scoreServers(keywords, mcpServers) {
  return mcpServers.map(server => {
    let relevanceScore = 0;
    let matchedKeywords = [];
    let relevantTools = [];
    
    // Check server name and description for keyword matches
    Object.entries(keywords).forEach(([keyword, weight]) => {
      const serverName = server.name.toLowerCase();
      const serverDesc = (server.description || '').toLowerCase();
      
      if (serverName.includes(keyword) || serverDesc.includes(keyword)) {
        relevanceScore += weight * 0.5;
        matchedKeywords.push(keyword);
      }
      
      // Check server tools and resources for keyword matches
      const tools = server.tools || [];
      tools.forEach(tool => {
        const toolName = tool.name.toLowerCase();
        const toolDesc = (tool.description || '').toLowerCase();
        
        if (toolName.includes(keyword) || toolDesc.includes(keyword)) {
          relevanceScore += weight * 0.3;
          matchedKeywords.push(keyword);
          
          // Track relevant tools
          if (!relevantTools.some(t => t.name === tool.name)) {
            relevantTools.push(tool);
          }
        }
      });
      
      // Check server resources for keyword matches
      const resources = server.resources || [];
      resources.forEach(resource => {
        const resourceName = resource.name.toLowerCase();
        const resourceDesc = (resource.description || '').toLowerCase();
        
        if (resourceName.includes(keyword) || resourceDesc.includes(keyword)) {
          relevanceScore += weight * 0.2;
          matchedKeywords.push(keyword);
        }
      });
    });
    
    // Normalize score based on number of keywords
    const keywordCount = Object.keys(keywords).length;
    if (keywordCount > 0) {
      relevanceScore = relevanceScore / (keywordCount * 0.5);
    }
    
    return {
      server,
      relevanceScore,
      matchedKeywords: [...new Set(matchedKeywords)],
      relevantTools
    };
  });
}

/**
 * Formats the results with explanations if requested
 * 
 * @param {Array} relevantServers - Array of relevant servers with scores
 * @param {boolean} includeExplanations - Whether to include explanations
 * @returns {Array} - Formatted results
 */
function formatResults(relevantServers, includeExplanations) {
  return relevantServers.map(({ server, relevanceScore, matchedKeywords, relevantTools }) => {
    const result = {
      name: server.name,
      relevanceScore
    };
    
    if (includeExplanations) {
      // Generate explanation based on matched keywords and tools
      const toolsText = relevantTools.length > 0
        ? ` with useful tools like ${relevantTools.slice(0, 2).map(t => t.name).join(', ')}`
        : '';
      
      result.explanation = `Relevant for ${matchedKeywords.slice(0, 3).join(', ')} capabilities${toolsText}`;
    }
    
    return result;
  });
}

/**
 * Parses a task message to extract subtask components
 * 
 * @param {string} message - The task message content
 * @returns {Object} - Extracted subtask components
 */
function parseTaskMessage(message) {
  const subtask = {};
  
  // Extract title
  const titleMatch = message.match(/# Task: (.*?)(\r?\n|$)/);
  if (titleMatch) {
    subtask.title = titleMatch[1].trim();
  }
  
  // Extract objective
  const objectiveMatch = message.match(/## Objective\s+([\s\S]*?)(?=##|$)/);
  if (objectiveMatch) {
    subtask.objective = objectiveMatch[1].trim();
  }
  
  // Extract context
  const contextMatch = message.match(/## Context\s+([\s\S]*?)(?=##|$)/);
  if (contextMatch) {
    subtask.context = contextMatch[1].trim();
  }
  
  // Extract requirements
  const requirementsMatch = message.match(/## Requirements\s+([\s\S]*?)(?=##|$)/);
  if (requirementsMatch) {
    // Split by bullet points if present
    const reqText = requirementsMatch[1].trim();
    subtask.requirements = reqText.split(/\r?\n-/).map(r => r.trim()).filter(Boolean);
    
    // If no bullet points were found, use the whole text
    if (subtask.requirements.length === 1 && !reqText.includes('-')) {
      subtask.requirements = reqText;
    }
  }
  
  // Extract deliverables
  const deliverablesMatch = message.match(/## Deliverables\s+([\s\S]*?)(?=##|$)/);
  if (deliverablesMatch) {
    // Split by bullet points if present
    const delText = deliverablesMatch[1].trim();
    subtask.deliverables = delText.split(/\r?\n-/).map(d => d.trim()).filter(Boolean);
    
    // If no bullet points were found, use the whole text
    if (subtask.deliverables.length === 1 && !delText.includes('-')) {
      subtask.deliverables = delText;
    }
  }
  
  return subtask;
}

/**
 * Generates a formatted "Relevant MCP Servers" section for task delegation
 * 
 * @param {Array} relevantServers - Array of relevant servers with explanations
 * @returns {string} - Formatted markdown section
 */
function generateMcpServerSection(relevantServers) {
  if (!relevantServers || relevantServers.length === 0) {
    return '## Relevant MCP Servers\nNo specific MCP servers identified as relevant for this task.';
  }
  
  const serverLines = relevantServers.map(server => {
    return `- **${server.name}**: ${server.explanation}`;
  });
  
  return `## Relevant MCP Servers\n${serverLines.join('\n')}`;
}

module.exports = {
  findRelevantMcpServers,
  parseTaskMessage,
  generateMcpServerSection
};
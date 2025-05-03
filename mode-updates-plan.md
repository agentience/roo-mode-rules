# Mode Updates Plan

## Current State Analysis

After reviewing the project files, I've identified that Documentation Mode is missing from both workflow orchestration and task delegation patterns files. Additionally, we need to ensure all modes defined in `.roomodes` are properly represented in these configuration files.

### Modes Defined in `.roomodes`
1. Documentation Mode (slug: documentation)
2. Frontend Code Mode (slug: frontend-code)
3. Database Migration Mode (slug: db-migration)
4. Release Engineer Mode (slug: release-engineer)

### Standard Modes (not explicitly defined in `.roomodes`)
1. Architect Mode
2. Code Mode
3. Debug Mode
4. Ask Mode
5. Orchestrator Mode (referred to as "Orchestrator Mode" in some files)

## Proposed Updates

### 1. Updates for `.roo/context/workflow-orchestration.roo.yaml`

Add a new workflow pattern for documentation-related tasks:

```yaml
documentation_workflow:
  steps:
    - mode: "Code Mode"
      task: "Implement feature with inline documentation"
    - mode: "Documentation Mode"
      task: "Create comprehensive documentation for the feature"
    - mode: "Debug Mode"
      task: "Verify documentation accuracy with implementation"
    - mode: "Documentation Mode"
      task: "Refine documentation based on feedback"
```

Update the feature implementation workflow to include Documentation Mode:

```yaml
feature_implementation_workflow:
  steps:
    - mode: "Architect Mode"
      task: "Design the feature architecture and make key technical decisions"
    - mode: "Code Mode"
      task: "Implement the core functionality"
    - mode: "Debug Mode"
      task: "Test and troubleshoot any issues"
    - mode: "Code Mode"
      task: "Refine implementation based on testing"
    - mode: "Documentation Mode"
      task: "Create or update documentation for the feature"
    - mode: "Release Engineer Mode"
      task: "Prepare for release and deployment"
```

Add a new workflow for frontend-specific development:

```yaml
frontend_development_workflow:
  steps:
    - mode: "Architect Mode"
      task: "Design the UI/UX architecture"
    - mode: "Frontend Code Mode"
      task: "Implement UI components and interactions"
    - mode: "Debug Mode"
      task: "Test UI functionality and responsiveness"
    - mode: "Frontend Code Mode"
      task: "Refine implementation based on testing"
    - mode: "Documentation Mode"
      task: "Document component usage and props"
    - mode: "Release Engineer Mode"
      task: "Prepare for release and deployment"
```

Update the release phase in multi-phase project pattern:

```yaml
- name: "Release Phase"
  steps:
    - mode: "Documentation Mode"
      task: "Prepare release documentation"
    - mode: "Release Engineer Mode"
      task: "Prepare for deployment"
    - mode: "Debug Mode"
      task: "Final validation"
    - mode: "Release Engineer Mode"
      task: "Execute release"
```

### 2. Updates for `.roo/rules-orchestrator/task-delegation-patterns.roo.yaml`

Add an example delegation from Architect to Documentation Mode:

```yaml
- name: "Architect to Documentation Mode"
  example: |
    <new_task>
    <mode>documentation</mode>
    <message>
    # Task: Create Technical Documentation for New Authentication System

    ## Rules
    Follow all the rules for Documentation mode, found in markdown files in the folder .roo/rules-documentation.

    ## Context
    We've implemented a new authentication system using AWS Cognito. The architecture and implementation details are available in the codebase and decision-records.roo.md file. We need comprehensive documentation for developers and system administrators.

    ## Objective
    Create technical documentation for the new authentication system, including architecture overview, setup instructions, usage examples, and API reference.

    ## Requirements
    - Must cover both developer and administrator perspectives
    - Must include diagrams for visual clarity
    - Must provide code examples for common use cases
    - Must document all configuration options
    - Must follow the project documentation style guide

    ## Deliverables
    - Architecture overview document
    - Setup and configuration guide
    - Developer usage guide with examples
    - API reference documentation
    - Troubleshooting section

    ## Success Criteria
    - Documentation is technically accurate
    - All required sections are complete
    - Documentation follows the project style guide
    - Documentation is organized logically
    - Code examples are functional and follow best practices

    ## Next Steps
    After documentation is complete, Debug mode will verify technical accuracy and Code mode will review for completeness.
    </message>
    </new_task>
```

Add an example delegation from Release Engineer to Documentation Mode:

```yaml
- name: "Release Engineer to Documentation Mode"
  example: |
    <new_task>
    <mode>documentation</mode>
    <message>
    # Task: Create Release Notes for v1.2.0

    ## Rules
    Follow all the rules for Documentation mode, found in markdown files in the folder .roo/rules-documentation.

    ## Context
    We're preparing to release v1.2.0 which includes several new features and bug fixes. All development work is complete and has been tested. We need comprehensive release notes to communicate changes to users and stakeholders.

    ## Objective
    Create detailed release notes for v1.2.0 that clearly communicate new features, improvements, bug fixes, and any breaking changes.

    ## Requirements
    - Must categorize changes (new features, improvements, bug fixes, breaking changes)
    - Must provide clear descriptions of each change
    - Must include any necessary upgrade instructions
    - Must follow the release notes template
    - Must be written for both technical and non-technical audiences

    ## Deliverables
    - Comprehensive release notes document in Markdown format
    - Abbreviated version for public announcement
    - Upgrade guide if applicable

    ## Success Criteria
    - All significant changes are documented
    - Descriptions are clear and understandable
    - Format follows the project's release notes template
    - Technical details are accurate
    - No typos or grammatical errors

    ## Next Steps
    After release notes are complete, Release Engineer mode will include them in the release package and coordinate the announcement.
    </message>
    </new_task>
```

## Implementation Strategy

Since both Orchestrator and Architect modes have restrictions on editing YAML files, we have the following options:

1. Switch to Code mode to implement these changes
2. Create a script to update these files programmatically
3. Manually edit the files outside of the Roo environment

The recommended approach is to switch to Code mode to implement these changes, as it has the necessary permissions to edit YAML files.

## Next Steps

1. Switch to Code mode
2. Implement the changes to both files as outlined above
3. Verify that all modes are properly represented in both files
4. Return to Architect mode to continue with the original task if needed
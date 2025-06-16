# MCP Servers - Comprehensive Agent Reference

## Agent Interpretation Guidelines

### How to Use This Documentation

1. **Scan by Purpose**: Each server has a clear purpose statement - match your task to the right server
2. **Follow Parameter Hierarchy**: Required params first, then optional params with defaults
3. **Check Dependencies**: Some tools require specific sequences (marked with →)
4. **Validate Context**: Always check allowed directories and available services before execution
5. **Handle Async Operations**: Some operations return IDs for status checking

### Decision Framework

- **Research Tasks**: Start with `context7` for docs, `firecrawl_search` for web content
- **Complex Analysis**: Use `sequential-thinking` for multi-step reasoning
- **File Operations**: Use `filesystem` for local work, validate paths first
- **Web Automation**: Use `playwright` for interaction, `firecrawl` for extraction
- **Workflow Management**: Use `anubis` for structured task execution

---

## Connected Servers Overview

- `sequential-thinking` - Advanced problem-solving with dynamic reasoning and revision
- `playwright` - Browser automation, testing, and web interaction
- `figma-developer-mcp` - Figma design integration and asset extraction
- `context7` - Library documentation retrieval with up-to-date examples
- `mcp-server-firecrawl` - Intelligent web scraping and content extraction
- `filesystem` - Comprehensive file system operations within allowed directories
- `anubis` - Advanced workflow execution, reporting, and task management

---

## sequential-thinking

**Purpose**: Dynamic problem-solving through adaptive thinking process with revision capability

### Core Tool

- `sequentialthinking` - Multi-step reasoning with dynamic revision
  - **Required**: `thought` (string), `nextThoughtNeeded` (bool), `thoughtNumber` (int), `totalThoughts` (int)
  - **Optional**: `isRevision` (bool), `revisesThought` (int), `branchFromThought` (int), `branchId` (string)

### Usage Patterns

- **Complex Analysis**: Start with estimate, adjust `totalThoughts` as needed
- **Course Correction**: Set `isRevision: true` and specify `revisesThought`
- **Branching Logic**: Use `branchFromThought` for exploring alternatives
- **Iterative Refinement**: Continue adding thoughts beyond initial estimate

### Agent Instructions

1. Begin with conservative `totalThoughts` estimate
2. Express uncertainty when present - this tool handles it well
3. Question previous thoughts freely using revision mechanisms
4. Only set `nextThoughtNeeded: false` when truly satisfied with solution
5. Use for: planning, analysis, debugging, design decisions, complex calculations

---

## playwright

**Purpose**: Browser automation, testing, and comprehensive web interaction

### Session Management

- `start_codegen_session(options)` - Initialize recording session
  - **Required**: `outputPath` (absolute path for test files)
  - **Optional**: `testNamePrefix` (default: "GeneratedTest"), `includeComments` (bool)
- `end_codegen_session(sessionId)` → `get_codegen_session(sessionId)` → `clear_codegen_session(sessionId)`

### Navigation & Setup

- `playwright_navigate(url)` - Primary navigation command
  - **Required**: `url` (full URL with protocol)
  - **Optional**: `browserType` (chromium|firefox|webkit), `width/height` (viewport), `headless` (bool), `timeout` (ms)
- `playwright_custom_user_agent(userAgent)` - Set custom browser identity
- `playwright_go_back()` / `playwright_go_forward()` - History navigation

### Content Capture & Analysis

- `playwright_screenshot(name)` - Capture visual state
  - **Required**: `name` (screenshot identifier)
  - **Optional**: `selector` (element-specific), `fullPage` (bool), `savePng` (bool), `width/height`
- `playwright_get_visible_text()` - Extract all visible text content
- `playwright_get_visible_html()` - Extract complete HTML structure
- `playwright_save_as_pdf(outputPath)` - Generate PDF documents
  - **Optional**: `filename`, `format` (A4|Letter), `printBackground` (bool), `margin` (object)

### User Interactions

- `playwright_click(selector)` - Standard click interaction
- `playwright_fill(selector, value)` - Input field population
- `playwright_select(selector, value)` - Dropdown selection
- `playwright_hover(selector)` - Mouse hover simulation
- `playwright_press_key(key)` - Keyboard input → optional: `selector` for focus
- `playwright_drag(sourceSelector, targetSelector)` - Drag and drop operations

### Iframe Operations

- `playwright_iframe_click(iframeSelector, selector)` - Click within iframe
- `playwright_iframe_fill(iframeSelector, selector, value)` - Fill iframe inputs

### HTTP API Integration

- `playwright_get(url)` - HTTP GET requests
- `playwright_post(url, value)` - HTTP POST with payload → optional: `token`, `headers`
- `playwright_put(url, value)` / `playwright_patch(url, value)` / `playwright_delete(url)` - REST operations

### Advanced Features

- `playwright_evaluate(script)` - Execute custom JavaScript
- `playwright_console_logs()` - Retrieve browser console output
  - **Optional**: `type` (all|error|warning|log), `search` (filter text), `limit` (number), `clear` (bool)
- `playwright_expect_response(id, url)` + `playwright_assert_response(id)` - Response validation workflow
- `playwright_click_and_switch_tab(selector)` - Handle new tab navigation

### Agent Best Practices

1. **Always navigate first**: Use `playwright_navigate()` before any interactions
2. **Clean up sessions**: Call `playwright_close()` when done
3. **Handle dynamic content**: Use appropriate `waitFor` or `timeout` values
4. **Screenshot for debugging**: Capture state before/after complex interactions
5. **Validate selectors**: Ensure CSS selectors are specific and reliable

---

## figma-developer-mcp

**Purpose**: Figma design file integration, layout analysis, and asset extraction

### Core Operations

- `get_figma_data(fileKey)` - Retrieve comprehensive file layout
  - **Required**: `fileKey` (from figma.com URL: `/file/<fileKey>/`)
  - **Optional**: `nodeId` (specific node: `node-id=<nodeId>`), `depth` (traversal depth)
- `download_figma_images(fileKey, nodes, localPath)` - Extract design assets
  - **Required**: `nodes` array with `{nodeId, fileName}`, `localPath` (absolute directory path)
  - **Optional**: `imageRef` (for bitmap fills), `pngScale` (default: 2), `svgOptions`

### Asset Extraction Workflow

1. Use `get_figma_data()` to explore file structure
2. Identify target nodes (images, icons, components)
3. Call `download_figma_images()` with node specifications
4. Handle both vector (SVG) and bitmap (PNG) assets

### Agent Instructions

- Extract `fileKey` from URLs like `figma.com/file/<fileKey>/project-name`
- Use `nodeId` parameter for specific components (format: `1234:5678`)
- Create target directories before asset extraction
- Consider SVG for scalable graphics, PNG for complex imagery

---

## context7

**Purpose**: Real-time library documentation and code examples with intelligent matching

### Workflow Pattern (Always Use Both Tools)

1. `resolve-library-id(libraryName)` - Find Context7-compatible library ID
   - **Required**: `libraryName` (package/framework name)
   - **Returns**: Exact library ID for next step
2. `get-library-docs(context7CompatibleLibraryID)` - Fetch comprehensive documentation
   - **Required**: `context7CompatibleLibraryID` (from step 1)
   - **Optional**: `topic` (focus area), `tokens` (max content, default: 10000)

### Selection Criteria (For resolve-library-id)

- Prioritize exact name matches over partial matches
- Consider documentation coverage (higher Code Snippet counts preferred)
- Trust scores 7-10 indicate authoritative sources
- Choose most relevant based on query intent

### Agent Instructions

1. **Never skip resolve-library-id**: Always resolve first, even for common libraries
2. **Be specific with topics**: Use focused topic queries for better results
3. **Handle ambiguity**: Request clarification for unclear library references
4. **Token management**: Adjust token limit based on context needs

---

## mcp-server-firecrawl

**Purpose**: Intelligent web scraping, content extraction, and research automation

### Decision Matrix

| Task Type          | Tool                | Best For                    | Avoid When            |
| ------------------ | ------------------- | --------------------------- | --------------------- |
| Known single page  | `firecrawl_scrape`  | Specific content extraction | Unknown page location |
| Site exploration   | `firecrawl_map`     | URL discovery               | Need page content     |
| Research query     | `firecrawl_search`  | Finding relevant sources    | Know exact site       |
| Structured data    | `firecrawl_extract` | Specific field extraction   | Need full content     |
| Multi-page content | `firecrawl_crawl`   | Comprehensive coverage      | Token limits concern  |

### Core Operations

- `firecrawl_scrape(url)` - Single page extraction
  - **Required**: `url` (complete URL with protocol)
  - **Options**: `formats` (markdown|html|screenshot), `onlyMainContent` (bool), `waitFor` (ms)
- `firecrawl_map(url)` - Site URL discovery

  - **Required**: `url` (base site URL)
  - **Options**: `search` (filter URLs), `limit` (max results), `includeSubdomains` (bool)

- `firecrawl_search(query)` - Web search with content extraction

  - **Required**: `query` (search terms)
  - **Options**: `limit` (default: 5), `lang` (en), `country` (us), `scrapeOptions`

- `firecrawl_extract(urls)` - Structured data extraction
  - **Required**: `urls` (array of target URLs)
  - **Options**: `prompt` (extraction instructions), `schema` (JSON structure), `systemPrompt`

### Advanced Operations

- `firecrawl_crawl(url)` - Multi-page extraction (⚠️ High token usage)
  - **Safety**: Set `limit` and `maxDepth` conservatively
  - **Alternative**: Use `map` + `scrape` for better control
- `firecrawl_deep_research(query)` - Comprehensive research analysis
  - **Parameters**: `maxDepth` (1-10), `timeLimit` (30-300s), `maxUrls` (1-1000)
- `firecrawl_generate_llmstxt(url)` - AI interaction guidelines

### Content Format Options

- **markdown**: Clean, structured content (recommended)
- **html**: Full HTML with styling
- **rawHtml**: Unprocessed HTML
- **screenshot**: Visual page capture
- **links**: Extract all hyperlinks

### Agent Instructions

1. **Choose format wisely**: Use `markdown` for content analysis, `html` for structure
2. **Set appropriate limits**: Start small, increase if needed
3. **Handle async operations**: Use status checking for crawl operations
4. **Combine strategically**: Map → Scrape for controlled multi-page extraction

---

## filesystem

**Purpose**: Comprehensive file system operations within security-controlled directories

### File Content Operations

- `read_file(path)` - Single file content retrieval
- `read_multiple_files(paths)` - Efficient batch reading
- `write_file(path, content)` - Create/overwrite file (⚠️ Destructive)
- `edit_file(path, edits)` - Precise line-based modifications
  - **Format**: `edits: [{oldText: "exact match", newText: "replacement"}]`
  - **Option**: `dryRun: true` for preview

### Directory Management

- `list_directory(path)` - Contents with [FILE]/[DIR] markers
- `directory_tree(path)` - Recursive JSON structure
- `create_directory(path)` - Ensure directory exists
- `search_files(path, pattern)` - Recursive pattern matching
  - **Options**: `excludePatterns` (array of exclusions)

### File System Utilities

- `move_file(source, destination)` - Move/rename operations
- `get_file_info(path)` - Metadata (size, permissions, timestamps)
- `list_allowed_directories()` - Show accessible paths

### Safety & Security

1. **Path Validation**: Always check `list_allowed_directories()` first
2. **Backup Strategy**: Use `edit_file` with `dryRun` for preview
3. **Batch Operations**: Use `read_multiple_files` for efficiency
4. **Error Handling**: Handle permission and path errors gracefully

---

## anubis

**Purpose**: Advanced workflow execution, task management, and comprehensive reporting

### Workflow Execution Lifecycle

- `bootstrap_workflow()` - Initialize new workflow execution
  - **Options**: `initialRole` (boomerang), `executionMode` (GUIDED|AUTOMATED|HYBRID), `projectPath`
- `workflow_execution_operations(operation)` - Core execution management
  - **Operations**: create_execution, get_execution, update_execution, complete_execution
  - **Context**: Maintains execution state, progress tracking, error recovery

### Step-by-Step Execution

- `get_step_guidance(roleId)` - Detailed step instructions
  - **Optional**: `taskId`, `stepId` for context
- `report_step_completion(stepId, result)` - Report execution results
  - **Required**: `result` (success|failure), **Optional**: `executionData`, `executionTime`
- `get_step_progress(id)` - Monitor step completion status
- `get_next_available_step(roleId, id)` - Discover progression path

### Role Management & Transitions

- `get_workflow_guidance(roleName, taskId)` - Role-specific context and standards
- `get_role_transitions(fromRoleName, taskId, roleId)` - Available transitions with scoring
- `validate_transition(transitionId, taskId, roleId)` - Check requirements
- `execute_transition(transitionId, taskId, roleId)` - Perform role change
- `get_transition_history(taskId)` - Audit trail

### Reporting & Analytics

- `generate_workflow_report(reportType)` - Comprehensive reporting system
  - **Types**:
    - `interactive-dashboard` - Full analytics with filtering
    - `summary` - Key metrics and task overview
    - `task-detail` - Individual task deep-dive
    - `workflow-analytics` - Cross-task insights
    - `role-performance` - Individual performance metrics
  - **Filters**: `startDate`, `endDate`, `owner`, `priority`, `taskId`
  - **Output**: `html` (interactive) or `json` (data)

### Service Integration

- `execute_mcp_operation(serviceName, operation, parameters)` - Workflow service calls
  - **Services**: TaskOperations, PlanningOperations, WorkflowOperations, ReviewOperations, ResearchOperations, SubtaskOperations

### Agent Workflow Patterns

1. **Initialize**: `bootstrap_workflow()` → `get_step_guidance()`
2. **Execute**: Perform local operations → `report_step_completion()`
3. **Progress**: `get_step_progress()` → `get_next_available_step()`
4. **Transition**: `get_role_transitions()` → `validate_transition()` → `execute_transition()`
5. **Report**: `generate_workflow_report()` for analytics

---

## Integration Patterns & Best Practices

### Multi-Service Workflows

1. **Research → Analysis → Implementation**
   - `firecrawl_search` → `sequential-thinking` → `filesystem` operations
2. **Design → Code → Test**
   - `figma-developer-mcp` → `context7` → `playwright` automation
3. **Documentation → Workflow → Reporting**
   - `context7` → `anubis` → `generate_workflow_report`

### Error Handling Strategy

1. **Validation First**: Check paths, services, and requirements before execution
2. **Graceful Degradation**: Handle partial failures in multi-step operations
3. **Resource Cleanup**: Close browser sessions, clear temporary files
4. **State Recovery**: Use workflow manager for complex operation recovery

### Performance Considerations

1. **Batch Operations**: Use `read_multiple_files`, multi-URL scraping
2. **Async Management**: Handle crawl operations with status checking
3. **Token Optimization**: Use targeted searches, limit content extraction
4. **Resource Limits**: Set appropriate timeouts and result limits

### Security Guidelines

1. **Path Security**: Validate all file paths against allowed directories
2. **Content Validation**: Sanitize extracted web content
3. **API Safety**: Use appropriate timeouts and rate limiting
4. **Workflow Isolation**: Maintain separation between different workflow executions

This comprehensive reference provides the depth needed for effective tool utilization while maintaining clarity and actionable guidance for AI agents.

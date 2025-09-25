# README Generation Prompt Template

## Purpose

Generate comprehensive, professional README files for projects using AI assistance.

## Variables

- `{PROJECT_NAME}` - Name of the project
- `{PROJECT_TYPE}` - Type of project (web app, API, library, etc.)
- `{LANGUAGE}` - Primary programming language
- `{DESCRIPTION}` - Brief project description
- `{FEATURES}` - Key features or functionality
- `{TECH_STACK}` - Technologies and frameworks used

## Prompt

```
Create a comprehensive, professional README.md file for the following project:

**Project Details:**
- Name: {PROJECT_NAME}
- Type: {PROJECT_TYPE}
- Language: {LANGUAGE}
- Description: {DESCRIPTION}
- Key Features: {FEATURES}
- Tech Stack: {TECH_STACK}

Please generate a README that includes:

## 📋 Required Sections

### 1. Project Title & Description
- Eye-catching title with relevant emojis
- Clear, concise project description
- Value proposition or problem it solves

### 2. Features & Highlights
- Key features listed with emojis
- What makes this project unique
- Screenshots or demo GIFs (placeholder text)

### 3. Quick Start
- Prerequisites and requirements
- Installation instructions
- Basic usage example
- "Hello World" equivalent

### 4. Installation Guide
- Step-by-step installation process
- Different installation methods (npm, pip, etc.)
- Environment setup instructions
- Common installation issues

### 5. Usage & Examples
- Basic usage examples with code
- Common use cases
- API usage (if applicable)
- Configuration options

### 6. Documentation
- Links to detailed documentation
- API reference (if applicable)
- Examples and tutorials

### 7. Contributing
- How to contribute
- Development setup
- Coding standards
- Pull request process

### 8. License & Credits
- License information
- Acknowledgments
- Third-party libraries used

## 🎨 Style Requirements

- Use modern Markdown formatting
- Include relevant emojis for visual appeal
- Use code blocks with syntax highlighting
- Create clear section hierarchy
- Include badges (build status, version, etc.)
- Make it scannable with good structure

## 📊 Additional Elements

- Table of contents for long READMEs
- Visual diagrams or flowcharts (ASCII art)
- Comparison tables (if relevant)
- FAQ section
- Troubleshooting guide
- Roadmap or future plans

Make the README engaging, professional, and accessible to both technical and non-technical users. Focus on getting users up and running quickly while providing comprehensive information.
```

## Example Usage

### Web Application README

```
Create a comprehensive, professional README.md file for the following project:

**Project Details:**
- Name: TaskFlow
- Type: Web Application
- Language: JavaScript (React)
- Description: A modern task management application with real-time collaboration
- Key Features: Real-time sync, team collaboration, drag-and-drop interface, mobile-responsive
- Tech Stack: React, Node.js, Express, MongoDB, Socket.io, Tailwind CSS
```

### Python Library README

```
Create a comprehensive, professional README.md file for the following project:

**Project Details:**
- Name: DataViz Pro
- Type: Python Library
- Language: Python
- Description: A powerful data visualization library with interactive charts
- Key Features: Interactive charts, multiple chart types, export options, Jupyter integration
- Tech Stack: Python, Matplotlib, Plotly, Pandas, NumPy
```

### API Service README

```
Create a comprehensive, professional README.md file for the following project:

**Project Details:**
- Name: WeatherAPI
- Type: REST API Service
- Language: Node.js
- Description: A reliable weather data API with global coverage
- Key Features: Global weather data, forecasts, historical data, rate limiting
- Tech Stack: Node.js, Express, PostgreSQL, Redis, Docker
```

## Tips

### For Better Results

1. **Be Specific**: Provide detailed project information for more accurate content
2. **Include Context**: Mention target audience (developers, end-users, businesses)
3. **Specify Tone**: Request formal, casual, or technical tone as appropriate
4. **Add Constraints**: Mention any specific requirements (length, format, etc.)

### Follow-up Prompts

- "Make the README more beginner-friendly"
- "Add a troubleshooting section with common issues"
- "Create a more detailed API documentation section"
- "Add visual elements like ASCII diagrams"
- "Include performance benchmarks section"

### Customization Options

- **Badge Generation**: "Include relevant badges for build status, coverage, etc."
- **Visual Elements**: "Add ASCII art diagrams or flowcharts"
- **Interactive Elements**: "Include interactive code examples"
- **Multiple Formats**: "Create both technical and non-technical versions"

### Best Practices

- Keep the README updated with the project
- Use consistent formatting and style
- Include real examples and screenshots
- Test all installation and usage instructions
- Make it scannable with clear headings

---

_Template from CopilotFlow AI Prompt Library_

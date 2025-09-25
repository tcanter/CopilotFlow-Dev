# CopilotFlow - Multi-Language AI Development Toolkit

🚀 **AI-Powered Development Starter Kit with Multi-Language Support**

CopilotFlow is an intelligent development toolkit that supports **JavaScript**, **Python**, and
**PowerShell** projects with AI-enhanced automation, documentation generation, code analysis, and
daily workflow optimization.

## ✨ Features

## Documentation

- [Instructions](docs/INSTRUCTIONS.md)
- [Instructions Template](docs/INSTRUCTIONS.template.md)
- [Project Story](docs/MyStory.md)
- [Project Context](docs/PROJECT_CONTEXT.md)
- [Quick Start Guide](docs/QUICKSTART.md)
- [Release Notes](docs/RELEASE_NOTES.md)
- [Release Summary v1.0.1](docs/RELEASE_SUMMARY_v1.0.1.md)
- [Setup Tasks](docs/SETUP_TASKS.md) npm install

# Run interactive setup

npm run setup

````

During setup, you'll choose:

- **Primary language**: JavaScript, Python, or PowerShell
- **Project type**: Web app, API, CLI tool, automation script, etc.
- **AI provider**: OpenAI, Azure OpenAI, Anthropic, or local model
- **Development tools**: Language-specific linters, formatters, and test frameworks

### 2. Language-Specific Configuration

#### JavaScript Projects

```bash
# The setup will create:
# - package.json with appropriate scripts
# - ESLint/Prettier configuration
# - TypeScript config (optional)
# - Jest test setup

npm start          # Start your application
npm test           # Run tests
npm run lint       # Check code quality
npm run format     # Format code
````

#### Python Projects

```bash
# The setup will create:
# - requirements.txt
# - setup.py or pyproject.toml
# - Black/Flake8/mypy configuration
# - pytest setup

python main.py                    # Run your application
python -m pytest                 # Run tests
python -m flake8                  # Lint code
python -m black .                 # Format code

# Virtual environment setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### PowerShell Projects

```bash
# The setup will create:
# - .psd1 module manifest
# - .psm1 module file
# - Public/Private folder structure
# - PSScriptAnalyzer configuration
# - Pester test setup

Import-Module .\YourModule.psm1   # Import your module
Invoke-Pester -Path .\Tests       # Run tests
Invoke-ScriptAnalyzer -Path .     # Analyze code
```

## 🤖 AI Features

### Daily Workflow Automation

```bash
npm run ai:daily-workflow
```

- Analyzes recent code changes
- Suggests improvements and optimizations
- Updates documentation automatically
- Generates commit messages
- Provides daily development insights

### Documentation Generation

```bash
npm run ai:generate-docs
```

**JavaScript Projects**: API docs, package info, usage examples **Python Projects**: Module docs,
API reference, installation guides **PowerShell Projects**: Cmdlet docs, module overview, usage
examples

### Code Analysis

```bash
npm run ai:analyze-code
```

- Language-specific code quality analysis
- Security vulnerability detection
- Performance optimization suggestions
- Best practice recommendations

### AI Code Review

```bash
npm run ai:code-review
```

- Comprehensive code review with suggestions
- Language-specific best practices
- Security and performance insights

## 📁 Project Structure

```
your-project/
├── .copilotflow.json          # Project configuration
├── .env                       # Environment variables (JS/Python)
├── Config.ps1                 # PowerShell configuration
├── docs/                      # Generated documentation
│   ├── API.md
│   ├── USER_GUIDE.md
│   └── EXAMPLES.md
├── scripts/
│   └── ai-automation/         # AI workflow scripts
├── temp/
│   └── ai-outputs/           # AI generation outputs
└── logs/
    └── ai-conversations/     # AI interaction logs

# Language-specific templates
## JavaScript Templates
├── templates/javascript/
│   ├── index.js         # Main application entry
│   └── package.json     # Dependencies template

## Python Templates
├── templates/python/
│   ├── main.py          # Main application entry
│   ├── requirements.txt # Dependencies
│   ├── setup.py         # Package setup
│   └── pyproject.toml   # Modern Python config

## PowerShell Templates
├── templates/powershell/
│   ├── Module.psm1      # Main module
│   └── Module.psd1      # Module manifest

## PowerShell
├── YourModule.psd1           # Module manifest
├── YourModule.psm1           # Module file
├── Public/                   # Public functions
├── Private/                  # Private functions
└── Tests/                    # Pester tests
```

## ⚙️ Configuration

### Environment Variables

```bash
# .env file (JavaScript/Python)
PROJECT_NAME=your-project
AI_ENABLED=true
AI_PROVIDER=OpenAI
AI_MODEL=gpt-4
OPENAI_API_KEY=your_api_key_here
```

### PowerShell Configuration

```powershell
# Config.ps1
$Config = @{
    ProjectName = "your-project"
    AIEnabled = $true
    AIProvider = "OpenAI"
    AIModel = "gpt-4"
}
```

## 🛠️ Language-Specific Commands

### Universal Commands (All Languages)

```bash
npm run setup                 # Interactive project setup
npm run ai:daily-workflow     # Daily AI automation
npm run ai:analyze-code       # AI code analysis
npm run ai:generate-docs      # Generate documentation
npm run ai:commit-message     # AI commit messages
npm run ai:code-review        # AI code review
npm test                      # Run tests (language-aware)
npm run lint                  # Run linter (language-aware)
npm run format                # Format code (language-aware)
```

### JavaScript Specific

```bash
npm start                     # Start application
npm run dev                   # Development mode
npm run build                 # Build for production
```

### Python Specific

```bash
python main.py                # Run main application
pip install -r requirements.txt  # Install dependencies
python -m venv venv           # Create virtual environment
```

### PowerShell Specific

```powershell
Import-Module .\Module.psm1   # Import module
Get-Command -Module ModuleName # List cmdlets
Update-Help                   # Update help
```

## 🧹 Project Maintenance

### Cleanup & Backup System

```bash
npm run cleanup              # Full project cleanup with backup
npm run cleanup:backup       # Create backup only
npm run cleanup:restore      # Interactive restore from backups
npm run cleanup:list         # List all available backups
npm run cleanup:manage       # Manage backups (delete old ones)
```

The cleanup system provides safe project reset with multiple timestamped backups. See
[docs/CLEANUP.md](docs/CLEANUP.md) for detailed usage.

## 🔧 Development Tools Integration

### JavaScript

- **ESLint**: Code linting and style checking
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Optional type checking
- **Husky**: Git hooks for quality gates

### Python

- **Black**: Code formatting
- **Flake8**: Linting and style checking
- **mypy**: Type checking
- **pytest**: Testing framework
- **pre-commit**: Git hooks

### PowerShell

- **PSScriptAnalyzer**: Code analysis and best practices
- **Pester**: Testing framework
- **PowerShell formatter**: Built-in formatting
- **Comment-based help**: Documentation standards

## 📚 AI-Generated Documentation

CopilotFlow automatically generates comprehensive documentation tailored to your language:

### JavaScript Projects

- **API.md**: REST API documentation with examples
- **PACKAGE.md**: Package overview and scripts
- **USER_GUIDE.md**: End-user documentation
- **DEVELOPER_GUIDE.md**: Development setup and workflows

### Python Projects

- **API.md**: FastAPI/Flask endpoint documentation
- **MODULES.md**: Python module and class documentation
- **INSTALLATION.md**: Setup and dependency management
- **USER_GUIDE.md**: Application usage guide

### PowerShell Projects

- **CMDLETS.md**: Function and parameter documentation
- **MODULE.md**: Module overview and structure
- **EXAMPLES.md**: Usage examples and workflows
- **INSTALLATION.md**: Module installation guide

## 🎯 Project Types Supported

### JavaScript

- Web Applications (React, Vue, Angular)
- API Servers (Express, Fastify, NestJS)
- Mobile Apps (React Native)
- CLI Tools
- Libraries and Packages

### Python

- AI/ML Projects (TensorFlow, PyTorch, Scikit-learn)
- Web Applications (Django, Flask, FastAPI)
- Data Analysis Projects
- API Servers
- CLI Tools and Scripts

### PowerShell

- System Administration Tools
- Automation Scripts
- Azure Management Tools
- DevOps Tools
- PowerShell Modules

## � Testing Infrastructure (v1.0.1)

CopilotFlow includes a robust testing framework with **73 comprehensive tests** across 4 test
suites, optimized for cross-platform reliability.

### Test Suites Overview

- **Setup Project Wizard**: 20 tests - Project initialization and configuration
- **Universal Runner**: 23 tests - Cross-language command execution
- **Cleanup Project System**: 17 tests - Backup, restore, and project maintenance
- **AI Automation Scripts**: 13 tests - AI workflow validation and integration

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/unit/setup-project.test.js
```

### Testing Features

- **Cross-Platform Compatibility**: Optimized for Windows, macOS, and Linux
- **File Lock Handling**: Advanced cleanup logic for Windows file systems
- **Async Operation Management**: Proper handling of timers, promises, and file handles
- **Serial Test Execution**: Prevents file conflicts with `maxWorkers: 1`
- **Clean Exit**: No forced Jest termination with `detectOpenHandles: true`

### Test Configuration Highlights

```javascript
// jest.config.js - Production-ready configuration
{
  maxWorkers: 1,              // Serial execution for reliability
  forceExit: false,           // Clean Jest exit
  detectOpenHandles: true,    // Async operation detection
  testTimeout: 30000,         // Generous timeout for complex tests
  clearMocks: true,           // Clean state between tests
}
```

### Windows-Specific Improvements

- **Retry Logic**: Up to 5 attempts for file cleanup operations
- **Progressive Delays**: Increasing wait times between retry attempts
- **Garbage Collection**: Optional `global.gc()` to release file handles
- **Non-Blocking Warnings**: Cleanup failures don't break tests

### Coverage Requirements

- **Branches**: 70% minimum coverage
- **Functions**: 70% minimum coverage
- **Lines**: 70% minimum coverage
- **Statements**: 70% minimum coverage

All tests pass consistently with ~45-50 second execution time, ensuring reliable development
workflows.

## �🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run the setup: `npm run setup`
4. Make your changes
5. Run AI code review: `npm run ai:code-review`
6. Generate commit message: `npm run ai:commit-message`
7. Commit and push your changes
8. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models and API
- The open-source community for excellent development tools
- Contributors and users who make this project better

---

**Start building smarter with CopilotFlow! 🚀✨**

Choose your language, run the setup, and let AI enhance your development workflow.

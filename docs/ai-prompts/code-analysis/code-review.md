# Code Review Prompt Template

## Purpose

Perform comprehensive code reviews with AI assistance to identify issues, suggest improvements, and
ensure code quality standards.

## Variables

- `{CODE_BLOCK}` - The code to review
- `{LANGUAGE}` - Programming language (e.g., JavaScript, Python, C#)
- `{CONTEXT}` - Additional context about the code's purpose
- `{FOCUS_AREAS}` - Specific areas to focus on (optional)

## Prompt

````
Please perform a comprehensive code review for the following {LANGUAGE} code:

**Context:** {CONTEXT}

**Code to Review:**
```{LANGUAGE}
{CODE_BLOCK}
````

**Focus Areas:** {FOCUS_AREAS}

Please analyze the code for:

## 🔍 Code Quality

- Code readability and maintainability
- Naming conventions and clarity
- Code structure and organization
- Adherence to language best practices

## 🐛 Potential Issues

- Logic errors or bugs
- Edge cases not handled
- Error handling and validation
- Resource management (memory leaks, file handles, etc.)

## 🚀 Performance

- Performance bottlenecks
- Inefficient algorithms or data structures
- Unnecessary computations
- Optimization opportunities

## 🔒 Security

- Security vulnerabilities
- Input validation issues
- Authentication/authorization concerns
- Data exposure risks

## 🧪 Testing

- Test coverage gaps
- Testability of the code
- Missing test scenarios
- Mock/stub opportunities

## 📚 Documentation

- Missing or unclear comments
- Documentation completeness
- API documentation needs
- Code examples required

## 🎯 Suggestions

- Specific improvement recommendations
- Alternative implementation approaches
- Design pattern applications
- Refactoring opportunities

Please prioritize issues by severity (Critical, High, Medium, Low) and provide specific, actionable
recommendations with code examples where helpful.

```

## Example Usage

### JavaScript Code Review
```

Please perform a comprehensive code review for the following JavaScript code:

**Context:** User authentication service for a web application

**Code to Review:**

```javascript
function loginUser(email, password) {
  const user = database.findUser(email);
  if (user && user.password === password) {
    return { success: true, token: generateToken(user.id) };
  }
  return { success: false };
}
```

**Focus Areas:** Security, error handling, authentication best practices

```

### Python Code Review
```

Please perform a comprehensive code review for the following Python code:

**Context:** Data processing function for ML pipeline

**Code to Review:**

```python
def process_data(data):
    result = []
    for item in data:
        if item['value'] > 0:
            result.append(item['value'] * 2)
    return result
```

**Focus Areas:** Performance, error handling, Pythonic code practices

```

## Tips

### For Better Results
1. **Provide Context**: Include information about the code's purpose, requirements, and constraints
2. **Specify Focus Areas**: Direct the AI to specific concerns (security, performance, etc.)
3. **Include Surrounding Code**: Provide relevant context from related functions or classes
4. **Mention Standards**: Reference specific coding standards or style guides to follow

### Follow-up Prompts
- "Can you provide code examples for your suggestions?"
- "What would be the priority order for fixing these issues?"
- "Are there any design patterns that would improve this code?"
- "How would you write unit tests for this code?"

### AI Model Considerations
- **GPT-4**: Excellent for comprehensive analysis and detailed explanations
- **Claude**: Strong at identifying security issues and providing structured feedback
- **GitHub Copilot**: Good for quick reviews and immediate suggestions in IDE

---

*Template from CopilotFlow AI Prompt Library*
```

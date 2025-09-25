# Unit Test Generation Prompt Template

## Purpose

Generate comprehensive unit tests for functions, classes, and modules using AI assistance.

## Variables

- `{CODE_BLOCK}` - The code to test
- `{LANGUAGE}` - Programming language
- `{TEST_FRAMEWORK}` - Testing framework (Jest, pytest, NUnit, etc.)
- `{FUNCTION_NAME}` - Name of function/class being tested
- `{CONTEXT}` - Additional context about the code's purpose

## Prompt

````
Generate comprehensive unit tests for the following {LANGUAGE} code using {TEST_FRAMEWORK}:

**Function/Class to Test:** {FUNCTION_NAME}
**Context:** {CONTEXT}

**Code Under Test:**
```{LANGUAGE}
{CODE_BLOCK}
````

Please create unit tests that cover:

## 🎯 Test Coverage Areas

### 1. Happy Path Testing

- Normal execution with valid inputs
- Expected return values
- Standard use cases

### 2. Edge Cases

- Boundary conditions (min/max values)
- Empty inputs (null, undefined, empty arrays/strings)
- Zero values and negative numbers
- Large datasets or extreme values

### 3. Error Handling

- Invalid input types
- Out-of-range values
- Network failures (for API calls)
- Exception scenarios

### 4. State Testing

- Initial state verification
- State changes after operations
- Side effects and mutations
- Cleanup verification

### 5. Integration Points

- Mock external dependencies
- Database interactions
- API calls
- File system operations

## 📋 Test Requirements

- **Clear Test Names**: Descriptive test names that explain what's being tested
- **AAA Pattern**: Arrange, Act, Assert structure
- **Independence**: Each test should be independent and isolated
- **Deterministic**: Tests should produce consistent results
- **Fast Execution**: Tests should run quickly
- **Good Coverage**: Aim for high code coverage

## 🛠️ Test Structure

For each test, include:

- Setup/Arrange phase
- Execution/Act phase
- Verification/Assert phase
- Cleanup (if needed)

## 📊 Test Data

- Use realistic test data
- Include both valid and invalid inputs
- Consider different data types and formats
- Use fixtures for complex test data

Please provide:

1. Complete test file with all necessary imports
2. Mock setup for dependencies
3. Test data fixtures (if needed)
4. Comments explaining complex test scenarios
5. Suggestions for additional test scenarios

```

## Example Usage

### JavaScript/Jest Testing
```

Generate comprehensive unit tests for the following JavaScript code using Jest:

**Function/Class to Test:** calculateOrderTotal **Context:** E-commerce order calculation with taxes
and discounts

**Code Under Test:**

```javascript
function calculateOrderTotal(items, taxRate = 0.1, discountCode = null) {
  if (!items || items.length === 0) {
    throw new Error('Items array cannot be empty');
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountCode === 'SAVE10' ? subtotal * 0.1 : 0;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * taxRate;

  return {
    subtotal,
    discount,
    tax,
    total: taxableAmount + tax,
  };
}
```

```

### Python/pytest Testing
```

Generate comprehensive unit tests for the following Python code using pytest:

**Function/Class to Test:** UserValidator **Context:** User registration validation class

**Code Under Test:**

```python
class UserValidator:
    def validate_email(self, email):
        if not email or '@' not in email:
            return False
        return True

    def validate_password(self, password):
        if len(password) < 8:
            return False
        return any(c.isdigit() for c in password) and any(c.isalpha() for c in password)
```

```

### C#/NUnit Testing
```

Generate comprehensive unit tests for the following C# code using NUnit:

**Function/Class to Test:** BankAccount **Context:** Simple bank account class with deposit/withdraw
operations

**Code Under Test:**

```csharp
public class BankAccount
{
    private decimal balance;

    public decimal Balance => balance;

    public void Deposit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive");
        balance += amount;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive");
        if (amount > balance)
            throw new InvalidOperationException("Insufficient funds");
        balance -= amount;
    }
}
```

```

## Tips

### For Better Results
1. **Provide Context**: Explain what the code does and its business logic
2. **Specify Framework**: Mention specific testing framework and version
3. **Include Dependencies**: List external dependencies that need mocking
4. **Mention Constraints**: Specify coverage requirements or testing standards

### Follow-up Prompts
- "Add more edge case tests for the error scenarios"
- "Create integration tests for this code"
- "Generate test data fixtures for these tests"
- "Add performance tests for this function"
- "Create parameterized tests for multiple input scenarios"

### Testing Best Practices
- **Test Behavior, Not Implementation**: Focus on what the code does, not how
- **One Assertion Per Test**: Keep tests focused and specific
- **Use Descriptive Names**: Test names should explain the scenario
- **Mock External Dependencies**: Isolate the code under test
- **Test Error Conditions**: Don't just test the happy path

### Framework-Specific Considerations

#### Jest
- Use `describe` blocks for grouping tests
- Leverage `beforeEach`/`afterEach` for setup/cleanup
- Use Jest mocks for dependencies

#### pytest
- Use fixtures for test data and setup
- Leverage parametrized tests for multiple scenarios
- Use pytest-mock for mocking

#### NUnit
- Use `[Test]` attributes
- Leverage `[SetUp]`/`[TearDown]` for preparation
- Use `[TestCase]` for parameterized tests

---

*Template from CopilotFlow AI Prompt Library*
```

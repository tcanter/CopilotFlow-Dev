"""
CopilotFlow
An AI-powered project built with CopilotFlow

Author: Your Name
Version: 1.0.0
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Main entry point for CopilotFlow"""
    print(f"Welcome to {os.getenv('PROJECT_NAME', 'CopilotFlow')}")
    print(f"{os.getenv('PROJECT_DESCRIPTION', 'An AI-powered project built with CopilotFlow')}")
    
    # Your code here
    pass

if __name__ == "__main__":
    main()

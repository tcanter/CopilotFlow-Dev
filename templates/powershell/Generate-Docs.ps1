#Requires -Version 5.1

<#
.SYNOPSIS
    PowerShell AI Documentation Generator
    Automatically generates and updates PowerShell project documentation

.DESCRIPTION
    This script generates comprehensive documentation for PowerShell projects
    using AI assistance. It analyzes PowerShell modules, functions, and cmdlets
    to create detailed documentation.

.PARAMETER OutputPath
    The output directory for generated documentation (default: docs)

.EXAMPLE
    .\Generate-Docs.ps1
    
.EXAMPLE
    .\Generate-Docs.ps1 -OutputPath "C:\MyProject\Documentation"
#>

[CmdletBinding()]
param(
  [string]$OutputPath = "docs"
)

# Import required modules
if (Get-Module -ListAvailable -Name PowerShellAI) {
  Import-Module PowerShellAI -Force
}
else {
  Write-Warning "PowerShellAI module not found. Install with: Install-Module PowerShellAI"
}

class PowerShellDocumentationGenerator {
  [string]$OutputDir
  [string]$TempDir
  [hashtable]$ProjectConfig
  [string]$ProjectRoot
    
  PowerShellDocumentationGenerator([string]$OutputPath) {
    $this.ProjectRoot = Get-Location
    $this.OutputDir = Join-Path $this.ProjectRoot $OutputPath
    $this.TempDir = Join-Path $this.ProjectRoot "temp\ai-outputs"
    $this.ProjectConfig = $this.LoadProjectConfig()
        
    # Ensure directories exist
    if (-not (Test-Path $this.OutputDir)) {
      New-Item -Path $this.OutputDir -ItemType Directory -Force | Out-Null
    }
    if (-not (Test-Path $this.TempDir)) {
      New-Item -Path $this.TempDir -ItemType Directory -Force | Out-Null
    }
  }
    
  [hashtable] LoadProjectConfig() {
    $configPath = Join-Path $this.ProjectRoot ".copilotflow.json"
        
    if (Test-Path $configPath) {
      try {
        $configContent = Get-Content -Path $configPath -Raw | ConvertFrom-Json
        return @{
          projectName     = $configContent.projectName
          primaryLanguage = $configContent.primaryLanguage
          projectType     = $configContent.projectType
          description     = $configContent.description
          author          = $configContent.author
          version         = $configContent.version
        }
      }
      catch {
        Write-Warning "Could not load project config: $_"
      }
    }
        
    return @{
      primaryLanguage = "powershell"
      projectType     = "custom"
    }
  }
    
  [void] GenerateDocs() {
    Write-Host "📝 Starting PowerShell AI Documentation Generation..." -ForegroundColor Green
    Write-Host "🔧 Detected language: POWERSHELL" -ForegroundColor Yellow
    Write-Host ""
        
    $tasks = @(
      @{ Name = "Cmdlet Documentation"; Function = { $this.GenerateCmdletDocs() } }
      @{ Name = "Module Documentation"; Function = { $this.GenerateModuleDocs() } }
      @{ Name = "Usage Examples"; Function = { $this.GenerateUsageExamples() } }
      @{ Name = "Installation Guide"; Function = { $this.GenerateInstallationGuide() } }
      @{ Name = "User Guide"; Function = { $this.GenerateUserGuide() } }
      @{ Name = "Developer Guide"; Function = { $this.GenerateDeveloperGuide() } }
      @{ Name = "Contributing Guide"; Function = { $this.GenerateContributingGuide() } }
    )
        
    $results = @{}
        
    foreach ($task in $tasks) {
      Write-Host "📋 Generating: $($task.Name)" -ForegroundColor Cyan
      try {
        $results[$task.Name] = & $task.Function
        Write-Host "✅ Completed: $($task.Name)" -ForegroundColor Green
        Write-Host ""
      }
      catch {
        Write-Host "❌ Failed: $($task.Name) - $_" -ForegroundColor Red
        Write-Host ""
        $results[$task.Name] = @{ error = $_.Exception.Message }
      }
    }
        
    $this.UpdateMainReadme()
    $this.GenerateIndex($results)
        
    Write-Host "🎉 PowerShell documentation generation completed!" -ForegroundColor Green
  }
    
  [hashtable] GenerateCmdletDocs() {
    $psFiles = $this.GetPowerShellFiles()
    $cmdlets = $this.ExtractCmdlets($psFiles)
        
    if ($cmdlets.Count -eq 0) {
      return @{ message = "No PowerShell cmdlets found" }
    }
        
    $cmdletInfo = $cmdlets | ForEach-Object {
      "Function: $($_.Name)
Parameters: $($_.Parameters -join ', ')
Synopsis: $($_.Synopsis)
File: $($_.File)
"
    }
        
    $prompt = @"
Generate comprehensive PowerShell cmdlet documentation for the following functions:

$($cmdletInfo -join "`n")

Please provide:
1. Detailed cmdlet descriptions
2. Parameter explanations with types and examples
3. Input/output descriptions
4. Usage examples with different parameter combinations
5. Common scenarios and workflows
6. Notes and warnings
7. Related cmdlets or functions

Format as Markdown with proper PowerShell code blocks and follow PowerShell documentation standards.
"@
        
    try {
      if (Get-Command Invoke-OpenAIChat -ErrorAction SilentlyContinue) {
        $response = Invoke-OpenAIChat -Message $prompt -Model "gpt-4" -Temperature 0.3
        $cmdletDocs = $response.choices[0].message.content
      }
      else {
        $cmdletDocs = $this.GenerateBasicCmdletDocs($cmdlets)
      }
            
      $outputFile = Join-Path $this.OutputDir "CMDLETS.md"
      $content = @"
# PowerShell Cmdlet Documentation

$cmdletDocs

---
*Generated by CopilotFlow AI on $(Get-Date)*
"@
      Set-Content -Path $outputFile -Value $content -Encoding UTF8
            
      return @{
        cmdletsDocumented = $cmdlets.Count
        filePath          = "docs/CMDLETS.md"
      }
    }
    catch {
      throw "Failed to generate cmdlet documentation: $_"
    }
  }
    
  [hashtable] GenerateModuleDocs() {
    $manifestInfo = $this.GetModuleManifest()
    $moduleStructure = $this.GetModuleStructure()
        
    $prompt = @"
Generate comprehensive PowerShell module documentation:

Project: $($this.ProjectConfig.projectName)
Manifest Info: $manifestInfo
Module Structure: $($moduleStructure | ConvertTo-Json -Depth 3)

Please provide:
1. Module overview and purpose
2. Installation instructions
3. Import instructions  
4. Available functions and their purposes
5. Module dependencies and requirements
6. Version information and changelog
7. Configuration options
8. Troubleshooting guide

Format as Markdown with proper PowerShell code blocks.
"@
        
    try {
      if (Get-Command Invoke-OpenAIChat -ErrorAction SilentlyContinue) {
        $response = Invoke-OpenAIChat -Message $prompt -Model "gpt-4" -Temperature 0.3
        $moduleDocs = $response.choices[0].message.content
      }
      else {
        $moduleDocs = $this.GenerateBasicModuleDocs()
      }
            
      $outputFile = Join-Path $this.OutputDir "MODULE.md"
      $content = @"
# PowerShell Module Documentation

$moduleDocs

---
*Generated by CopilotFlow AI on $(Get-Date)*
"@
      Set-Content -Path $outputFile -Value $content -Encoding UTF8
            
      return @{ filePath = "docs/MODULE.md" }
    }
    catch {
      throw "Failed to generate module documentation: $_"
    }
  }
    
  [hashtable] GenerateUsageExamples() {
    $psFiles = $this.GetPowerShellFiles()
    $cmdlets = $this.ExtractCmdlets($psFiles)
        
    $functionList = $cmdlets | ForEach-Object { "- $($_.Name): $($_.Synopsis)" }
        
    $prompt = @"
Generate comprehensive usage examples for this PowerShell module:

Available Functions:
$($functionList -join "`n")

Project: $($this.ProjectConfig.projectName)
Type: $($this.ProjectConfig.projectType)

Please provide:
1. Basic usage examples for each function
2. Advanced scenarios and parameter combinations
3. Real-world use cases and workflows
4. Pipeline examples
5. Error handling examples
6. Best practices and tips
7. Common troubleshooting scenarios

Format as Markdown with clear explanations and PowerShell code blocks.
"@
        
    try {
      if (Get-Command Invoke-OpenAIChat -ErrorAction SilentlyContinue) {
        $response = Invoke-OpenAIChat -Message $prompt -Model "gpt-4" -Temperature 0.4
        $examples = $response.choices[0].message.content
      }
      else {
        $examples = $this.GenerateBasicExamples($cmdlets)
      }
            
      $outputFile = Join-Path $this.OutputDir "EXAMPLES.md"
      $content = @"
# Usage Examples

$examples

---
*Generated by CopilotFlow AI on $(Get-Date)*
"@
      Set-Content -Path $outputFile -Value $content -Encoding UTF8
            
      return @{ filePath = "docs/EXAMPLES.md" }
    }
    catch {
      throw "Failed to generate usage examples: $_"
    }
  }
    
  [hashtable] GenerateInstallationGuide() {
    # Generate installation guide
    return @{ filePath = "docs/INSTALLATION.md" }
  }
    
  [hashtable] GenerateUserGuide() {
    # Generate user guide
    return @{ filePath = "docs/USER_GUIDE.md" }
  }
    
  [hashtable] GenerateDeveloperGuide() {
    # Generate developer guide  
    return @{ filePath = "docs/DEVELOPER_GUIDE.md" }
  }
    
  [hashtable] GenerateContributingGuide() {
    # Generate contributing guide
    return @{ filePath = "docs/CONTRIBUTING.md" }
  }
    
  [array] GetPowerShellFiles() {
    $files = @()
    $files += Get-ChildItem -Path $this.ProjectRoot -Filter "*.ps1" -Recurse | Select-Object -First 20
    $files += Get-ChildItem -Path $this.ProjectRoot -Filter "*.psm1" -Recurse | Select-Object -First 5
    return $files | Where-Object { $_.FullName -notlike "*Tests*" }
  }
    
  [array] ExtractCmdlets([array]$Files) {
    $cmdlets = @()
        
    foreach ($file in $Files) {
      try {
        $content = Get-Content -Path $file.FullName -Raw
                
        # Extract function definitions
        $pattern = 'function\s+([A-Za-z][\w-]*)\s*\{'
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                
        foreach ($match in $matches) {
          $functionName = $match.Groups[1].Value
                    
          # Extract parameters
          $paramPattern = '\$([A-Za-z]\w*)'
          $paramMatches = [regex]::Matches($content, $paramPattern)
          $parameters = $paramMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
                    
          # Extract synopsis from comment-based help
          $synopsisPattern = '\.SYNOPSIS\s+(.*?)(?=\.|\n\s*#|$)'
          $synopsisMatch = [regex]::Match($content, $synopsisPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
          $synopsis = if ($synopsisMatch.Success) { $synopsisMatch.Groups[1].Value.Trim() } else { "No synopsis available" }
                    
          $cmdlets += @{
            Name       = $functionName
            File       = $file.FullName
            Parameters = $parameters
            Synopsis   = $synopsis
          }
        }
      }
      catch {
        Write-Warning "Could not parse file $($file.FullName): $_"
      }
    }
        
    return $cmdlets
  }
    
  [string] GetModuleManifest() {
    $manifestFiles = Get-ChildItem -Path $this.ProjectRoot -Filter "*.psd1"
    if ($manifestFiles.Count -gt 0) {
      return Get-Content -Path $manifestFiles[0].FullName -Raw
    }
    return "No module manifest found"
  }
    
  [hashtable] GetModuleStructure() {
    $structure = @{}
        
    $folders = @("Public", "Private", "Tests", "Classes", "Enums")
    foreach ($folder in $folders) {
      $folderPath = Join-Path $this.ProjectRoot $folder
      if (Test-Path $folderPath) {
        $files = Get-ChildItem -Path $folderPath -Filter "*.ps1" | Select-Object -ExpandProperty Name
        $structure[$folder] = $files
      }
    }
        
    return $structure
  }
    
  [string] GenerateBasicCmdletDocs([array]$Cmdlets) {
    $docs = @()
    foreach ($cmdlet in $Cmdlets) {
      $docs += @"
## $($cmdlet.Name)

**Synopsis:** $($cmdlet.Synopsis)

**File:** $($cmdlet.File)

**Parameters:**
$($cmdlet.Parameters | ForEach-Object { "- `$$_" })

**Example:**
``````powershell
$($cmdlet.Name)
``````

"@
    }
    return $docs -join "`n"
  }
    
  [string] GenerateBasicModuleDocs() {
    return @"
# Module Overview

This PowerShell module provides functionality for $($this.ProjectConfig.projectName).

## Installation

1. Download the module files
2. Place them in your PowerShell modules directory
3. Import the module: ``Import-Module $($this.ProjectConfig.projectName)``

## Usage

Run ``Get-Command -Module $($this.ProjectConfig.projectName)`` to see available commands.
"@
  }
    
  [string] GenerateBasicExamples([array]$Cmdlets) {
    $examples = @()
    foreach ($cmdlet in $Cmdlets) {
      $examples += @"
## $($cmdlet.Name) Examples

Basic usage:
``````powershell
$($cmdlet.Name)
``````

"@
    }
    return $examples -join "`n"
  }
    
  [void] UpdateMainReadme() {
    # Update main README.md
  }
    
  [void] GenerateIndex([hashtable]$Results) {
    # Generate documentation index
  }
}

# Main execution
try {
  Write-Host "🚀 PowerShell AI Documentation Generator" -ForegroundColor Magenta
  Write-Host "================================================" -ForegroundColor Magenta
    
  $generator = [PowerShellDocumentationGenerator]::new($OutputPath)
  $generator.GenerateDocs()
}
catch {
  Write-Error "Documentation generation failed: $_"
  exit 1
}

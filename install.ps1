#Requires -Version 5.1

<#
.SYNOPSIS
    Serenity Pocket App - PowerShell Installation Script

.DESCRIPTION
    This script automates the installation and setup of the Serenity Pocket App.
    It checks prerequisites, installs dependencies, and sets up the environment.

.EXAMPLE
    irm https://claude.ai/install.ps1 | iex

.NOTES
    Requires: Node.js 18+, npm or pnpm, Git
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = ".\serenity-pocket-app",

    [Parameter(Mandatory=$false)]
    [switch]$SkipDependencies,

    [Parameter(Mandatory=$false)]
    [switch]$StartDev
)

# Set strict mode and error action preference
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Magenta
}

# Check if a command exists
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = (node --version) -replace 'v', ''
        $majorVersion = [int]($nodeVersion.Split('.')[0])

        if ($majorVersion -lt 18) {
            Write-Error "Node.js version $nodeVersion is installed, but version 18 or higher is required."
            return $false
        }

        Write-Success "Node.js version $nodeVersion detected"
        return $true
    }
    catch {
        Write-Error "Failed to check Node.js version: $_"
        return $false
    }
}

# Main installation function
function Install-SerenityApp {
    Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           Serenity Pocket App Installer                  ║
║                                                           ║
║     Trading Psychology & Emotional Intelligence App      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

    # Step 1: Check Prerequisites
    Write-Step "Checking prerequisites..."

    $prerequisitesMet = $true

    # Check Node.js
    if (Test-Command "node") {
        if (-not (Test-NodeVersion)) {
            $prerequisitesMet = $false
        }
    }
    else {
        Write-Error "Node.js is not installed"
        Write-Info "Download from: https://nodejs.org/"
        $prerequisitesMet = $false
    }

    # Check npm or pnpm
    $packageManager = $null
    if (Test-Command "pnpm") {
        $pnpmVersion = pnpm --version
        Write-Success "pnpm version $pnpmVersion detected"
        $packageManager = "pnpm"
    }
    elseif (Test-Command "npm") {
        $npmVersion = npm --version
        Write-Success "npm version $npmVersion detected"
        $packageManager = "npm"
    }
    else {
        Write-Error "Neither npm nor pnpm is installed"
        Write-Info "npm comes with Node.js, or install pnpm: npm install -g pnpm"
        $prerequisitesMet = $false
    }

    # Check Git
    if (Test-Command "git") {
        $gitVersion = git --version
        Write-Success "$gitVersion detected"
    }
    else {
        Write-Warning "Git is not installed (optional, but recommended)"
        Write-Info "Download from: https://git-scm.com/"
    }

    if (-not $prerequisitesMet) {
        Write-Host "`n"
        Write-Error "Prerequisites not met. Please install the required software and try again."
        exit 1
    }

    # Step 2: Clone or use existing directory
    Write-Step "Setting up project directory..."

    $isCloned = $false
    $projectPath = $InstallPath

    # Check if we're already in the project directory
    if (Test-Path ".\package.json") {
        $packageJson = Get-Content ".\package.json" -Raw | ConvertFrom-Json
        if ($packageJson.name -eq "my-v0-project") {
            Write-Info "Already in Serenity Pocket App directory"
            $projectPath = (Get-Location).Path
            $isCloned = $true
        }
    }

    # If not in project and path doesn't exist, clone it
    if (-not $isCloned) {
        if (-not (Test-Path $projectPath)) {
            if (Test-Command "git") {
                Write-Info "Cloning repository to: $projectPath"
                try {
                    git clone https://github.com/shaythegay13/serenity-pocket-app-final.git $projectPath
                    Write-Success "Repository cloned successfully"
                    $isCloned = $true
                }
                catch {
                    Write-Error "Failed to clone repository: $_"
                    Write-Info "You can manually clone from: https://github.com/shaythegay13/serenity-pocket-app-final"
                    exit 1
                }
            }
            else {
                Write-Error "Cannot clone repository without Git"
                Write-Info "Please install Git or download the project manually from:"
                Write-Info "https://github.com/shaythegay13/serenity-pocket-app-final"
                exit 1
            }
        }
        else {
            Write-Info "Directory already exists: $projectPath"
        }

        # Change to project directory
        Set-Location $projectPath
    }

    # Step 3: Install dependencies
    if (-not $SkipDependencies) {
        Write-Step "Installing dependencies..."

        try {
            if ($packageManager -eq "pnpm") {
                Write-Info "Running: pnpm install"
                pnpm install
            }
            else {
                Write-Info "Running: npm install"
                npm install
            }
            Write-Success "Dependencies installed successfully"
        }
        catch {
            Write-Error "Failed to install dependencies: $_"
            exit 1
        }
    }
    else {
        Write-Info "Skipping dependency installation (--SkipDependencies flag set)"
    }

    # Step 4: Setup environment variables
    Write-Step "Setting up environment variables..."

    if (Test-Path ".env.local") {
        Write-Info ".env.local already exists"
        $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($overwrite -eq 'y' -or $overwrite -eq 'Y') {
            Copy-Item "ENV_TEMPLATE.txt" ".env.local" -Force
            Write-Success "Created .env.local from template"
        }
    }
    else {
        if (Test-Path "ENV_TEMPLATE.txt") {
            Copy-Item "ENV_TEMPLATE.txt" ".env.local"
            Write-Success "Created .env.local from template"
        }
        else {
            Write-Warning "ENV_TEMPLATE.txt not found - you'll need to create .env.local manually"
        }
    }

    # Step 5: Display next steps
    Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              Installation Complete! 🎉                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Configure Supabase:" -ForegroundColor White
    Write-Host "   • Create a Supabase project at https://supabase.com" -ForegroundColor Gray
    Write-Host "   • Edit .env.local and add your Supabase URL and API key" -ForegroundColor Gray
    Write-Host "   • Run the database schema from supabase-schema.sql" -ForegroundColor Gray
    Write-Host "   • See DATABASE_SETUP.md for detailed instructions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Start the development server:" -ForegroundColor White
    Write-Host "   $packageManager run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Open your browser:" -ForegroundColor White
    Write-Host "   http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Yellow
    Write-Host "   • DATABASE_SETUP.md   - Database configuration" -ForegroundColor Gray
    Write-Host "   • AUTH_SETUP.md       - Authentication setup" -ForegroundColor Gray
    Write-Host "   • README.md           - General information" -ForegroundColor Gray
    Write-Host ""

    # Step 6: Optionally start dev server
    if ($StartDev) {
        Write-Step "Starting development server..."
        Write-Warning "Press Ctrl+C to stop the server"
        Start-Sleep -Seconds 2

        if ($packageManager -eq "pnpm") {
            pnpm run dev
        }
        else {
            npm run dev
        }
    }
    else {
        Write-Host "Tip: Use the -StartDev flag to automatically start the dev server after installation" -ForegroundColor DarkGray
        Write-Host ""
    }
}

# Run the installation
try {
    Install-SerenityApp
}
catch {
    Write-Host ""
    Write-Error "Installation failed: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    exit 1
}

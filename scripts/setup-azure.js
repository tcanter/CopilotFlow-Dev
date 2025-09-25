// setup-azure.js
// Automated Azure resource setup using .env configuration
// Attribution: Automated by Copilot
//
// Instructions:
// 1. Ensure Azure CLI is installed and you are logged in (`az login`).
/// 2. Ensure your .env file is configured with resource names and paths.
/// 3. Place your function app code in the folder specified by FUNCTION_SOURCE_PATH (default: 'function-app').
///    Required files: host.json, package.json, and your function code.
/// 4. If deploying a Logic App, ensure you have sufficient quota for WorkflowStandard VMs in your Azure region.
///    If you see a quota error, follow the instructions below to request an increase.
/// 5. Run this script: `node scripts/setup-azure.js`
///
/// Quota Increase Instructions:
/// - Go to https://portal.azure.com and search for "Quota" or "Usage + quotas".
/// - Select your subscription and region (e.g., West US 3).
/// - Request an increase for WorkflowStandard VMs for Logic Apps.
/// - Wait for approval, then rerun this script.
///
/// PowerShell Quota Preparation (run in PowerShell before requesting quota):
/// # Log in to your Azure account
/// Connect-AzAccount
/// # Set your subscription (replace with your Subscription ID if needed)
/// # Get-AzSubscription | Out-GridView -PassThru | Set-AzContext
/// # Or set directly:
/// # Set-AzContext -SubscriptionId "your-subscription-id"
/// # Register required resource providers
/// $providers = @(
///     "Microsoft.Compute",
///     "Microsoft.Logic",
///     "Microsoft.Web"
/// )
/// foreach ($provider in $providers) {
///     Register-AzResourceProvider -ProviderNamespace $provider
///     Write-Output "Registered: $provider"
/// }
/// # Confirm registration status
/// foreach ($provider in $providers) {
///     $status = (Get-AzResourceProvider -ProviderNamespace $provider).RegistrationState
///     Write-Output "$provider registration status: $status"
/// }
///
/// For troubleshooting, review the output and follow any warnings or errors.

require('dotenv').config({ override: true });
const { execSync } = require('child_process');
const fs = require('fs');

const storageAccount =
  process.env.STORAGE_ACCOUNT_NAME || 'copilotflowstorageacct';
const resourceGroup = process.env.RESOURCE_GROUP || 'CopilotFlow';
const location = process.env.LOCATION_ID || 'westus3';

function run(cmd, desc) {
  console.log(desc);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error: ${desc}\n${error.message}`);
    process.exit(1);
  }
}

// 1. Create resource group if not exists
try {
  execSync(`az group show --name ${resourceGroup}`, { stdio: 'ignore' });
  console.log('Resource group already exists.');
} catch {
  run(
    `az group create --name ${resourceGroup} --location ${location}`,
    'Creating resource group...'
  );
}

// 2. Create storage account if not exists
try {
  execSync(
    `az storage account show --name ${storageAccount} --resource-group ${resourceGroup}`,
    { stdio: 'ignore' }
  );
  console.log('Storage account already exists.');
} catch {
  run(
    `az storage account create --name ${storageAccount} --resource-group ${resourceGroup} --location ${location} --sku Standard_LRS`,
    'Creating storage account...'
  );
}

// 3. Create Application Insights if not exists
const appInsights = process.env.APPINSIGHTS_NAME || 'copilotflow-agentic-func';
try {
  execSync(
    `az monitor app-insights component show --app ${appInsights} --resource-group ${resourceGroup}`,
    { stdio: 'ignore' }
  );
  console.log('Application Insights already exists.');
} catch {
  run(
    `az monitor app-insights component create --app ${appInsights} --location ${location} --resource-group ${resourceGroup}`,
    'Creating Application Insights...'
  );
}

// 4. Create Function App if not exists
const functionApp = process.env.FUNCTION_APP_NAME || 'copilotflow-agentic-func';
try {
  execSync(
    `az functionapp show --name ${functionApp} --resource-group ${resourceGroup}`,
    { stdio: 'ignore' }
  );
  console.log('Function App already exists.');
} catch {
  run(
    `az functionapp create --resource-group ${resourceGroup} --name ${functionApp} --storage-account ${storageAccount} --consumption-plan-location ${location} --runtime node --functions-version 4`,
    'Creating Function App...'
  );
}

// 5. Build, Package, and Deploy Azure Function code
const functionSource = process.env.FUNCTION_SOURCE_PATH || 'function-app';
const functionZip = process.env.FUNCTION_ZIP_PATH || 'function.zip';
const requiredFiles = ['host.json', 'package.json'];
let functionSourceValid = true;
if (fs.existsSync(functionSource)) {
  for (const file of requiredFiles) {
    if (!fs.existsSync(`${functionSource}/${file}`)) {
      console.error(`Missing required file in function app: ${file}`);
      functionSourceValid = false;
    }
  }
  if (functionSourceValid) {
    const archiver = require('child_process');
    try {
      // Run npm install in the function app folder
      archiver.execSync('npm install', {
        cwd: functionSource,
        stdio: 'inherit',
      });
      // Remove old zip if exists
      if (fs.existsSync(functionZip)) fs.unlinkSync(functionZip);
      // Use PowerShell Compress-Archive for Windows
      archiver.execSync(
        `powershell Compress-Archive -Path ${functionSource}/* -DestinationPath ${functionZip}`
      );
      console.log(
        `Packaged function app code from ${functionSource} to ${functionZip}`
      );
    } catch (zipError) {
      console.error(
        'Failed to build/package function app code:',
        zipError.message
      );
    }
  } else {
    console.warn(
      'Function app source is missing required files. Skipping build/packaging.'
    );
  }
} else {
  console.warn(
    `Function source folder not found at ${functionSource}. Skipping build/packaging.`
  );
}

if (functionSourceValid && fs.existsSync(functionZip)) {
  try {
    run(
      `az functionapp deployment source config-zip --resource-group ${resourceGroup} --name ${functionApp} --src ${functionZip}`,
      'Deploying Azure Function code...'
    );
  } catch (error) {
    console.error('Failed to deploy Azure Function code:', error.message);
  }
} else {
  console.warn(
    'Function zip file not found or source invalid. Skipping function deployment.'
  );
}

// 6. Create Logic App if not exists
const logicApp = process.env.LOGICAPP_NAME || 'copilotflow-agentic-logicapp';
try {
  execSync(
    `az logicapp show --name ${logicApp} --resource-group ${resourceGroup}`,
    { stdio: 'ignore' }
  );
  console.log('Logic App already exists.');
} catch {
  run(
    `az logicapp create --resource-group ${resourceGroup} --name ${logicApp} --storage-account ${storageAccount}`,
    'Creating Logic App...'
  );
}

// 7. Deploy Logic App workflow
const logicAppDef =
  process.env.LOGICAPP_DEF_PATH || 'docs/logic-app-agentic-workflow.json';
try {
  run(
    `az logicapp deployment create --resource-group ${resourceGroup} --name ${logicApp} --definition ${logicAppDef}`,
    'Deploying Logic App workflow...'
  );
} catch (error) {
  console.error('Failed to deploy Logic App workflow:', error.message);
}

console.log('Azure resource setup complete.');

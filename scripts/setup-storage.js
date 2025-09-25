// setup-storage.js
// Script to create Azure Storage Account using .env configuration

require('dotenv').config({ override: true });
const { execSync } = require('child_process');

const storageAccount =
  process.env.STORAGE_ACCOUNT_NAME || 'copilotflowstorageacct';
const resourceGroup = process.env.RESOURCE_GROUP || 'CopilotFlow';
const location = process.env.LOCATION_ID || 'westus3';

console.log(`Checking for existing Azure Storage Account: ${storageAccount}`);

try {
  // Check if storage account exists
  const checkCmd = `az storage account show --name ${storageAccount} --resource-group ${resourceGroup}`;
  execSync(checkCmd, { stdio: 'ignore' });
  console.log('Storage account already exists. Skipping creation.');
} catch (error) {
  // If not found, create the storage account
  console.log('Storage account not found. Creating...');
  try {
    execSync(
      `az storage account create --name ${storageAccount} --resource-group ${resourceGroup} --location ${location} --sku Standard_LRS`,
      { stdio: 'inherit' }
    );
    console.log('Storage account created successfully.');
  } catch (createError) {
    console.error('Failed to create storage account:', createError.message);
    process.exit(1);
  }
}

# Troubleshooting Guide

This guide documents the issues encountered during the development and deployment of the Serverless Coffee Shop Manager and how to resolve them.

## 1. PowerShell Execution Policy Blocking `npm` or `npx`
**Symptom**: When running `npm install`, `npx create-vite`, or `npm run dev` in PowerShell, you receive an error: `...cannot be loaded because running scripts is disabled on this system. UnauthorizedAccess`.

**Resolution**:
By default, Windows PowerShell restricts the execution of scripts (like the `.ps1` wrappers used by npm). You can bypass this by:
1. Running the commands inside **Command Prompt** (`cmd.exe`) instead of PowerShell.
2. Temporarily bypassing the execution policy for your current PowerShell session by running:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

## 2. SAM CLI Installation Issues (`winget` not recognized)
**Symptom**: Running `winget install -e --id Amazon.SAM-CLI` results in `The term 'winget' is not recognized`.

**Resolution**:
If `winget` is not available on your Windows build, you must install the AWS SAM CLI manually via the MSI package.
1. Download the MSI directly from AWS: [AWS SAM CLI 64-bit](https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi).
2. Double-click to install it.
3. **Crucial Step**: You *must* completely close and restart VS Code (or your terminal) so it registers the new `PATH` variables.

## 3. IDE Linter Error: `Cannot find module 'utils'` in `app.py`
**Symptom**: Your IDE (like VS Code with Pyrefly/Pylance) flags an error in `app.py` stating it cannot find the module `utils`.

**Resolution**:
This is a **ghost error**. I originally wrote the backend in Python (`app.py`), but because Python was not installed on my system, I deleted those files and rewrote the backend entirely in Node.js (`app.js`). 
- **Fix**: Simply close the `app.py` tabs in the VS Code editor. The files have already been deleted from disk, but the editor is keeping them loaded in memory and linting them.

## 4. `sam build` Fails (Missing Docker or Python)
**Symptom**: Running `sam build` fails with `Path resolution for runtime: python3.12 of binary: python was not successful` or `Running AWS SAM projects locally requires a container runtime.`

**Resolution**:
AWS SAM needs the native language installed locally to build the packages, or it requires Docker to build them in a container.
- If I lack Python and Docker, the easiest resolution (which I implemented) is to change the `Runtime` in `template.yaml` to match a language I *do* have natively installed (like `nodejs20.x`) and rewrite the functions in that language.

## 5. Access blocked by CORS Policy (Preflight/OPTIONS failing)
**Symptom**: When trying to Save, Update, or Delete items, the UI does nothing and the browser console shows an error:
`Access to fetch at '...' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present...`

**Resolution**:
Before a browser makes a `POST`, `PUT`, or `DELETE` request across different domains, it sends an `OPTIONS` "preflight" request. If the API Gateway doesn't respond to `OPTIONS` with CORS headers, the browser blocks the actual request.
- **Fix**: I configured a global `Api.Cors` block inside `template.yaml` under `Globals` to handle all OPTIONS requests automatically at the API Gateway level:
  ```yaml
  Globals:
    Api:
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
  ```
  After saving the template, rebuild and redeploy the backend stack:
  ```cmd
  sam build
  sam deploy
  ```

## 6. AWS Amplify Monorepo Deployment Returns "404 Not Found"
**Symptom**: When connecting your GitHub repository to AWS Amplify, the console fails during configuration or build with a REST API error:
`HttpError: Not Found - https://docs.github.com/rest/repos/contents#get-repository-content` or fails to locate `package.json`.

**Resolution**:
This happens because your local project folder (`performance efficiency/`) acts as the direct root of your GitHub repository. On GitHub, there is no `performance efficiency/` subfolder; the `frontend` folder sits directly at the root.
- **Fix**: In the AWS Amplify monorepo configuration screen, change the **Monorepo folder path** to simply **`frontend`** (instead of `performance efficiency/frontend`).

## 7. `sam delete` Blocked by Non-Empty S3 Bucket (`aws-sam-cli-managed-default`)
**Symptom**: When trying to delete the helper stack `aws-sam-cli-managed-default` to clean up your AWS account completely, the operation fails or states the stack cannot be deleted.

**Resolution**:
AWS protects your data by blocking the deletion of any S3 buckets that still contain files (like your uploaded Lambda zip deployments).
- **Fix**: 
  1. Open the **Amazon S3 Console** in your browser.
  2. Click on the bucket starting with `aws-sam-cli-managed-default-samclisourcebucket-...`.
  3. Click **Empty**, type `permanently delete`, and confirm.
  4. Once the bucket is empty, you can run the delete command safely:
     ```cmd
     sam delete --stack-name aws-sam-cli-managed-default
     ```

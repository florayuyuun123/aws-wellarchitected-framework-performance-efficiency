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
This is a **ghost error**. We originally wrote the backend in Python (`app.py`), but because Python was not installed on your system, we deleted those files and rewrote the backend entirely in Node.js (`app.js`). 
- **Fix**: Simply close the `app.py` tabs in your VS Code editor. The files have already been deleted from your disk, but the editor is keeping them loaded in memory and linting them.

## 4. `sam build` Fails (Missing Docker or Python)
**Symptom**: Running `sam build` fails with `Path resolution for runtime: python3.12 of binary: python was not successful` or `Running AWS SAM projects locally requires a container runtime.`

**Resolution**:
AWS SAM needs the native language installed locally to build the packages, or it requires Docker to build them in a container.
- If you lack Python and Docker, the easiest resolution (which we implemented) is to change the `Runtime` in `template.yaml` to match a language you *do* have natively installed (like `nodejs20.x`) and rewrite the functions in that language.

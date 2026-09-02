const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const webDistDir = path.resolve(rootDir, 'apps/web/dist');
const serverDistDir = path.resolve(rootDir, 'apps/server/dist');
const serverDir = path.resolve(rootDir, 'apps/server');

const outputFrontendZip = path.resolve(rootDir, 'frontend_change_build.zip');
const outputBackendZip = path.resolve(rootDir, 'backend_change_build.zip');

function zipDirectory(sourceDir, zipPath, includeDotFiles = true) {
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const isWin = process.platform === 'win32';

  if (isWin) {
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  } else {
    // macOS / Linux native zip
    // In zip on Unix, 'zip -r file.zip .' inside sourceDir includes hidden files like .htaccess
    const cmd = `cd "${sourceDir}" && zip -r -q "${zipPath}" . -x "*.DS_Store"`;
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  }
}

function zipFiles(sourceDir, files, zipPath) {
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const isWin = process.platform === 'win32';

  if (isWin) {
    const paths = files.map(f => `'${path.resolve(sourceDir, f)}'`).join(', ');
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path ${paths} -DestinationPath '${zipPath}' -Force"`;
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  } else {
    const filesList = files.map(f => `"${f}"`).join(' ');
    const cmd = `cd "${sourceDir}" && zip -q "${zipPath}" ${filesList} -x "*.DS_Store"`;
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  }
}

console.log('====================================================');
console.log('🚀 Generating Clean cPanel Builds for EduForge');
console.log('====================================================\n');

// 1. Compile Shared package
console.log('=== [1/4] Building @eduforge/shared Types & Models ===');
execSync('npm run build --workspace=packages/shared', { cwd: rootDir, stdio: 'inherit' });

// 2. Compile Web Frontend
console.log('\n=== [2/4] Building @eduforge/web Production SPA Bundle ===');
execSync('npm run build --workspace=apps/web', { cwd: rootDir, stdio: 'inherit' });

// Ensure .htaccess is in web dist
const publicHtaccess = path.resolve(rootDir, 'apps/web/public/.htaccess');
const distHtaccess = path.resolve(webDistDir, '.htaccess');
if (fs.existsSync(publicHtaccess) && !fs.existsSync(distHtaccess)) {
  fs.copyFileSync(publicHtaccess, distHtaccess);
}

// 3. Bundle Server into Standalone JS
console.log('\n=== [3/4] Bundling @eduforge/server Standalone API Bundle ===');
if (!fs.existsSync(serverDistDir)) {
  fs.mkdirSync(serverDistDir, { recursive: true });
}

execSync(
  'npx -y esbuild apps/server/src/server.ts --bundle --platform=node --target=node18 --outfile=apps/server/dist/server.js',
  { cwd: rootDir, stdio: 'inherit' }
);

// Production package.json for backend
const prodPkg = {
  name: "eduforge-api",
  version: "1.0.0",
  private: true,
  main: "server.js",
  scripts: {
    start: "node server.js"
  }
};
fs.writeFileSync(path.resolve(serverDistDir, 'package.json'), JSON.stringify(prodPkg, null, 2));

// Production .env for backend
const rootEnvPath = path.resolve(rootDir, '.env');
const serverEnvPath = path.resolve(serverDir, '.env');
let envSource = fs.existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath;

if (fs.existsSync(envSource)) {
  let envContent = fs.readFileSync(envSource, 'utf8');
  envContent = envContent.replace(/^PORT=.*$/m, '# PORT is dynamically assigned by cPanel Phusion Passenger');
  fs.writeFileSync(path.resolve(serverDistDir, '.env'), envContent);
}

// Ensure no .htaccess in server dist
const serverHtaccess = path.resolve(serverDistDir, '.htaccess');
if (fs.existsSync(serverHtaccess)) {
  fs.unlinkSync(serverHtaccess);
}

// 4. Create ZIP Archives
console.log('\n=== [4/4] Creating cPanel Deployment Zip Archives ===');

// Compress Frontend
zipDirectory(webDistDir, outputFrontendZip);
const frontendSizeMb = (fs.statSync(outputFrontendZip).size / (1024 * 1024)).toFixed(2);
console.log(`✓ frontend_change_build.zip generated successfully (${frontendSizeMb} MB)`);

// Compress Backend
zipFiles(serverDistDir, ['server.js', 'package.json', '.env'], outputBackendZip);
const backendSizeMb = (fs.statSync(outputBackendZip).size / (1024 * 1024)).toFixed(2);
console.log(`✓ backend_change_build.zip generated successfully (${backendSizeMb} MB)`);

console.log('\n====================================================');
console.log('✅ CPANEL PRODUCTION BUILDS GENERATED SUCCESSFULLY!');
console.log('====================================================');
console.log(`1. Frontend ZIP: ${outputFrontendZip} (${frontendSizeMb} MB)`);
console.log(`2. Backend ZIP:  ${outputBackendZip} (${backendSizeMb} MB)`);
console.log('====================================================\n');

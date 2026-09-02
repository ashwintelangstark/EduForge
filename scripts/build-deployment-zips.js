const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const webDistDir = path.resolve(rootDir, 'apps/web/dist');
const serverDistDir = path.resolve(rootDir, 'apps/server/dist');
const serverDir = path.resolve(rootDir, 'apps/server');
const outputFrontendZip = path.resolve(rootDir, 'frontend_build.zip');
const outputBackendZip = path.resolve(rootDir, 'backend_build.zip');

console.log('=== 1. Building Shared AST & Types ===');
execSync('npm run build --workspace=packages/shared', { cwd: rootDir, stdio: 'inherit' });

console.log('\n=== 2. Building Frontend (Vite Production Bundle) ===');
execSync('npm run build --workspace=apps/web', { cwd: rootDir, stdio: 'inherit' });

console.log('\n=== 3. Bundling Backend (Node.js Express Standalone Bundle) ===');
if (!fs.existsSync(serverDistDir)) {
  fs.mkdirSync(serverDistDir, { recursive: true });
}
execSync('npx -y esbuild apps/server/src/server.ts --bundle --platform=node --target=node18 --outfile=apps/server/dist/server.js', { cwd: rootDir, stdio: 'inherit' });

// Create a clean production package.json in server dist
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

// Prepare clean production .env for server dist without hardcoded PORT
const serverEnvPath = path.resolve(serverDir, '.env');
if (fs.existsSync(serverEnvPath)) {
  let envContent = fs.readFileSync(serverEnvPath, 'utf8');
  envContent = envContent.replace(/^PORT=.*$/m, '# PORT is dynamically assigned by cPanel Phusion Passenger');
  fs.writeFileSync(path.resolve(serverDistDir, '.env'), envContent);
}

console.log('\n=== 4. Creating frontend_build.zip ===');
if (fs.existsSync(outputFrontendZip)) {
  fs.unlinkSync(outputFrontendZip);
}
// Compress webDistDir contents directly into frontend_build.zip
const psFrontendCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${webDistDir}\\*' -DestinationPath '${outputFrontendZip}' -Force"`;
execSync(psFrontendCmd, { cwd: rootDir, stdio: 'inherit' });
console.log(`✓ frontend_build.zip created: ${(fs.statSync(outputFrontendZip).size / (1024 * 1024)).toFixed(2)} MB`);

console.log('\n=== 5. Creating backend_build.zip ===');
if (fs.existsSync(outputBackendZip)) {
  fs.unlinkSync(outputBackendZip);
}
// Remove any accidental .htaccess so cPanel Passenger controls its own routing
const serverHtaccess = path.resolve(serverDistDir, '.htaccess');
if (fs.existsSync(serverHtaccess)) {
  fs.unlinkSync(serverHtaccess);
}
// Compress ONLY server.js, package.json, and .env into backend_build.zip
const psBackendCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${serverDistDir}\\server.js', '${serverDistDir}\\package.json', '${serverDistDir}\\.env' -DestinationPath '${outputBackendZip}' -Force"`;
execSync(psBackendCmd, { cwd: rootDir, stdio: 'inherit' });
console.log(`✓ backend_build.zip created: ${(fs.statSync(outputBackendZip).size / (1024 * 1024)).toFixed(2)} MB`);

console.log('\n=========================================');
console.log('🎉 BOTH ZIP FILES SUCCESSFULLY CREATED!');
console.log(`1. Frontend: ${outputFrontendZip}`);
console.log(`2. Backend:  ${outputBackendZip}`);
console.log('=========================================');

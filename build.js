/**
 * CinMax Build Script
 * Creates executable installer for Windows
 */

const builder = require('electron-builder');
const path = require('path');

const config = {
    appId: 'com.cinmax.store.tracker',
    productName: 'CinMax Store Copy Tracker',
    copyright: 'Copyright © 2025 CinMax',
    
    directories: {
        output: 'dist',
        buildResources: 'build'
    },
    
    files: [
        '**/*',
        '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
        '!**/node_modules/*.d.ts',
        '!**/node_modules/.bin',
        '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
        '!.editorconfig',
        '!**/._*',
        '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
        '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
        '!**/{appveyor.yml,.travis.yml,circle.yml}',
        '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
    ],
    
    win: {
        target: [
            {
                target: 'nsis',
                arch: ['x64']
            }
        ],
        icon: 'src/assets/icons/icon.ico',
        artifactName: '${productName}-Setup-${version}.${ext}'
    },
    
    nsis: {
        oneClick: true,
        perMachine: false,
        allowToChangeInstallationDirectory: false,
        deleteAppDataOnUninstall: false,
        installerIcon: 'src/assets/icons/icon.ico',
        uninstallerIcon: 'src/assets/icons/icon.ico',
        installerHeaderIcon: 'src/assets/icons/icon.ico',
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'CinMax Store',
        include: 'build/installer.nsh',
        warningsAsErrors: false,
        
        // Arabic installer
        language: 1025
    },
    
    publish: null
};

async function build() {
    console.log('🚀 Starting CinMax Build Process...\n');
    
    try {
        const result = await builder.build({
            config: config,
            win: ['nsis']
        });
        
        console.log('\n✅ Build completed successfully!');
        console.log('📦 Output files:');
        result.forEach(file => {
            console.log(`   - ${file}`);
        });
        
    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run build
build();
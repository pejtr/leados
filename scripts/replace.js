const fs = require('fs');
const glob = require('glob'); // we don't have glob maybe, so I'll just hardcode or read recursive

function replaceInFile(path, pattern, replacement) {
    let content = fs.readFileSync(path, 'utf8');
    if (content.match(pattern)) {
        content = content.replace(pattern, replacement);
        fs.writeFileSync(path, content);
        console.log('Updated ' + path);
    }
}

['cs', 'en', 'de'].forEach(lang => {
    replaceInFile(`client/src/i18n/${lang}.json`, /ONYX OS/g, 'ONYX OS');
    replaceInFile(`client/src/i18n/${lang}.json`, /OptiHub/g, 'ONYX OS');
});

// find other places
const otherFiles = [
    'server/dailyReportScheduler.ts',
    'server/externalApi.ts',
    'server/heraAgent.ts',
    'server/hermesAgent.ts',
    'server/hermesDigest.ts',
    'server/hermesRouter.ts',
    'server/ingestRoute.ts',
    'server/promptSecurity.test.ts',
    'server/promptSecurity.ts',
    'server/radarAgent.ts',
    'server/routers/aiSkills.ts',
    'server/routers/benchmark.ts',
    'server/routers/globalEarnings.ts',
    'server/routers/roiAudit.ts',
    'server/routers/webAuditRouter.ts',
    'server/stripeProducts.ts',
    'server/telegram/cml.ts',
    'server/webhookDispatcherV2.ts',
    'client/src/pages/SocialListening.tsx',
    'client/src/pages/Sluzby.tsx'
];

otherFiles.forEach(f => {
    if (fs.existsSync(f)) {
        replaceInFile(f, /ONYX OS/g, 'ONYX OS');
        replaceInFile(f, /OptiHub/g, 'ONYX OS');
    }
});

console.log('Done.');

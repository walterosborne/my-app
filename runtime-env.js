import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const stripBom = (value) => (
    value.charCodeAt(0) === 0xfeff ? value.slice(1) : value
);

const unescapeDoubleQuotedValue = (value) => (
    value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
);

const parseQuotedValue = (input, quoteChar) => {
    let escaped = false;
    let value = '';

    for (let index = 1; index < input.length; index += 1) {
        const char = input[index];

        if (quoteChar === '"' && escaped) {
            value += `\\${char}`;
            escaped = false;
            continue;
        }

        if (quoteChar === '"' && char === '\\') {
            escaped = true;
            continue;
        }

        if (char === quoteChar) {
            return {
                value: quoteChar === '"' ? unescapeDoubleQuotedValue(value) : value,
                remainder: input.slice(index + 1).trim()
            };
        }

        value += char;
    }

    return {
        value: quoteChar === '"' ? unescapeDoubleQuotedValue(input.slice(1)) : input.slice(1),
        remainder: ''
    };
};

const parseEnvLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        return null;
    }

    const normalized = trimmed.startsWith('export ')
        ? trimmed.slice('export '.length).trim()
        : trimmed;

    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex === -1) {
        return null;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        return null;
    }

    const rawValue = normalized.slice(separatorIndex + 1).trim();
    if (!rawValue) {
        return [key, ''];
    }

    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
        const { value } = parseQuotedValue(rawValue, rawValue[0]);
        return [key, value];
    }

    return [key, rawValue.replace(/\s+#.*$/, '').trim()];
};

const parseEnvFile = (filePath) => {
    const contents = stripBom(fs.readFileSync(filePath, 'utf8'));
    const parsedEntries = [];

    for (const line of contents.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);
        if (parsed) {
            parsedEntries.push(parsed);
        }
    }

    return parsedEntries;
};

export const getAppRootFromImportMetaUrl = (importMetaUrl) => (
    path.dirname(fileURLToPath(importMetaUrl))
);

export const loadRuntimeEnv = ({
    appRoot,
    mode = 'development',
    overrideProcessEnv = true
}) => {
    if (!appRoot) {
        throw new Error('loadRuntimeEnv requires an appRoot.');
    }

    const effectiveMode = String(mode || 'development').trim() || 'development';
    const candidateFiles = [
        '.env',
        '.env.local',
        `.env.${effectiveMode}`,
        `.env.${effectiveMode}.local`
    ];

    const loadedFiles = [];

    for (const candidate of candidateFiles) {
        const filePath = path.join(appRoot, candidate);
        if (!fs.existsSync(filePath)) {
            continue;
        }

        for (const [key, value] of parseEnvFile(filePath)) {
            if (overrideProcessEnv || process.env[key] === undefined) {
                process.env[key] = value;
            }
        }

        loadedFiles.push(candidate);
    }

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = effectiveMode;
    }

    return {
        mode: effectiveMode,
        loadedFiles
    };
};

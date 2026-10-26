import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const apiRoot = join(root, 'app/api/v1');
const specPath = join(root, 'docs/openapi.yaml');
const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
const methodNames = httpMethods.map((method) => method.toUpperCase());
const errors = [];

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function toSpecPath(file) {
  const route = relative(apiRoot, file)
    .split(sep)
    .join('/')
    .replace(/\/route\.ts$/, '');

  return `/api/v1${route ? `/${route}` : ''}`.replace(/\[([^\]]+)\]/g, '{$1}');
}

function toRouteFile(specPath) {
  const route = specPath.replace(/^\/api\/v1\/?/, '').replace(/\{([^}]+)\}/g, '[$1]');

  return join(apiRoot, route, 'route.ts');
}

function exportedMethods(file) {
  const source = readFileSync(file, 'utf8');
  const methods = new Set();

  for (const method of methodNames) {
    const pattern = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\b|export\\s+const\\s+${method}\\s*=`,
      'm'
    );

    if (pattern.test(source)) {
      methods.add(method.toLowerCase());
    }
  }

  return methods;
}

function resolveRef(ref) {
  if (!ref.startsWith('#/')) {
    return null;
  }

  return ref
    .slice(2)
    .split('/')
    .reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), spec);
}

function validateRefs(value, location = 'spec') {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (typeof value.$ref === 'string' && !resolveRef(value.$ref)) {
    fail(`${location}: $ref tidak dapat di-resolve: ${value.$ref}`);
  }

  for (const [key, child] of Object.entries(value)) {
    validateRefs(child, `${location}.${key}`);
  }
}

function validatePathParameters(path, operation, location) {
  const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  const parameters = (operation.parameters ?? [])
    .map((parameter) => (parameter.$ref ? resolveRef(parameter.$ref) : parameter))
    .filter(Boolean);

  for (const placeholder of placeholders) {
    const parameter = parameters.find(
      (candidate) => candidate.in === 'path' && candidate.name === placeholder
    );

    if (!parameter) {
      fail(`${location}: parameter path {${placeholder}} tidak dideklarasikan`);
      continue;
    }

    if (parameter.required !== true) {
      fail(`${location}: parameter path {${placeholder}} harus required: true`);
    }
  }

  for (const parameter of parameters) {
    if (parameter.in === 'path' && !placeholders.includes(parameter.name)) {
      fail(`${location}: parameter path ${parameter.name} tidak ada di template`);
    }
  }
}

let spec;

try {
  spec = parse(readFileSync(specPath, 'utf8'));
} catch (error) {
  console.error(`openapi:check gagal membaca ${specPath}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (!spec || typeof spec !== 'object' || !spec.paths) {
  console.error('openapi:check: dokumen OpenAPI tidak memiliki paths.');
  process.exit(1);
}

const routeFiles = walk(apiRoot).filter((file) => file.endsWith(`${sep}route.ts`));
const routePaths = new Map();

for (const file of routeFiles) {
  routePaths.set(toSpecPath(file), exportedMethods(file));
}

for (const [specPathKey, methods] of routePaths) {
  const pathItem = spec.paths[specPathKey];

  if (!pathItem) {
    fail(`route ${specPathKey} tidak terdokumentasi di OpenAPI`);
    continue;
  }

  for (const method of methods) {
    if (!pathItem[method]) {
      fail(`method ${method.toUpperCase()} ${specPathKey} tidak terdokumentasi`);
    }
  }
}

for (const [specPathKey, pathItem] of Object.entries(spec.paths)) {
  if (!specPathKey.startsWith('/api/v1')) {
    continue;
  }

  const routeFile = toRouteFile(specPathKey);

  if (!routePaths.has(specPathKey)) {
    fail(`path OpenAPI ${specPathKey} tidak memiliki file route (${relative(root, routeFile)})`);
    continue;
  }

  const methods = routePaths.get(specPathKey);

  for (const method of httpMethods) {
    if (!pathItem[method]) {
      continue;
    }

    if (!methods.has(method)) {
      fail(`method ${method.toUpperCase()} ${specPathKey} tidak diekspor oleh route`);
    }

    const operation = pathItem[method];

    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      fail(`${method.toUpperCase()} ${specPathKey} tidak memiliki responses`);
    }

    validatePathParameters(specPathKey, operation, `${method.toUpperCase()} ${specPathKey}`);
  }
}

validateRefs(spec);

if (errors.length > 0) {
  console.error(`openapi:check menemukan ${errors.length} masalah:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `openapi:check OK — ${Object.keys(spec.paths).length} path, ${routeFiles.length} route file.`
);

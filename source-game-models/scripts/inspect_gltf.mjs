#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const DEFAULT_MAX_TRIANGLES = 250_000;
const DEFAULT_MAX_FILE_BYTES = 50 * 1024 * 1024;

function usage() {
  return `Usage: node inspect_gltf.mjs <model.gltf|model.glb> [options]

Options:
  --json                   Print JSON instead of a human-readable report
  --max-triangles <count>  Warn above this triangle count (default: 250000)
  --max-file-mb <mb>       Warn above this model file size (default: 50)
  --help                   Show this help`;
}

function parsePositiveNumber(value, option) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${option} requires a positive number`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = {
    file: null,
    json: false,
    maxTriangles: DEFAULT_MAX_TRIANGLES,
    maxFileBytes: DEFAULT_MAX_FILE_BYTES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--max-triangles") {
      options.maxTriangles = parsePositiveNumber(argv[++index], arg);
    } else if (arg === "--max-file-mb") {
      options.maxFileBytes = parsePositiveNumber(argv[++index], arg) * 1024 * 1024;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (options.file) {
      throw new Error(`Unexpected argument: ${arg}`);
    } else {
      options.file = arg;
    }
  }

  if (!options.help && !options.file) {
    throw new Error("A .gltf or .glb file is required");
  }
  return options;
}

function readGlbJson(buffer) {
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error("Invalid GLB header");
  }
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }
  if (declaredLength !== buffer.length) {
    throw new Error(`GLB length mismatch: header=${declaredLength}, file=${buffer.length}`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > buffer.length) {
      throw new Error("GLB chunk extends beyond the file");
    }
    if (chunkType === JSON_CHUNK) {
      const jsonText = buffer
        .subarray(chunkStart, chunkEnd)
        .toString("utf8")
        .replace(/[\u0000\u0020]+$/u, "");
      return JSON.parse(jsonText);
    }
    offset = chunkEnd;
  }
  throw new Error("GLB does not contain a JSON chunk");
}

function loadDocument(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  if (extension === ".glb") {
    return { document: readGlbJson(buffer), format: "GLB", fileBytes: buffer.length };
  }
  if (extension === ".gltf") {
    return {
      document: JSON.parse(buffer.toString("utf8")),
      format: "glTF",
      fileBytes: buffer.length,
    };
  }
  throw new Error(`Unsupported file extension: ${extension || "(none)"}`);
}

function accessorCount(document, index) {
  if (!Number.isInteger(index)) return null;
  const count = document.accessors?.[index]?.count;
  return Number.isFinite(count) ? count : null;
}

function primitiveElementCount(document, primitive) {
  const indexed = accessorCount(document, primitive.indices);
  if (indexed !== null) return indexed;
  return accessorCount(document, primitive.attributes?.POSITION);
}

function triangleCountForPrimitive(document, primitive) {
  const count = primitiveElementCount(document, primitive);
  if (count === null) return null;
  const mode = primitive.mode ?? 4;
  if (mode === 4) return Math.floor(count / 3);
  if (mode === 5 || mode === 6) return Math.max(0, count - 2);
  return 0;
}

function inspectExternalResources(document, baseDir) {
  const resources = [];
  const addResource = (kind, uri) => {
    if (typeof uri !== "string") return;
    if (uri.startsWith("data:")) {
      resources.push({ kind, uri: "data URI", embedded: true, exists: true });
      return;
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(uri)) {
      resources.push({ kind, uri, remote: true, exists: null });
      return;
    }

    let decodedUri;
    try {
      decodedUri = decodeURIComponent(uri.split(/[?#]/u, 1)[0]);
    } catch {
      resources.push({ kind, uri, exists: false, error: "invalid URI encoding" });
      return;
    }
    const resolved = path.resolve(baseDir, decodedUri.replaceAll("/", path.sep));
    let stat = null;
    try {
      stat = fs.statSync(resolved);
    } catch {
      // Missing external files are reported below.
    }
    resources.push({
      kind,
      uri,
      resolved,
      exists: Boolean(stat?.isFile()),
      bytes: stat?.isFile() ? stat.size : null,
    });
  };

  for (const buffer of document.buffers ?? []) addResource("buffer", buffer.uri);
  for (const image of document.images ?? []) addResource("image", image.uri);
  return resources;
}

function inspect(filePath, limits) {
  const absolutePath = path.resolve(filePath);
  const { document, format, fileBytes } = loadDocument(absolutePath);
  const warnings = [];
  let primitives = 0;
  let triangles = 0;
  let unknownTrianglePrimitives = 0;

  for (const mesh of document.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      primitives += 1;
      const count = triangleCountForPrimitive(document, primitive);
      if (count === null) unknownTrianglePrimitives += 1;
      else triangles += count;
    }
  }

  const externalResources = inspectExternalResources(document, path.dirname(absolutePath));
  const missingResources = externalResources.filter((resource) => resource.exists === false);
  const remoteResources = externalResources.filter((resource) => resource.remote);
  const extensionsUsed = document.extensionsUsed ?? [];
  const extensionsRequired = document.extensionsRequired ?? [];

  if (document.asset?.version !== "2.0") {
    warnings.push(`Expected glTF asset version 2.0, found ${document.asset?.version ?? "missing"}`);
  }
  if (!(document.meshes?.length > 0)) warnings.push("No meshes found");
  if (unknownTrianglePrimitives > 0) {
    warnings.push(`Could not estimate triangles for ${unknownTrianglePrimitives} primitive(s)`);
  }
  if (triangles > limits.maxTriangles) {
    warnings.push(`Estimated triangles ${triangles} exceed limit ${limits.maxTriangles}`);
  }
  if (fileBytes > limits.maxFileBytes) {
    warnings.push(
      `Model file size ${formatBytes(fileBytes)} exceeds limit ${formatBytes(limits.maxFileBytes)}`,
    );
  }
  if (missingResources.length > 0) {
    warnings.push(`${missingResources.length} external resource(s) are missing`);
  }
  if (remoteResources.length > 0) {
    warnings.push(`${remoteResources.length} resource(s) use remote URLs`);
  }
  if (extensionsRequired.length > 0) {
    warnings.push(`Runtime decoder/support required: ${extensionsRequired.join(", ")}`);
  }

  return {
    file: absolutePath,
    format,
    assetVersion: document.asset?.version ?? null,
    generator: document.asset?.generator ?? null,
    fileBytes,
    counts: {
      scenes: document.scenes?.length ?? 0,
      nodes: document.nodes?.length ?? 0,
      meshes: document.meshes?.length ?? 0,
      primitives,
      triangles,
      unknownTrianglePrimitives,
      materials: document.materials?.length ?? 0,
      textures: document.textures?.length ?? 0,
      images: document.images?.length ?? 0,
      skins: document.skins?.length ?? 0,
      joints: (document.skins ?? []).reduce((sum, skin) => sum + (skin.joints?.length ?? 0), 0),
      animations: document.animations?.length ?? 0,
      animationChannels: (document.animations ?? []).reduce(
        (sum, animation) => sum + (animation.channels?.length ?? 0),
        0,
      ),
      cameras: document.cameras?.length ?? 0,
    },
    extensionsUsed,
    extensionsRequired,
    externalResources,
    warnings,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatReport(report) {
  const lines = [
    `File: ${report.file}`,
    `Format: ${report.format} (asset ${report.assetVersion ?? "unknown"})`,
    `Size: ${formatBytes(report.fileBytes)}`,
    `Geometry: ${report.counts.meshes} mesh(es), ${report.counts.primitives} primitive(s), ${report.counts.triangles} estimated triangle(s)`,
    `Surface: ${report.counts.materials} material(s), ${report.counts.textures} texture(s), ${report.counts.images} image(s)`,
    `Animation: ${report.counts.skins} skin(s), ${report.counts.joints} joint reference(s), ${report.counts.animations} animation(s), ${report.counts.animationChannels} channel(s)`,
    `Scene: ${report.counts.scenes} scene(s), ${report.counts.nodes} node(s), ${report.counts.cameras} camera(s)`,
    `Extensions used: ${report.extensionsUsed.join(", ") || "none"}`,
    `Extensions required: ${report.extensionsRequired.join(", ") || "none"}`,
  ];

  if (report.externalResources.length > 0) {
    lines.push("External resources:");
    for (const resource of report.externalResources) {
      const state = resource.embedded
        ? "embedded"
        : resource.remote
          ? "remote"
          : resource.exists
            ? `${formatBytes(resource.bytes)}`
            : "MISSING";
      lines.push(`  - [${resource.kind}] ${resource.uri}: ${state}`);
    }
  } else {
    lines.push("External resources: none");
  }

  if (report.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of report.warnings) lines.push(`  - ${warning}`);
  } else {
    lines.push("Warnings: none");
  }
  return lines.join("\n");
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = inspect(options.file, options);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatReport(report));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}

export { inspect, readGlbJson, triangleCountForPrimitive };

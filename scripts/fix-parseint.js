#!/usr/bin/env node
/**
 * fix-parseint.js
 * ─────────────────────────────────────────────────────────────
 * Corrige automatiquement tous les parseInt() et parseFloat()
 * non préfixés par "Number." dans tout le code source.
 *
 * Usage : node scripts/fix-parseint.js
 * ─────────────────────────────────────────────────────────────
 */
'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const SRC_DIR    = path.join(__dirname, '../src');
const EXTENSIONS = ['.js'];
let   totalFixed = 0;
let   filesFixed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(full);
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remplace parseInt( non précédé de "Number."
  // Le lookahead négatif (?<!Number\.) n'est pas supporté en JS regex basique
  // On utilise une approche conservative : remplace \bparseInt\( sauf si précédé de "."
  content = content.replace(/([^.A-Za-z_$])parseInt\(/g, '$1Number.parseInt(');
  content = content.replace(/([^.A-Za-z_$])parseFloat\(/g, '$1Number.parseFloat(');

  // Cas en début de ligne ou après un opérateur
  content = content.replace(/^parseInt\(/gm, 'Number.parseInt(');
  content = content.replace(/^parseFloat\(/gm, 'Number.parseFloat(');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = path.relative(process.cwd(), filePath);
    const count = (original.match(/[^.]parseInt\(|^parseInt\(/gm) || []).length
                + (original.match(/[^.]parseFloat\(|^parseFloat\(/gm) || []).length;
    console.log(`✓ ${rel} (${count} occurrence(s))`);
    totalFixed += count;
    filesFixed++;
  }
}

console.log('Correction Number.parseInt / Number.parseFloat...\n');
walk(SRC_DIR);
console.log(`\n✅ ${totalFixed} occurrence(s) corrigée(s) dans ${filesFixed} fichier(s)`);
console.log('Vérification syntaxe...');

// Vérification syntaxe rapide sur les fichiers modifiés
const { execSync } = require('node:child_process');
try {
  execSync(`find ${SRC_DIR} -name "*.js" | xargs node --check`, { stdio: 'pipe' });
  console.log('✅ Tous les fichiers sont syntaxiquement valides');
} catch (e) {
  console.error('⚠ Erreur de syntaxe détectée :', e.stderr?.toString());
}
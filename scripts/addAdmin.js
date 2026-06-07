#!/usr/bin/env node
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, answer => { rl.close(); resolve(answer); });
      return;
    }

    // hidden input for password
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(question + Array(rl.line.length + 1).join('*'));
          break;
      }
    });

    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

async function main() {
  try {
    // lightweight arg parsing (no extra deps)
    const rawArgs = process.argv.slice(2);
    const argv = {};
    rawArgs.forEach(a => {
      if (a.startsWith('--')) {
        const [k, v] = a.slice(2).split('=');
        argv[k] = v === undefined ? true : v;
      } else if (a.startsWith('-')) {
        const key = a.slice(1);
        const next = rawArgs[rawArgs.indexOf(a) + 1];
        if (next && !next.startsWith('-')) argv[key] = next;
      }
    });

    let username = argv.username || argv.u;
    let password = argv.password || argv.p;

    if (!username) username = (await ask('Enter new admin username: ')).trim();
    if (!password) password = (await ask('Enter password (input hidden): ', true)).trim();

    if (!username || !password) {
      console.error('Username and password are required.');
      process.exit(1);
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Check if username exists
    const [existing] = await pool.query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) {
      console.error(`User '${username}' already exists. Aborting.`);
      process.exit(1);
    }

    const [result] = await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
    console.log(`Admin user created with id ${result.insertId} and username '${username}'.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err.message || err);
    process.exit(1);
  }
}

main();

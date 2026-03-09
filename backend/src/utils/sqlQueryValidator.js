function removeComments(query) {
  let cleaned = query.replace(/--.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  return cleaned;
}

function removeStringLiterals(query) {
  return query.replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

function extractAllTableReferences(query) {
  const tables = new Set();

  const fromJoinRegex = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi;
  let match;
  while ((match = fromJoinRegex.exec(query)) !== null) {
    const tableName = match[1].split('.').pop().toLowerCase();
    tables.add(tableName);
  }

  const fromClauseRegex = /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_.]*(?:\s+(?:AS\s+)?[a-zA-Z_][a-zA-Z0-9_]*)?\s*(?:,\s*([a-zA-Z_][a-zA-Z0-9_.]*(?:\s+(?:AS\s+)?[a-zA-Z_][a-zA-Z0-9_]*)?))*)/gi;
  while ((match = fromClauseRegex.exec(query)) !== null) {
    const fullFromClause = match[0];
    const commaTableRegex = /,\s*([a-zA-Z_][a-zA-Z0-9_.]*)/gi;
    let commaMatch;
    while ((commaMatch = commaTableRegex.exec(fullFromClause)) !== null) {
      const tableName = commaMatch[1].split('.').pop().toLowerCase();
      tables.add(tableName);
    }
  }

  return tables;
}

export function validateReconciliationQuery(query, options = {}) {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query non fornita' };
  }

  const cleanedQuery = removeComments(query);
  const queryUpper = cleanedQuery.toUpperCase().trim();

  const semicolonCount = (cleanedQuery.match(/;/g) || []).length;
  if (semicolonCount > 0) {
    const trimmedQuery = cleanedQuery.trim();
    if (!trimmedQuery.endsWith(';') || semicolonCount > 1) {
      return { valid: false, error: 'Query con più statement non permesse (carattere ; non consentito)' };
    }
  }

  if (!queryUpper.startsWith('SELECT') && !queryUpper.startsWith('WITH')) {
    return { valid: false, error: 'La query deve iniziare con SELECT o WITH' };
  }

  const dangerousKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
    'INSERT', 'UPDATE', 'GRANT', 'REVOKE', 'EXEC',
    'EXECUTE', 'CALL', 'DECLARE', 'SET ROLE', 'SET SESSION',
    'COPY', 'VACUUM', 'ANALYZE', 'REINDEX', 'CLUSTER',
    'LOCK', 'UNLISTEN', 'NOTIFY', 'LISTEN', 'LOAD',
    'DO', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
    'PREPARE', 'DEALLOCATE', 'DISCARD', 'RESET',
    'INTO'
  ];

  for (const keyword of dangerousKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleanedQuery)) {
      return { valid: false, error: `Keyword non permessa: ${keyword}` };
    }
  }

  if (/\bUNION\b/i.test(cleanedQuery)) {
    return { valid: false, error: 'Keyword non permessa: UNION' };
  }

  const systemTables = [
    'pg_', 'information_schema', 'pg_catalog',
    'pg_stat', 'pg_settings', 'pg_shadow', 'pg_authid',
    'pg_roles', 'pg_user', 'pg_database', 'pg_tablespace'
  ];

  for (const sysTable of systemTables) {
    const regex = new RegExp(`\\b${sysTable}`, 'i');
    if (regex.test(cleanedQuery)) {
      return { valid: false, error: `Accesso a tabelle di sistema non permesso: ${sysTable}*` };
    }
  }

  const dangerousFunctions = [
    'pg_read_file', 'pg_read_binary_file', 'pg_ls_dir',
    'pg_stat_file', 'pg_sleep', 'dblink', 'lo_import',
    'lo_export', 'pg_terminate_backend', 'pg_cancel_backend',
    'current_setting', 'set_config', 'pg_reload_conf'
  ];

  for (const func of dangerousFunctions) {
    const regex = new RegExp(`\\b${func}\\s*\\(`, 'i');
    if (regex.test(cleanedQuery)) {
      return { valid: false, error: `Funzione non permessa: ${func}` };
    }
  }

  if (/\\x[0-9a-fA-F]{2}/.test(query) || /\\u[0-9a-fA-F]{4}/.test(query)) {
    return { valid: false, error: 'Sequenze di escape non permesse' };
  }

  if (!queryUpper.includes('FROM')) {
    return { valid: false, error: 'La query deve contenere FROM' };
  }

  const requiredColumns = ['external_key', 'total_hours', 'user_id'];
  const missingColumns = [];

  for (const col of requiredColumns) {
    const colRegex = new RegExp(`\\b${col}\\b|\\bAS\\s+${col}\\b`, 'i');
    if (!colRegex.test(cleanedQuery)) {
      missingColumns.push(col);
    }
  }

  if (missingColumns.length > 0) {
    return {
      valid: false,
      error: `La query deve restituire le colonne: ${missingColumns.join(', ')}`
    };
  }

  if (options.pmId) {
    const sanitizedPmId = options.pmId.replace(/-/g, '_');
    const allowedTables = [
      `pm_staging_${sanitizedPmId}`,
      `pm_users_view_${sanitizedPmId}`
    ];

    const queryWithoutStrings = removeStringLiterals(cleanedQuery);
    const referencedTables = extractAllTableReferences(queryWithoutStrings);

    for (const tableName of referencedTables) {
      if (!allowedTables.includes(tableName)) {
        return {
          valid: false,
          error: `Tabella non permessa: ${tableName}. Usa solo: ${allowedTables.join(', ')}`
        };
      }
    }

    if (referencedTables.size === 0) {
      return {
        valid: false,
        error: 'Nessuna tabella riconosciuta nella query'
      };
    }
  }

  return { valid: true };
}

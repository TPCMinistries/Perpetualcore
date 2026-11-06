import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

type RecordValue = Record<string, unknown>;
type Finding = { severity: 'error' | 'review'; code: string; location: string; explanation: string };
type Report = {
  kind: 'n8n_static_preflight';
  evidence: 'static_export_only';
  executableVerified: false;
  nodesInspected: number;
  findings: Finding[];
  requiredLiveChecks: string[];
};
const object = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string => typeof value === 'string' ? value : '';

// Reads exported configuration as data. It never evaluates expressions or node code,
// resolves credentials, calls a provider, or activates a workflow.
export function inspectExport(input: unknown): Report {
  const report: Report = {
    kind: 'n8n_static_preflight', evidence: 'static_export_only', executableVerified: false,
    nodesInspected: 0, findings: [],
    requiredLiveChecks: [
      'Reproduce the reported defect using a customer-approved test record.',
      'Confirm matching and nonmatching inputs follow the agreed business rules.',
      'Replay the same event and verify the agreed duplicate behavior.',
      'Verify missing fields cannot erase a good existing value.',
      'Simulate a failed destination and verify a real alert receipt.',
      'Reconnect customer-owned credentials and verify a controlled first run.',
    ],
  };
  const add = (severity: Finding['severity'], code: string, location: string, explanation: string): void => {
    report.findings.push({ severity, code, location, explanation });
  };
  const workflow: unknown = Array.isArray(input) && input.length === 1 ? input[0] : input;
  if (!object(workflow) || !Array.isArray(workflow.nodes) || !object(workflow.connections)) {
    add('error', 'EXPORT_SHAPE', 'workflow', 'Provide exactly one n8n workflow with nodes and connections.');
    return report;
  }
  if (workflow.nodes.length > 500) {
    add('error', 'SCOPE_LIMIT', 'workflow.nodes', 'More than 500 nodes requires a separate inspection scope.');
    return report;
  }
  const names = new Map<string, number>();
  const ids = new Set<string>();
  workflow.nodes.forEach((raw: unknown, index: number) => {
    const location = `nodes[${index}]`;
    if (!object(raw)) { add('error', 'NODE_SHAPE', location, 'Node must be an object.'); return; }
    report.nodesInspected += 1;
    const name=text(raw.name), id=text(raw.id), type=text(raw.type);
    if (!name || !type) add('error', 'NODE_FIELDS', location, 'Node name and type are required.');
    if (name && names.has(name)) add('error', 'DUPLICATE_NAME', location, 'Duplicate node names make references ambiguous.');
    if (id && ids.has(id)) add('error', 'DUPLICATE_ID', location, 'Duplicate node identifier.');
    if (name) names.set(name,index);
    if (id) ids.add(id);
    if (raw.disabled === true) add('review', 'DISABLED_NODE', location, 'Confirm this disabled node is intentionally bypassed.');
    if (raw.continueOnFail === true || raw.onError === 'continueRegularOutput') {
      add('review', 'CONTINUE_AFTER_ERROR', location, 'Failure may flow through the regular output. Verify downstream checks and alerting.');
    }
    if (raw.retryOnFail === true) add('review', 'RETRY_SIDE_EFFECT', location, 'Verify retry bounds and duplicate protection before replaying a side effect.');
    if (object(raw.credentials) && Object.keys(raw.credentials).length) {
      add('review', 'CREDENTIAL_RECONNECT', location, 'Credential references exist; connection validity and access are not established by this export.');
    }
    if (/httpRequest|googleSheets|airtable|gmail|slack/i.test(type)) {
      add('review', 'PROVIDER_BEHAVIOR', location, 'Provider permissions, field mapping, pagination and actual error behavior require runtime verification.');
    }
    if (/\.code$|\.function(Item)?$/.test(type)) {
      add('review', 'CODE_REVIEW', location, 'Custom code requires review. It has not been executed by this inspector.');
    }
  });
  let connections=0;
  for (const [source, channels] of Object.entries(workflow.connections)) {
    const location=names.has(source) ? `connections for nodes[${names.get(source)}]` : 'connections';
    if (!names.has(source)) add('error', 'MISSING_SOURCE', location, 'A connection refers to a source node absent from this export.');
    if (!object(channels)) { add('error','CHANNEL_SHAPE',location,'Connection channels must be an object.');continue; }
    for (const outputs of Object.values(channels)) {
      if (!Array.isArray(outputs)) { add('error','OUTPUT_SHAPE',location,'Channel outputs must be an array.');continue; }
      for (const branch of outputs) {
        if (!Array.isArray(branch)) { add('error','BRANCH_SHAPE',location,'Each output branch must be an array.');continue; }
        for (const edge of branch) {
          connections += 1;
          if (connections > 5000) { add('error','CONNECTION_LIMIT',location,'Connection limit exceeded.'); return report; }
          if (!object(edge) || !text(edge.node) || !names.has(text(edge.node))) {
            add('error','MISSING_DESTINATION',location,'A connection destination is invalid or absent from this export.');
          } else if (!Number.isInteger(edge.index) || Number(edge.index)<0 || !text(edge.type)) {
            add('error','EDGE_FIELDS',location,'Connection index and type need inspection.');
          }
        }
      }
    }
  }
  const scan=(value: unknown,location: string,depth: number): void => {
    if (depth>40) { add('review','NESTING_LIMIT',location,'Nested content was not inspected beyond depth 40.');return; }
    if (typeof value==='string') {
      const patterns=[/\$node\[\s*['"]([^'"]+)['"]\s*\]/g,/\$\(\s*['"]([^'"]+)['"]\s*\)/g];
      for (const pattern of patterns) for (const match of value.matchAll(pattern)) {
        if (!names.has(match[1])) add('review','UNRESOLVED_REFERENCE',location,'Text contains a node reference absent from this export. It may be literal text; inspect the expression.');
      }
    } else if (Array.isArray(value)) value.forEach((v)=>scan(v,location,depth+1));
    else if (object(value)) for (const [key,v] of Object.entries(value)) {
      if (/token|secret|password|api.?key|authorization/i.test(key)) {
        if (v!==null && v!==undefined && v!=='') add('review','POSSIBLE_SECRET',location,'Potentially sensitive configuration present; redact before sharing. No value is included in this report.');
      } else scan(v,location,depth+1);
    }
  };
  workflow.nodes.forEach((raw: unknown,index: number)=>{ if(object(raw))scan(raw.parameters,`nodes[${index}].parameters`,0); });
  if (workflow.active === true) add('review','ACTIVE_EXPORT','workflow','The export says active. Inspect a copy; live activation state has not been checked.');
  return report;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [source,destination]=process.argv.slice(2);
  if (!source || !destination) { console.error('Usage: node preflight.ts workflow.json report.json'); process.exitCode=1; }
  else {
    try {
      const bytes=await readFile(source);
      if(bytes.length>2_000_000) throw new Error('Export exceeds the 2 MB inspection limit.');
      const report=inspectExport(JSON.parse(bytes.toString('utf8')) as unknown);
      await writeFile(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
      console.log(JSON.stringify({reportWritten:true,nodesInspected:report.nodesInspected,errors:report.findings.filter(f=>f.severity==='error').length,reviewItems:report.findings.filter(f=>f.severity==='review').length,liveExecutionVerified:false}));
      if(report.findings.some(f=>f.severity==='error'))process.exitCode=2;
    } catch(error: unknown) { console.error(error instanceof Error ? error.message : 'Inspection failed.');process.exitCode=1; }
  }
}

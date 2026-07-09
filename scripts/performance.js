import fs from 'fs';
import path from 'path';

const perfFilePath = path.join(process.cwd(), 'server', 'storage', 'performance.json');

function run() {
  if (!fs.existsSync(perfFilePath)) {
    console.log('\x1b[31m[Performance CLI] No performance logs found. Please use the application first to generate metrics.\x1b[0m');
    return;
  }

  let rawData;
  try {
    rawData = fs.readFileSync(perfFilePath, 'utf8');
  } catch (error) {
    console.error('\x1b[31mFailed to read performance logs:\x1b[0m', error);
    return;
  }

  let logs = [];
  try {
    logs = JSON.parse(rawData);
  } catch (error) {
    console.error('\x1b[31mFailed to parse performance logs:\x1b[0m', error);
    return;
  }

  if (logs.length === 0) {
    console.log('\x1b[33m[Performance CLI] Performance logs are empty.\x1b[0m');
    return;
  }

  // Group by requestId
  const groups = {};
  for (const log of logs) {
    if (!log.requestId) continue;
    if (!groups[log.requestId]) {
      groups[log.requestId] = [];
    }
    groups[log.requestId].push(log);
  }

  let requestIndex = 1;
  const resetColor = '\x1b[0m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';
  
  for (const [requestId, group] of Object.entries(groups)) {
    // Sort events chronologically
    group.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Try to find a nice title for the request
    const frontendEvent = group.find(e => e.stage === 'Frontend');
    const expressEvent = group.find(e => e.stage === 'Express');
    const title = frontendEvent ? frontendEvent.operation : (expressEvent ? expressEvent.operation : `Request ${requestId}`);

    // Outermost request duration
    let totalDuration = 0;
    if (frontendEvent) {
      totalDuration = frontendEvent.durationMs;
    } else if (expressEvent) {
      totalDuration = expressEvent.durationMs;
    } else {
      // Fallback: take max duration of any top-level event (no parentId)
      const topLevelEvents = group.filter(e => !e.parentId);
      if (topLevelEvents.length > 0) {
        totalDuration = Math.max(...topLevelEvents.map(e => e.durationMs));
      } else {
        totalDuration = Math.max(...group.map(e => e.durationMs), 0);
      }
    }

    let statusText = '✓ Healthy';
    let statusColor = '\x1b[32m'; // Green

    if (totalDuration >= 1000) {
      statusText = '✖ Critical';
      statusColor = '\x1b[31m'; // Red
    } else if (totalDuration >= 500) {
      statusText = '⚠ Warning';
      statusColor = '\x1b[33m'; // Orange/Yellow
    } else if (totalDuration >= 300) {
      statusText = '⚠ Slow';
      statusColor = '\x1b[33m'; // Yellow
    }

    console.log(`\n${bold}#${requestIndex}  ${title}${resetColor}`);
    console.log(`${dim}---------------------------------------------------------------${resetColor}`);

    // Build the span tree
    const eventsBySpanId = {};
    const rootEvents = [];
    const parentToChildren = {};

    for (const event of group) {
      eventsBySpanId[event.spanId || event.id] = event;
    }

    for (const event of group) {
      const pid = event.parentId;
      if (pid && eventsBySpanId[pid]) {
        if (!parentToChildren[pid]) {
          parentToChildren[pid] = [];
        }
        parentToChildren[pid].push(event);
      } else {
        rootEvents.push(event);
      }
    }

    // Sort siblings chronologically
    for (const pid in parentToChildren) {
      parentToChildren[pid].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    rootEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Print Node DFS
    function printNode(event, depth = 0) {
      const indent = '    '.repeat(depth);
      let eventTitle = '';
      
      if (event.stage === 'Frontend') {
        eventTitle = `Frontend (${event.operation})`;
      } else if (event.stage === 'Render') {
        eventTitle = 'Render';
      } else if (event.stage === 'Response Serialization') {
        eventTitle = 'Response Serialization';
      } else if (event.stage === 'Database') {
        eventTitle = `Database`;
      } else {
        eventTitle = event.operation || event.stage;
      }

      if (event.stage === 'Database') {
        const meta = event.metadata || {};
        const acq = meta.acquireDurationMs !== undefined ? `${meta.acquireDurationMs.toFixed(1)} ms` : 'N/A';
        const exec = meta.executeDurationMs !== undefined ? `${meta.executeDurationMs.toFixed(1)} ms` : 'N/A';
        const rows = meta.rows !== undefined ? meta.rows : 'N/A';
        const sql = meta.sql || 'N/A';

        // Highlight database node duration
        let durationColor = dim;
        if (event.durationMs > 100) {
          durationColor = '\x1b[31m'; // Red
        } else if (event.durationMs > 50) {
          durationColor = '\x1b[33m'; // Orange/Yellow
        }

        console.log(`${indent}${bold}Database${resetColor} - ${durationColor}${event.durationMs.toFixed(1)} ms${resetColor}`);
        console.log(`${indent}    ${dim}Acquire Connection:${resetColor} ${acq}`);
        console.log(`${indent}    ${dim}SQL Execute:${resetColor} ${exec}`);
        console.log(`${indent}    ${dim}Rows Returned:${resetColor} ${rows}`);
        console.log(`${indent}    ${dim}SQL:${resetColor}`);
        console.log(`${indent}        ${dim}${sql.replace(/\n/g, '\n' + indent + '        ')}${resetColor}`);
      } else {
        console.log(`${indent}${bold}${eventTitle}${resetColor} - ${dim}${event.durationMs.toFixed(1)} ms${resetColor}`);
      }
      
      const children = parentToChildren[event.spanId || event.id] || [];
      for (const child of children) {
        printNode(child, depth + 1);
      }
    }

    for (const rootEvent of rootEvents) {
      printNode(rootEvent, 0);
    }

    console.log(`\n${bold}TOTAL: ${statusColor}${totalDuration.toFixed(1)} ms${resetColor}`);

    // Print SQL Query Summary Block
    const dbEvents = group.filter(e => e.stage === 'Database');
    if (dbEvents.length > 0) {
      console.log(`\n${bold}Queries:${resetColor}`);
      console.log(`${dim}───────────────────────────────────────────────────────────────${resetColor}`);
      let dbIndex = 1;
      let slowestQuery = dbEvents[0];
      for (const dbEvent of dbEvents) {
        const queryLabel = dbEvent.operation || 'SQL Query';
        const paddedLabel = queryLabel.padEnd(45, ' ');
        console.log(`${dbIndex}. ${paddedLabel} ${dbEvent.durationMs.toFixed(1)} ms`);
        if (dbEvent.durationMs > slowestQuery.durationMs) {
          slowestQuery = dbEvent;
        }
        dbIndex++;
      }
      console.log(`${dim}───────────────────────────────────────────────────────────────${resetColor}`);
      console.log(`${bold}Total Queries:${resetColor} ${dbEvents.length}`);
      console.log(`${bold}Slowest:${resetColor}\n${slowestQuery.operation} (${slowestQuery.durationMs.toFixed(1)} ms)`);
    }

    console.log(`\n${bold}Status:${resetColor}`);
    console.log(`${statusColor}${statusText}${resetColor}`);
    console.log(`${dim}===============================================================${resetColor}`);

    requestIndex++;
  }
}

run();

import fs from 'fs';
import path from 'path';

const storageDir = path.join(process.cwd(), 'server', 'storage');
const filesToRead = [
  path.join(storageDir, 'performance.json'),
  path.join(storageDir, 'performance.1.json'),
  path.join(storageDir, 'performance.2.json'),
];

function run() {
  const allEvents = [];

  for (const filePath of filesToRead) {
    if (fs.existsSync(filePath)) {
      try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        if (rawData.trim()) {
          const logs = JSON.parse(rawData);
          allEvents.push(...logs);
        }
      } catch (err) {
        // Ignore single file parse errors
      }
    }
  }

  if (allEvents.length === 0) {
    console.log('\x1b[31m[Doctor CLI] No performance events found. Run the app to gather metrics first!\x1b[0m');
    return;
  }

  // Group durations by stage
  const dbDurations = [];
  const repoDurations = [];
  const serviceDurations = [];
  const expressDurations = [];
  const frontendDurations = [];

  let slowestDbQuery = 0;
  let slowQueriesCount = 0;

  for (const event of allEvents) {
    const dur = event.durationMs;
    const stage = event.stage;

    if (stage === 'Database') {
      dbDurations.push(dur);
      if (dur > slowestDbQuery) {
        slowestDbQuery = dur;
      }
      if (dur > 50) {
        slowQueriesCount++;
      }
    } else if (stage === 'Repository') {
      repoDurations.push(dur);
    } else if (stage === 'Service') {
      serviceDurations.push(dur);
    } else if (stage === 'Express') {
      expressDurations.push(dur);
    } else if (stage === 'Frontend' || stage === 'Render') {
      frontendDurations.push(dur);
    }
  }

  const avg = (arr) => arr.length > 0 ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0;

  const dbAvg = avg(dbDurations);
  const repoAvg = avg(repoDurations);
  const serviceAvg = avg(serviceDurations);
  const expressAvg = avg(expressDurations);
  const frontAvg = avg(frontendDurations);

  // Status determinations
  const getStatus = (avgVal, healthyMax, warnText) => {
    if (avgVal === 0) return { label: '✓ No Data', color: '\x1b[37m' }; // White
    if (avgVal <= healthyMax) return { label: '✓ Healthy', color: '\x1b[32m' }; // Green
    return { label: `⚠ ${warnText}`, color: '\x1b[33m' }; // Yellow
  };

  const dbStatus = getStatus(dbAvg, 20, 'Query latency slightly high');
  const repoStatus = getStatus(repoAvg, 15, 'Repo operations slightly high');
  const serviceStatus = getStatus(serviceAvg, 15, 'Service layer slightly high');
  const expressStatus = getStatus(expressAvg, 30, 'Express routing slightly high');
  const frontStatus = getStatus(frontAvg, 60, 'Render slightly high');

  // Overall Grade
  let grade = 'A';
  let gradeText = 'Excellent';
  let gradeColor = '\x1b[32m'; // Green

  if (expressAvg === 0) {
    grade = 'N/A';
    gradeText = 'Insufficient data';
    gradeColor = '\x1b[37m';
  } else if (expressAvg >= 1000) {
    grade = 'F';
    gradeText = 'Critical Overhead';
    gradeColor = '\x1b[31m'; // Red
  } else if (expressAvg >= 500) {
    grade = 'D';
    gradeText = 'Poor Performance';
    gradeColor = '\x1b[31m';
  } else if (expressAvg >= 250) {
    grade = 'C';
    gradeText = 'Acceptable';
    gradeColor = '\x1b[33m'; // Yellow
  } else if (expressAvg >= 100) {
    grade = 'B';
    gradeText = 'Good';
    gradeColor = '\x1b[32m';
  }

  const bold = '\x1b[1m';
  const resetColor = '\x1b[0m';
  const dim = '\x1b[2m';

  console.log(`\n${bold}=================================================`);
  console.log(`WORKLEDGER HEALTH REPORT`);
  console.log(`=================================================${resetColor}`);

  console.log(`\n${bold}Database${resetColor}`);
  console.log(`${dbStatus.color}${dbStatus.label}${resetColor}`);
  console.log(`${dim}Average SQL${resetColor}   : ${dbAvg.toFixed(1)} ms`);
  console.log(`${dim}Slowest Query${resetColor} : ${slowestDbQuery.toFixed(1)} ms`);
  if (slowQueriesCount > 0) {
    console.log(`\x1b[33m⚠ ${slowQueriesCount} slow query execution(s) detected\x1b[0m`);
  }

  console.log(`\n${bold}Repository Layer${resetColor}`);
  console.log(`${repoStatus.color}${repoStatus.label}${resetColor}`);
  console.log(`${dim}Average${resetColor}       : ${repoAvg.toFixed(1)} ms`);

  console.log(`\n${bold}Service Layer${resetColor}`);
  console.log(`${serviceStatus.color}${serviceStatus.label}${resetColor}`);
  console.log(`${dim}Average${resetColor}       : ${serviceAvg.toFixed(1)} ms`);

  console.log(`\n${bold}Express${resetColor}`);
  console.log(`${expressStatus.color}${expressStatus.label}${resetColor}`);
  console.log(`${dim}Average${resetColor}       : ${expressAvg.toFixed(1)} ms`);

  console.log(`\n${bold}Frontend${resetColor}`);
  console.log(`${frontStatus.color}${frontStatus.label}${resetColor}`);
  console.log(`${dim}Average${resetColor}       : ${frontAvg.toFixed(1)} ms`);

  console.log(`\n${bold}Overall${resetColor}`);
  console.log(`${gradeColor}${grade}${resetColor}`);
  console.log(`${gradeColor}${gradeText}${resetColor}`);

  console.log(`\n${bold}=================================================${resetColor}`);
}

run();

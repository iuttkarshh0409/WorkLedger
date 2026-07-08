import { readLogs } from './services/logger.js';

async function run() {
  try {
    const logs = await readLogs();
    if (logs.length === 0) {
      console.log('\x1b[33mNo logs recorded yet.\x1b[0m');
      return;
    }

    console.log('\x1b[1m\x1b[36m================================================================');
    console.log('              WORKLEDGER REPLAYABLE STORY (LOGS)');
    console.log('================================================================\x1b[0m\n');

    for (const log of logs) {
      const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sequence = log.sequence;
      const eventCode = log.event.eventCode;
      
      // Formatting the event code/type dynamically with colors
      let badgeColor = '\x1b[37m'; // White
      if (eventCode.includes('Created')) badgeColor = '\x1b[32m'; // Green
      else if (eventCode.includes('Added')) badgeColor = '\x1b[34m'; // Blue
      else if (eventCode.includes('StatusChanged')) badgeColor = '\x1b[35m'; // Magenta
      else if (eventCode.includes('Uploaded')) badgeColor = '\x1b[33m'; // Yellow
      
      const badge = `${badgeColor}[${log.event.eventLabel || eventCode}]\x1b[0m`;
      
      console.log(`\x1b[90m#${sequence}\x1b[0m \x1b[32m${time}\x1b[0m ${badge} ${log.message}`);
      
      if (log.state?.transition) {
        console.log(`   \x1b[90mTransition:\x1b[0m \x1b[33m${log.state.transition}\x1b[0m`);
      }
      
      if (log.details?.timeInPreviousState || log.details?.elapsedSinceCreation) {
        const parts: string[] = [];
        if (log.details.timeInPreviousState) {
          parts.push(`time in previous state: \x1b[36m${log.details.timeInPreviousState}\x1b[0m`);
        }
        if (log.details.elapsedSinceCreation) {
          parts.push(`elapsed since creation: \x1b[36m${log.details.elapsedSinceCreation}\x1b[0m`);
        }
        console.log(`   \x1b[90mStats:\x1b[0m ${parts.join(' | ')}`);
      }
      
      console.log('\x1b[90m----------------------------------------------------------------\x1b[0m');
    }
  } catch (error) {
    console.error('Error reading story:', error);
  }
}

run();

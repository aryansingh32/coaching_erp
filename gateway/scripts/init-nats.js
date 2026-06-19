const { connect } = require('nats');

async function main() {
  const natsUrl = process.env.NATS_URL || 'nats://nats:4222';
  console.log(`Connecting to NATS at ${natsUrl} to initialize streams...`);
  
  let nc;
  // Retry connection if NATS is booting up
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      nc = await connect({ servers: natsUrl });
      break;
    } catch (err) {
      if (attempt === 10) throw err;
      console.log(`NATS connection attempt ${attempt} failed, retrying in 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const jsm = await nc.jetstreamManager();

  const streams = [
    { name: 'STUDENT_EVENTS', subjects: ['student.>'] },
    { name: 'BATCH_EVENTS', subjects: ['batch.>'] },
    { name: 'ATTENDANCE', subjects: ['attendance.>'] },
    { name: 'FEE_EVENTS', subjects: ['fee.>'] },
    { name: 'LMS_EVENTS', subjects: ['lms.>'] },
    { name: 'CLASS_EVENTS', subjects: ['class.>'] },
    { name: 'INSTITUTE_EVENTS', subjects: ['institute.>'] }
  ];

  for (const stream of streams) {
    try {
      await jsm.streams.add({
        name: stream.name,
        subjects: stream.subjects,
      });
      console.log(`Stream ${stream.name} initialized successfully.`);
    } catch (err) {
      if (err.message.includes('stream name already in use') || err.message.includes('stream already exists')) {
        console.log(`Stream ${stream.name} already exists.`);
      } else {
        console.error(`Error initializing stream ${stream.name}:`, err.message);
      }
    }
  }

  await nc.close();
  console.log('NATS stream initialization completed.');
}

main().catch((err) => {
  console.error('NATS initialization script failed:', err);
  process.exit(1);
});

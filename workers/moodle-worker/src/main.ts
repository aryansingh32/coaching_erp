import { AckPolicy, DeliverPolicy } from 'nats';
import { connect, StringCodec, NatsConnection, JetStreamManager } from 'nats';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const sc = StringCodec();

// Moodle API Wrapper
class MoodleClient {
  private baseUrl = process.env.MOODLE_URL || 'http://moodle:80';
  private token = process.env.MOODLE_ADMIN_TOKEN || '';

  async call(wsFunction: string, params: Record<string, any>) {
    try {
      const url = `${this.baseUrl}/webservice/rest/server.php`;
      const query = new URLSearchParams({
        wstoken: this.token,
        wsfunction: wsFunction,
        moodlewsrestformat: 'json',
        ...params,
      });

      const response = await axios.post(`${url}?${query.toString()}`);
      
      // Moodle returns 200 OK even for errors, need to check exception
      if (response.data && response.data.exception) {
        console.error(`Moodle error in ${wsFunction}:`, response.data);
        throw new Error(response.data.message || 'Moodle API Error');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error calling Moodle API ${wsFunction}:`, error.message);
      throw error;
    }
  }
}

const moodle = new MoodleClient();

async function bootstrap() {
  console.log('Starting Moodle Worker...');
  
  let nc: NatsConnection;
  try {
    nc = await connect({ servers: process.env.NATS_URL || 'nats://nats:4222' });
    console.log('Connected to NATS');
  } catch (err) {
    console.error('Failed to connect to NATS', err);
    process.exit(1);
  }

  const jsm = await nc.jetstreamManager();
  const js = nc.jetstream();

  // Ensure consumer exists
  try {
    await jsm.consumers.add('STUDENT_EVENTS', {
      durable_name: 'moodle-worker-student',
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: 'student.>'
    });
    
    await jsm.consumers.add('BATCH_EVENTS', {
      durable_name: 'moodle-worker-batch',
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: 'batch.>'
    });
  } catch (err) {
    console.error('Error creating consumers', err);
  }

  console.log('Listening for events...');

  // Subscribe to students
  const studentSub = await js.pullSubscribe('student.>', {
    config: { durable_name: 'moodle-worker-student' }
  });

  (async () => {
    for await (const msg of studentSub) {
      try {
        const payload = JSON.parse(sc.decode(msg.data));
        console.log(`Received ${msg.subject}:`, payload);
        
        if (msg.subject === 'student.created') {
           console.log(`Creating Moodle user for ${payload.erpId}`);
           await moodle.call('core_user_create_users', {
             'users[0][username]': (payload.erpId || payload.name).toLowerCase(),
             'users[0][password]': 'Changeme@123',
             'users[0][firstname]': payload.first_name || 'Student',
             'users[0][lastname]': payload.last_name || payload.erpId || payload.name,
             'users[0][email]': payload.student_email_id || `${payload.erpId || payload.name}@example.com`,
           });
        }
        
        msg.ack();
      } catch (err) {
        console.error('Error processing student event', err);
        msg.nak(); // Retry later
      }
    }
  })();
  
  // Pull continuously
  setInterval(() => {
    studentSub.pull({ batch: 10, expires: 5000 });
  }, 1000);

  // Subscribe to batches
  const batchSub = await js.pullSubscribe('batch.>', {
    config: { durable_name: 'moodle-worker-batch' }
  });

  (async () => {
    for await (const msg of batchSub) {
      try {
        const payload = JSON.parse(sc.decode(msg.data));
        console.log(`Received ${msg.subject}:`, payload);
        
        if (msg.subject === 'batch.created') {
           console.log(`Creating Moodle course for ${payload.batchName}`);
           await moodle.call('core_course_create_courses', {
             'courses[0][fullname]': payload.batchName || payload.name,
             'courses[0][shortname]': payload.batchName || payload.name,
             'courses[0][categoryid]': 1,
           });
        }
        
        msg.ack();
      } catch (err) {
        console.error('Error processing batch event', err);
        msg.nak();
      }
    }
  })();
  
  setInterval(() => {
    batchSub.pull({ batch: 10, expires: 5000 });
  }, 1000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await nc.drain();
    process.exit(0);
  });
}

bootstrap();

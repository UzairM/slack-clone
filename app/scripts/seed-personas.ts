import { seedPersonasFromConversation } from '../src/lib/ai/seed-personas';
import { personaMapping, sampleConversation } from './data/conversation-data';

async function main() {
  try {
    console.log('Starting persona seeding...');

    await seedPersonasFromConversation(
      sampleConversation,
      personaMapping,
      '!sample-room:localhost' // Replace with your actual room ID
    );

    console.log('Persona seeding completed successfully');
  } catch (error) {
    console.error('Error seeding personas:', error);
    process.exit(1);
  }
}

main();
